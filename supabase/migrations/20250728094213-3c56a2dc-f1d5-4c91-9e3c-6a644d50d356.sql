-- Create daily task assignments table
CREATE TABLE daily_task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id),
  assigned_date DATE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_template_id, worker_id, assigned_date)
);

-- Create task completion history table
CREATE TABLE task_completion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_assignment_id UUID REFERENCES daily_task_assignments(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id),
  task_title TEXT NOT NULL,
  task_description TEXT,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE daily_task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completion_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_task_assignments
CREATE POLICY "Workers can view their own daily assignments"
ON daily_task_assignments FOR SELECT
USING (worker_id = auth.uid());

CREATE POLICY "Workers can update their own daily assignments"
ON daily_task_assignments FOR UPDATE
USING (worker_id = auth.uid());

CREATE POLICY "Admins can manage all daily assignments"
ON daily_task_assignments FOR ALL
USING (get_current_user_role() = 'admin');

-- RLS policies for task_completion_history
CREATE POLICY "Workers can view their own completion history"
ON task_completion_history FOR SELECT
USING (worker_id = auth.uid());

CREATE POLICY "Workers can insert their own completion history"
ON task_completion_history FOR INSERT
WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Admins can view all completion history"
ON task_completion_history FOR SELECT
USING (get_current_user_role() = 'admin');

-- Function to expire old daily tasks
CREATE OR REPLACE FUNCTION expire_old_daily_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark tasks as expired after 24 hours
  UPDATE daily_task_assignments 
  SET status = 'expired'
  WHERE expires_at < NOW() 
    AND status = 'pending';
END;
$$;

-- Function to complete daily task and add to history
CREATE OR REPLACE FUNCTION complete_daily_task(assignment_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignment_record daily_task_assignments%ROWTYPE;
  task_record tasks%ROWTYPE;
  result jsonb;
BEGIN
  -- Get the assignment
  SELECT * INTO assignment_record
  FROM daily_task_assignments
  WHERE id = assignment_id AND worker_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assignment not found');
  END IF;

  -- Get the task details
  SELECT * INTO task_record
  FROM tasks
  WHERE id = assignment_record.task_template_id;

  -- Update assignment as completed
  UPDATE daily_task_assignments
  SET status = 'completed', completed_at = NOW()
  WHERE id = assignment_id;

  -- Insert into history
  INSERT INTO task_completion_history (
    daily_assignment_id,
    worker_id,
    project_id,
    task_title,
    task_description,
    completion_date,
    completed_at
  ) VALUES (
    assignment_id,
    assignment_record.worker_id,
    assignment_record.project_id,
    task_record.title,
    task_record.description,
    CURRENT_DATE,
    NOW()
  );

  result := jsonb_build_object('success', true);
  RETURN result;
END;
$$;

-- Create updated_at trigger for daily_task_assignments
CREATE TRIGGER update_daily_task_assignments_updated_at
  BEFORE UPDATE ON daily_task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();