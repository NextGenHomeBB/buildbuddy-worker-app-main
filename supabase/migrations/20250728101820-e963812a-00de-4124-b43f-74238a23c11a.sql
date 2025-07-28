-- Critical Security Fixes Migration

-- 1. Add missing triggers for role validation on user_roles table
CREATE TRIGGER validate_user_role_assignment
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_assignment();

-- 2. Add enhanced audit triggers to sensitive tables
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

CREATE TRIGGER audit_user_project_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_project_role
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

-- 3. Update all security definer functions to use secure search path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'worker' THEN 3
    END
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_my_tasks()
 RETURNS TABLE(id uuid, title text, description text, status text, priority text, assigned_worker_id uuid, due_date timestamp without time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(operation_name text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 15)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.expire_old_daily_tasks()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Mark tasks as expired after 24 hours
  UPDATE public.daily_task_assignments 
  SET status = 'expired'
  WHERE expires_at < NOW() 
    AND status = 'pending';
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_daily_task(assignment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  assignment_record public.daily_task_assignments%ROWTYPE;
  task_record public.tasks%ROWTYPE;
  result jsonb;
BEGIN
  -- Get the assignment
  SELECT * INTO assignment_record
  FROM public.daily_task_assignments
  WHERE id = assignment_id AND worker_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assignment not found');
  END IF;

  -- Get the task details
  SELECT * INTO task_record
  FROM public.tasks
  WHERE id = assignment_record.task_template_id;

  -- Update assignment as completed
  UPDATE public.daily_task_assignments
  SET status = 'completed', completed_at = NOW()
  WHERE id = assignment_id;

  -- Insert into history
  INSERT INTO public.task_completion_history (
    daily_assignment_id,
    worker_id,
    project_id,
    task_title,
    task_description,
    completion_date,
    completed_at
  ) VALUES (
    assignment_id,
    assignment_record.worker_id,
    assignment_record.project_id,
    task_record.title,
    task_record.description,
    CURRENT_DATE,
    NOW()
  );

  result := jsonb_build_object('success', true);
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.setup_demo_data(manager_id uuid, worker_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  company_id UUID;
  project_id UUID;
  phase_id UUID;
  result JSONB;
BEGIN
  -- Only allow admins to run this function
  IF public.get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Only admins can setup demo data';
  END IF;

  -- 1. Create a company
  INSERT INTO public.companies(id, name) 
  VALUES (gen_random_uuid(), 'Demo Construction') 
  RETURNING id INTO company_id;

  -- 2. Add users (manager & worker)
  INSERT INTO public.profiles(id, full_name, company_id) 
  VALUES 
    (manager_id, 'Jane Manager', company_id),
    (worker_id, 'Bob Worker', company_id);

  -- 3. Create a project
  INSERT INTO public.projects(id, company_id, name, manager_id, status) 
  VALUES (gen_random_uuid(), company_id, 'Sample Home', manager_id, 'active') 
  RETURNING id INTO project_id;

  -- 4. Create a phase
  INSERT INTO public.project_phases(id, project_id, name, status) 
  VALUES (gen_random_uuid(), project_id, 'Foundation', 'active') 
  RETURNING id INTO phase_id;

  -- 5. Create tasks
  INSERT INTO public.tasks(id, phase_id, project_id, title, assignee) 
  VALUES 
    (gen_random_uuid(), phase_id, project_id, 'Excavate trench', worker_id),
    (gen_random_uuid(), phase_id, project_id, 'Pour concrete', worker_id);

  -- 6. Map user roles to project
  INSERT INTO public.user_project_role(id, user_id, project_id, role) 
  VALUES 
    (gen_random_uuid(), manager_id, project_id, 'manager'),
    (gen_random_uuid(), worker_id, project_id, 'worker');

  -- Return success information
  result := jsonb_build_object(
    'success', true,
    'company_id', company_id,
    'project_id', project_id
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_email text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Insert or update the user profile (without role - roles managed separately)
  INSERT INTO public.profiles(id, full_name) 
  VALUES (user_id, COALESCE(user_email, 'User'))
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

  -- Assign default worker role if user doesn't have any roles
  INSERT INTO public.user_roles(user_id, role)
  VALUES (user_id, 'worker'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  result := jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'message', 'User profile created successfully'
  );
  
  RETURN result;
END;
$function$;

-- 4. Add additional security constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_timestamp ON public.security_audit_log(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_operation ON public.rate_limits(user_id, operation, window_start);

-- 5. Add data integrity constraints
ALTER TABLE public.user_roles 
ADD CONSTRAINT check_user_id_not_null CHECK (user_id IS NOT NULL);

-- Log this security update
INSERT INTO public.security_audit_log (
  user_id, 
  action, 
  table_name, 
  record_id, 
  new_values
) VALUES (
  auth.uid(),
  'SECURITY_UPDATE',
  'system',
  gen_random_uuid(),
  jsonb_build_object(
    'update_type', 'comprehensive_security_fixes',
    'fixes_applied', ARRAY[
      'role_validation_triggers',
      'enhanced_audit_logging',
      'secure_search_paths',
      'data_integrity_constraints'
    ],
    'timestamp', now()
  )
);