-- Update handle_new_user function to handle organization_id from JWT claims
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_id uuid;
  user_role text;
BEGIN
  -- Try to get organization_id and role from JWT claims
  org_id := (NEW.raw_user_meta_data ->> 'organization_id')::uuid;
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'worker');
  
  -- If no organization in JWT, fallback to current_org() or NULL
  IF org_id IS NULL THEN
    org_id := current_org();
  END IF;

  INSERT INTO public.profiles (
    id, 
    auth_user_id, 
    organization_id, 
    role, 
    full_name, 
    name,
    phone,
    company_name,
    is_placeholder
  )
  VALUES (
    NEW.id,
    NEW.id,
    org_id,
    user_role,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'company_name',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    auth_user_id = EXCLUDED.auth_user_id,
    organization_id = COALESCE(EXCLUDED.organization_id, profiles.organization_id),
    role = COALESCE(EXCLUDED.role, profiles.role);
  
  RETURN NEW;
END;
$function$;