-- Create task_lists table
CREATE TABLE public.task_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  color_hex text DEFAULT '#3478F6',
  owner_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add list_id and position columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN list_id uuid REFERENCES public.task_lists(id) ON DELETE SET NULL,
ADD COLUMN position integer DEFAULT 0;

-- Enable RLS on task_lists
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_lists
CREATE POLICY "Users can view their own task lists" 
ON public.task_lists 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own task lists" 
ON public.task_lists 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own task lists" 
ON public.task_lists 
FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own task lists" 
ON public.task_lists 
FOR DELETE 
USING (owner_id = auth.uid());

-- Create view for task lists with counts
CREATE OR REPLACE VIEW worker.task_lists_v AS
SELECT 
  l.*,
  COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'todo'), 0) as open_count,
  COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'completed'), 0) as done_count,
  COALESCE(COUNT(t.id), 0) as total_count
FROM task_lists l
LEFT JOIN tasks t ON t.list_id = l.id AND t.assignee = auth.uid()
WHERE l.owner_id = auth.uid()
GROUP BY l.id, l.name, l.color_hex, l.owner_id, l.created_at, l.updated_at
ORDER BY l.created_at ASC;

-- Create indexes for better performance
CREATE INDEX idx_tasks_list_id ON public.tasks(list_id);
CREATE INDEX idx_tasks_position ON public.tasks(position);
CREATE INDEX idx_task_lists_owner_id ON public.task_lists(owner_id);

-- Add trigger for automatic timestamp updates on task_lists
CREATE TRIGGER update_task_lists_updated_at
BEFORE UPDATE ON public.task_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();