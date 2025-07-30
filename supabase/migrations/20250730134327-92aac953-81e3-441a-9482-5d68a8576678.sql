-- Fix RLS policies for tasks table to allow INSERT operations

-- Add INSERT policy for tasks
CREATE POLICY "Tasks: user insert own" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  organization_id = current_org() 
  AND (assigned_to = auth.uid() OR get_current_user_role() = 'admin')
);

-- Also ensure we have a default project for new organizations
-- Create a default project if none exists
DO $$
DECLARE
  default_org_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  project_exists boolean;
BEGIN
  -- Check if default project exists
  SELECT EXISTS(
    SELECT 1 FROM public.projects 
    WHERE organization_id = default_org_id
  ) INTO project_exists;
  
  -- Create default project if it doesn't exist
  IF NOT project_exists THEN
    INSERT INTO public.projects (
      name, 
      description, 
      organization_id, 
      status,
      budget,
      type
    ) VALUES (
      'Default Project',
      'Default project for task organization',
      default_org_id,
      'active',
      0,
      'other'
    );
  END IF;
END $$;