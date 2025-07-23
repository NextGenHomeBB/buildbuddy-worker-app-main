-- Drop the faulty policy
DROP POLICY IF EXISTS "Projects: members read" ON public.projects;

-- Drop the faulty update policy too
DROP POLICY IF EXISTS "Projects: manager/admin update" ON public.projects;

-- These policies are redundant since we already have working ones:
-- "Users can read assigned projects" and "Admin full access to projects"