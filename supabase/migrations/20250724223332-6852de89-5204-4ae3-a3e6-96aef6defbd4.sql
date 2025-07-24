-- Fix security linter warnings by setting proper search_path on functions

-- Fix 1: Update validate_role_assignment function with proper search_path
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix 2: Update validate_task_assignment function with proper search_path
CREATE OR REPLACE FUNCTION public.validate_task_assignment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix 3: Update get_my_tasks function with proper search_path
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
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
$$;

-- Fix 4: Update enhanced_audit_trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.enhanced_audit_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix 5: Update check_rate_limit function with proper search_path
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  operation_name text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
) 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
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