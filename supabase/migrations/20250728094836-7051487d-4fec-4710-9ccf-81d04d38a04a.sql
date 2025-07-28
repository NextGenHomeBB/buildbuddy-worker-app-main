-- Insert sample daily task assignments for testing
-- First, ensure we have some basic tasks to use as templates
INSERT INTO tasks (id, title, description, priority, status, assignee, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Install electrical outlets', 'Install all electrical outlets in the main floor', 'high', 'todo', (SELECT id FROM auth.users LIMIT 1), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Check water pressure', 'Test water pressure in all bathrooms and kitchen', 'medium', 'todo', (SELECT id FROM auth.users LIMIT 1), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Paint interior walls', 'Paint walls in living room and bedrooms', 'low', 'todo', (SELECT id FROM auth.users LIMIT 1), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample daily task assignments for today
INSERT INTO daily_task_assignments (
  task_template_id, 
  worker_id, 
  assigned_date, 
  expires_at, 
  status
)
SELECT 
  t.id as task_template_id,
  u.id as worker_id,
  CURRENT_DATE as assigned_date,
  (CURRENT_DATE + INTERVAL '1 day') as expires_at,
  'pending' as status
FROM tasks t
CROSS JOIN (SELECT id FROM auth.users LIMIT 1) u
WHERE t.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
ON CONFLICT (task_template_id, worker_id, assigned_date) DO NOTHING;