
-- Drop the problematic RLS policy that's not working correctly
DROP POLICY IF EXISTS "Users can read assigned projects" ON public.projects;

-- Create a more reliable and comprehensive policy that checks both user_project_role and assigned_workers
CREATE POLICY "Users can read their assigned projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (
  -- Check if user has a role in user_project_role table for this project
  EXISTS (
    SELECT 1 
    FROM public.user_project_role upr 
    WHERE upr.user_id = auth.uid() 
    AND upr.project_id = projects.id
  )
  OR
  -- Also check if user is in the assigned_workers JSONB array
  (assigned_workers ? auth.uid()::text)
);
