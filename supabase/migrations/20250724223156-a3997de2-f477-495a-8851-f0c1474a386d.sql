-- Security Fix 1: Prevent users from assigning themselves admin/manager roles
-- Add validation function for role assignments
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent self-assignment of admin or manager roles unless done by an admin
  IF NEW.role IN ('admin', 'manager') AND NEW.user_id = auth.uid() THEN
    IF NOT user_has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Users cannot assign themselves admin or manager roles';
    END IF;
  END IF;
  
  -- Only admins can assign admin role
  IF NEW.role = 'admin' AND NOT user_has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign admin roles';
  END IF;
  
  -- Only admins or managers can assign manager role
  IF NEW.role = 'manager' AND NOT (user_has_role(auth.uid(), 'admin') OR user_has_role(auth.uid(), 'manager')) THEN
    RAISE EXCEPTION 'Only admins or managers can assign manager roles';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation trigger to user_roles
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_assignment();

-- Security Fix 2: Enhanced task assignment validation
CREATE OR REPLACE FUNCTION public.validate_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If assigning a task to someone, verify they have project access
  IF NEW.assignee IS NOT NULL AND NEW.project_id IS NOT NULL THEN
    -- Check if assignee has access to the project
    IF NOT EXISTS (
      SELECT 1 FROM public.user_project_role 
      WHERE user_id = NEW.assignee AND project_id = NEW.project_id
    ) AND NOT user_has_role(NEW.assignee, 'admin') THEN
      RAISE EXCEPTION 'Cannot assign task to user without project access';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply task assignment validation trigger
CREATE TRIGGER validate_task_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_task_assignment();

-- Security Fix 3: Fix the database view security issue
-- Drop the problematic view and recreate it with proper security
DROP VIEW IF EXISTS worker.my_tasks_view;

-- Create a secure function instead of a view
CREATE OR REPLACE FUNCTION public.get_my_tasks()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  assigned_worker_id uuid,
  due_date timestamp without time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
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
  WHERE t.assignee = auth.uid()
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Security Fix 4: Enhanced audit logging for sensitive operations
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
CREATE TRIGGER enhanced_audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

CREATE TRIGGER enhanced_audit_user_project_role
  AFTER INSERT OR UPDATE OR DELETE ON public.user_project_role
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

CREATE TRIGGER enhanced_audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

-- Security Fix 5: Add rate limiting table for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits policy
CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (true);

-- Function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  operation_name text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
) RETURNS boolean AS $$
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
    attempt_count = rate_limits.attempt_count + 1,
    window_start = CASE 
      WHEN rate_limits.window_start < window_start_time THEN now()
      ELSE rate_limits.window_start
    END;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;