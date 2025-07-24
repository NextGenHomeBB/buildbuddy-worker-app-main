-- Update the tasks INSERT policy to allow workers to create tasks assigned to themselves
DROP POLICY IF EXISTS "Tasks: admin and project managers can insert" ON public.tasks;

CREATE POLICY "Tasks: create access for authorized users" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  -- Admins can create any task
  get_current_user_role() = 'admin'::text 
  OR 
  -- Project managers can create tasks in their projects
  (EXISTS (
    SELECT 1 FROM user_project_role upr 
    WHERE upr.user_id = auth.uid() 
    AND upr.project_id = tasks.project_id 
    AND upr.role = ANY (ARRAY['manager'::text, 'admin'::text])
  ))
  OR
  -- Workers can create tasks assigned to themselves in projects they're part of
  (assignee = auth.uid() AND EXISTS (
    SELECT 1 FROM user_project_role upr 
    WHERE upr.user_id = auth.uid() 
    AND upr.project_id = tasks.project_id
  ))
);