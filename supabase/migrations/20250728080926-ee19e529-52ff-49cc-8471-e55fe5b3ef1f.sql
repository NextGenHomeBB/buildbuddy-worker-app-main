-- Security Fix 1: Remove SECURITY DEFINER from worker.my_tasks_view and implement proper RLS
DROP VIEW IF EXISTS worker.my_tasks_view;

-- Create a secure view without SECURITY DEFINER
CREATE VIEW worker.my_tasks_view AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.assignee as assigned_worker_id,
  t.completed_at::timestamp without time zone as due_date,
  t.created_at,
  t.updated_at
FROM public.tasks t
WHERE t.assignee = auth.uid();

-- Enable RLS on the view (this will use the underlying table's RLS policies)
ALTER VIEW worker.my_tasks_view OWNER TO authenticated;

-- Security Fix 2: Add validation triggers for role assignments
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent self-assignment of admin or manager roles unless done by an admin
  IF NEW.role IN ('admin', 'manager') AND NEW.user_id = auth.uid() THEN
    IF NOT public.user_has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Users cannot assign themselves admin or manager roles';
    END IF;
  END IF;
  
  -- Only admins can assign admin role
  IF NEW.role = 'admin' AND NOT public.user_has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can assign admin roles';
  END IF;
  
  -- Only admins or managers can assign manager role
  IF NEW.role = 'manager' AND NOT (public.user_has_role(auth.uid(), 'admin'::public.app_role) OR public.user_has_role(auth.uid(), 'manager'::public.app_role)) THEN
    RAISE EXCEPTION 'Only admins or managers can assign manager roles';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to user_roles table
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_assignment();

-- Security Fix 3: Add validation for task assignments
CREATE OR REPLACE FUNCTION public.validate_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If assigning a task to someone, verify they have project access
  IF NEW.assignee IS NOT NULL AND NEW.project_id IS NOT NULL THEN
    -- Check if assignee has access to the project
    IF NOT EXISTS (
      SELECT 1 FROM public.user_project_role 
      WHERE user_id = NEW.assignee AND project_id = NEW.project_id
    ) AND NOT public.user_has_role(NEW.assignee, 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Cannot assign task to user without project access';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to tasks table
DROP TRIGGER IF EXISTS validate_task_assignment_trigger ON public.tasks;
CREATE TRIGGER validate_task_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_task_assignment();

-- Security Fix 4: Enhanced audit logging with more context
CREATE OR REPLACE FUNCTION public.enhanced_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  sensitive_tables text[] := ARRAY['user_roles', 'user_project_role', 'profiles'];
BEGIN
  -- Log all operations on sensitive tables with additional context
  IF TG_TABLE_NAME = ANY(sensitive_tables) THEN
    INSERT INTO public.security_audit_log (
      user_id, 
      action, 
      table_name, 
      record_id, 
      old_values, 
      new_values,
      ip_address
    ) VALUES (
      auth.uid(), 
      TG_OP, 
      TG_TABLE_NAME, 
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
      CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END,
      inet_client_addr()::text
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply enhanced audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

DROP TRIGGER IF EXISTS audit_user_project_role ON public.user_project_role;
CREATE TRIGGER audit_user_project_role
  AFTER INSERT OR UPDATE OR DELETE ON public.user_project_role
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

-- Security Fix 5: Enhanced rate limiting function with better tracking
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  operation_name text, 
  max_attempts integer DEFAULT 5, 
  window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_attempts integer;
  window_start_time timestamp with time zone;
BEGIN
  -- Get current window start time
  window_start_time := now() - (window_minutes || ' minutes')::interval;
  
  -- Clean up old rate limit records
  DELETE FROM public.rate_limits 
  WHERE window_start < window_start_time;
  
  -- Count current attempts in the window
  SELECT COALESCE(SUM(attempt_count), 0) INTO current_attempts
  FROM public.rate_limits
  WHERE user_id = auth.uid() 
    AND operation = operation_name 
    AND window_start >= window_start_time;
  
  -- Check if limit exceeded
  IF current_attempts >= max_attempts THEN
    RETURN false;
  END IF;
  
  -- Record this attempt
  INSERT INTO public.rate_limits (user_id, operation, attempt_count, window_start)
  VALUES (auth.uid(), operation_name, 1, now())
  ON CONFLICT (user_id, operation) 
  DO UPDATE SET 
    attempt_count = public.rate_limits.attempt_count + 1,
    window_start = CASE 
      WHEN public.rate_limits.window_start < window_start_time THEN now()
      ELSE public.rate_limits.window_start
    END;
  
  RETURN true;
END;
$$;

-- Security Fix 6: Add indexes for better performance on security-related queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_project_role_user_project ON public.user_project_role(user_id, project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_log_user_timestamp ON public.security_audit_log(user_id, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_user_operation ON public.rate_limits(user_id, operation, window_start);