-- Check current user and create daily task assignments for them
-- First, let's see what tasks we have and create assignments for the current authenticated user

-- Get the current user ID and create daily assignments
INSERT INTO daily_task_assignments (
  task_template_id, 
  worker_id, 
  assigned_date, 
  expires_at, 
  status
)
SELECT 
  t.id as task_template_id,
  auth.uid() as worker_id,
  CURRENT_DATE as assigned_date,
  (CURRENT_DATE + INTERVAL '1 day') as expires_at,
  'pending' as status
FROM tasks t
WHERE t.assignee = auth.uid()
  AND t.status != 'done'
LIMIT 5
ON CONFLICT (task_template_id, worker_id, assigned_date) DO NOTHING;

-- If no tasks exist for the user, create some sample ones
INSERT INTO tasks (title, description, priority, status, assignee, created_at, updated_at)
SELECT 
  'Daily Inspection Task',
  'Perform daily safety and quality inspection',
  'high',
  'todo',
  auth.uid(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE assignee = auth.uid()
);

-- Create daily assignment for the new task if we just created it
INSERT INTO daily_task_assignments (
  task_template_id, 
  worker_id, 
  assigned_date, 
  expires_at, 
  status
)
SELECT 
  t.id as task_template_id,
  auth.uid() as worker_id,
  CURRENT_DATE as assigned_date,
  (CURRENT_DATE + INTERVAL '1 day') as expires_at,
  'pending' as status
FROM tasks t
WHERE t.assignee = auth.uid()
  AND t.title = 'Daily Inspection Task'
ON CONFLICT (task_template_id, worker_id, assigned_date) DO NOTHING;