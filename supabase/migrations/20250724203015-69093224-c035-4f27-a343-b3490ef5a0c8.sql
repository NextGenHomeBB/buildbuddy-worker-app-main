-- Update work_role column to support multiple roles as JSON array
-- First drop the default value, then change type, then add new default
ALTER TABLE public.profiles 
ALTER COLUMN work_role DROP DEFAULT;

ALTER TABLE public.profiles 
ALTER COLUMN work_role TYPE JSONB USING 
  CASE 
    WHEN work_role IS NULL THEN '["Construction Worker"]'::jsonb
    ELSE jsonb_build_array(work_role)
  END;

ALTER TABLE public.profiles 
ALTER COLUMN work_role SET DEFAULT '["Construction Worker"]'::jsonb;