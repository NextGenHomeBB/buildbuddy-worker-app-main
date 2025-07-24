-- Create task_relations table
CREATE TABLE IF NOT EXISTS public.task_relations (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  src_task  UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  dest_task UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  relation  TEXT CHECK (relation IN ('blocks','relates','duplicate')) DEFAULT 'relates',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (src_task, dest_task)
);

-- Enable RLS
ALTER TABLE public.task_relations ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_relations
CREATE POLICY "Workers can manage relations for their tasks"
ON public.task_relations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = task_relations.src_task AND assignee = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = task_relations.dest_task AND assignee = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = task_relations.src_task AND assignee = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = task_relations.dest_task AND assignee = auth.uid()
  )
);

-- Create worker schema if not exists
CREATE SCHEMA IF NOT EXISTS worker;

-- Create view for worker task map
CREATE OR REPLACE VIEW worker.task_map_v AS
SELECT 
  tr.*,
  ts.title AS src_title,
  td.title AS dest_title
FROM public.task_relations tr
JOIN public.tasks ts ON ts.id = tr.src_task
JOIN public.tasks td ON td.id = tr.dest_task
WHERE ts.assignee = auth.uid() OR td.assignee = auth.uid();