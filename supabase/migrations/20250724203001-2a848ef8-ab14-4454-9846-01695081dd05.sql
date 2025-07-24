-- Update work_role column to support multiple roles as JSON array
ALTER TABLE public.profiles 
ALTER COLUMN work_role TYPE JSONB USING 
  CASE 
    WHEN work_role IS NULL THEN '["Construction Worker"]'::jsonb
    ELSE jsonb_build_array(work_role)
  END;