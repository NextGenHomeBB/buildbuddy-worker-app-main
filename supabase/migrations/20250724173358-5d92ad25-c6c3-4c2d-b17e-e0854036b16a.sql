-- Phase 1: Fix Critical Database Security Issues

-- Step 1: Create app_role enum and user_roles table for proper role management
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'worker');

-- Create secure user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'worker',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT 
  id, 
  CASE 
    WHEN role = 'admin' THEN 'admin'::app_role
    WHEN role = 'manager' THEN 'manager'::app_role
    ELSE 'worker'::app_role
  END,
  created_at
FROM public.profiles 
WHERE role IS NOT NULL;

-- Step 3: Create secure helper function to check user roles
CREATE OR REPLACE FUNCTION public.user_has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to get current user's role (single role per user)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Step 4: Fix existing database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_phase_progress(phase uuid)
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.project_phases
  SET progress = (
    SELECT 100.0 * count(*) FILTER (WHERE status = 'done')
           / GREATEST(count(*),1)
    FROM public.tasks
    WHERE phase_id = phase)
  WHERE id = phase;
$$;

CREATE OR REPLACE FUNCTION public.tasks_progress_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.update_phase_progress(NEW.phase_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_project_progress(proj uuid)
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.projects
  SET progress = (
    SELECT coalesce(avg(progress),0)
    FROM public.project_phases
    WHERE project_id = proj)
  WHERE id = proj;
$$;

CREATE OR REPLACE FUNCTION public.phase_progress_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM public.update_project_progress(NEW.project_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update create_user_profile function with proper security
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_email text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Step 5: Drop problematic security definer views and replace with secure alternatives
DROP VIEW IF EXISTS public.project_phases_v CASCADE;
DROP VIEW IF EXISTS public.project_summary_view CASCADE;
DROP VIEW IF EXISTS worker.my_tasks_view CASCADE;

-- Create secure worker tasks view that respects RLS
CREATE OR REPLACE VIEW worker.my_tasks_view AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.assignee as assigned_worker_id,
  t.created_at,
  t.updated_at,
  NULL::timestamp as due_date
FROM public.tasks t
WHERE t.assignee = auth.uid();

-- Step 6: Update RLS policies to use new role system

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Profiles: self update (no role)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile role" ON public.profiles;

-- Update profiles policies to remove role management
CREATE POLICY "Profiles: self update (no role changes)" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.user_has_role(auth.uid(), 'admin'))
WITH CHECK (public.user_has_role(auth.uid(), 'admin'));

-- Step 7: Remove role column from profiles table (after migration)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Step 8: Add security triggers for audit trails
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.user_has_role(auth.uid(), 'admin'));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.security_audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.security_audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.security_audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers to sensitive tables
CREATE TRIGGER user_roles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();