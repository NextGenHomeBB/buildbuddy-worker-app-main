-- Drop the existing view from worker schema
DROP VIEW IF EXISTS worker.my_tasks_view;
DROP SCHEMA IF EXISTS worker;

-- Create the view in public schema with the correct naming
CREATE VIEW public."worker.my_tasks_view" AS
SELECT 
  t.id,
  t.title,
  t.description,
  CASE 
    WHEN t.status = 'todo' THEN 'pending'
    WHEN t.status = 'in_progress' THEN 'in_progress'
    WHEN t.status = 'done' THEN 'completed'
    ELSE 'pending'
  END as status,
  t.priority,
  t.assignee as assigned_worker_id,
  t.created_at,
  COALESCE(t.completed_at, t.created_at) as updated_at,
  NULL::timestamp as due_date
FROM tasks t
WHERE t.assignee = auth.uid();