-- Reset task assignments - only assign 2 tasks to Khaled, leave others unassigned
UPDATE tasks 
SET assigned_to = NULL
WHERE organization_id = '00000000-0000-0000-0000-000000000001';

-- Assign only the first 2 tasks to Khaled for testing
UPDATE tasks 
SET assigned_to = 'b4bf8ffc-b744-4c2c-a2c2-ca7014abfc08'
WHERE id IN (
  SELECT id 
  FROM tasks 
  WHERE organization_id = '00000000-0000-0000-0000-000000000001'
  ORDER BY created_at
  LIMIT 2
);