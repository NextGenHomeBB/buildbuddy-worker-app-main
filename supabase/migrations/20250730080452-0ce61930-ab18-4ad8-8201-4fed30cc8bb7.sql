-- Fix RLS policy for project_schedules table
CREATE POLICY "ProjectSchedules: org members read" 
ON public.project_schedules 
FOR SELECT 
USING (organization_id = current_org());

CREATE POLICY "ProjectSchedules: admin manage" 
ON public.project_schedules 
FOR ALL 
USING ((organization_id = current_org()) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text));

-- Fix function search path issues by setting security definer search path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  NEW.updated_at := now();
  return NEW;
end;
$function$;

CREATE OR REPLACE FUNCTION public.current_org()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  select (auth.jwt() ->> 'organization_id')::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid,
  user_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, organization_id, role, full_name)
  VALUES (
    user_id,
    current_org(),
    'admin', -- Default new users to admin for testing
    COALESCE(split_part(user_email, '@', 1), 'User')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
END;
$$;