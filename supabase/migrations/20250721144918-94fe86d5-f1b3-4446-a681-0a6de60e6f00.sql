-- Remove the current INSERT policy that's causing the RLS violation
DROP POLICY IF EXISTS "Tasks: authenticated users can create tasks" ON public.tasks;

-- Create a completely permissive INSERT policy for now
CREATE POLICY "Tasks: allow all authenticated inserts" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (assignee = auth.uid());

-- Also ensure the user can read their own tasks
DROP POLICY IF EXISTS "Tasks: members read" ON public.tasks;
CREATE POLICY "Tasks: users can read their assigned tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (assignee = auth.uid());