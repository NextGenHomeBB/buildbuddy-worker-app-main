-- Check current RLS policies on tasks table
-- Add INSERT policy for authenticated users to create their own tasks
CREATE POLICY "Tasks: users can create their own tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (assignee = auth.uid());

-- Also ensure users can insert tasks for projects they're members of
CREATE POLICY "Tasks: project members can create tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_project_role upr 
    WHERE upr.user_id = auth.uid() 
    AND upr.project_id = tasks.project_id
  )
);