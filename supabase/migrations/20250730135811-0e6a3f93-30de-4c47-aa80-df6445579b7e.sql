-- Update the unassigned tasks to be assigned to Khaled (the worker)
UPDATE tasks 
SET assigned_to = 'b4bf8ffc-b744-4c2c-a2c2-ca7014abfc08'
WHERE assigned_to IS NULL 
AND organization_id = '00000000-0000-0000-0000-000000000001';