-- Create the worker.my_tasks_view that the frontend expects
CREATE VIEW worker.my_tasks_view AS
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