-- ==============================================
-- CRITICAL SECURITY FIXES
-- ==============================================

-- 1. CREATE SECURE ROLE MANAGEMENT SYSTEM
-- ==============================================

-- Create role enum for better type safety
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'worker');

-- Create secure user_roles table
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'worker',
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$$;

-- Create security definer function for current user role (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.get_user_role(auth.uid());
$$;

-- 2. MIGRATE EXISTING ROLE DATA
-- ==============================================

-- Migrate existing roles from profiles to user_roles table
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT id, role::app_role, created_at
FROM public.profiles 
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove role column from profiles table (security vulnerability)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 3. CREATE SECURE RLS POLICIES FOR USER_ROLES
-- ==============================================

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only admins can insert/update/delete roles
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- 4. UPDATE PROFILES TABLE RLS POLICIES
-- ==============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Profiles: self update (no role)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile role" ON public.profiles;

-- Create secure profile policies (no role management)
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 5. FIX DATABASE FUNCTIONS SECURITY
-- ==============================================

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_phase_progress(phase uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE project_phases
  SET progress = (
    SELECT 100.0 * count(*) FILTER (WHERE status = 'done')
           / GREATEST(count(*),1)
    FROM tasks
    WHERE phase_id = phase)
  WHERE id = phase;
$$;

CREATE OR REPLACE FUNCTION public.tasks_progress_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE projects
  SET progress = (
    SELECT COALESCE(avg(progress),0)
    FROM project_phases
    WHERE project_id = proj)
  WHERE id = proj;
$$;

CREATE OR REPLACE FUNCTION public.phase_progress_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.update_project_progress(NEW.project_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_demo_data(manager_id uuid, worker_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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

  -- 2. Add users (manager & worker) to user_roles
  INSERT INTO public.profiles(id, full_name, company_id) 
  VALUES 
    (manager_id, 'Jane Manager', company_id),
    (worker_id, 'Bob Worker', company_id);
    
  INSERT INTO public.user_roles(user_id, role, assigned_by)
  VALUES 
    (manager_id, 'manager', auth.uid()),
    (worker_id, 'worker', auth.uid());

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
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_email text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert or update the user profile (without role)
  INSERT INTO public.profiles(id, full_name) 
  VALUES (user_id, COALESCE(user_email, 'User'))
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

  -- Assign default worker role if user doesn't have any role
  INSERT INTO public.user_roles(user_id, role)
  VALUES (user_id, 'worker')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Return success information
  result := jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'message', 'User profile created successfully'
  );
  
  RETURN result;
END;
$$;

-- 6. DROP SECURITY DEFINER VIEWS (CRITICAL SECURITY ISSUE)
-- ==============================================

-- Drop the problematic security definer views that bypass RLS
DROP VIEW IF EXISTS public.project_phases_v CASCADE;
DROP VIEW IF EXISTS public.project_summary_view CASCADE;
DROP VIEW IF EXISTS worker.my_tasks_view CASCADE;

-- Create secure replacements without SECURITY DEFINER
CREATE VIEW public.project_phases_v AS
SELECT 
    pp.id,
    pp.project_id,
    pp.name,
    pp.description,
    pp.status,
    pp.start_date,
    pp.end_date,
    pp.progress,
    pp.created_at,
    p.name as project_name,
    p.budget as project_budget,
    COALESCE(task_stats.total_tasks, 0) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0) as completed_tasks
FROM public.project_phases pp
LEFT JOIN public.projects p ON pp.project_id = p.id
LEFT JOIN (
    SELECT 
        phase_id,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed_tasks
    FROM public.tasks
    GROUP BY phase_id
) task_stats ON pp.id = task_stats.phase_id;

CREATE VIEW public.project_summary_view AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.progress,
    p.start_date,
    p.budget,
    c.name as company_name
FROM public.projects p
LEFT JOIN public.companies c ON p.company_id = c.id;

-- Create secure my_tasks view that respects RLS
CREATE VIEW public.my_tasks_view AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.assignee as assigned_worker_id,
    t.created_at,
    t.updated_at,
    t.completed_at::timestamp as due_date
FROM public.tasks t
WHERE t.assignee = auth.uid();

-- 7. CREATE FUNCTION TO CHECK USER ROLES
-- ==============================================

CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, check_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = $1 AND role::text = $2
  );
$$;