-- First, ensure we have a default organization
INSERT INTO public.organizations (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization')
ON CONFLICT (id) DO NOTHING;

-- Update current_org function to provide better fallback
CREATE OR REPLACE FUNCTION public.current_org()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (auth.jwt() ->> 'organization_id')::uuid,
    (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid  -- Default organization fallback
  );
$function$;

-- Update handle_new_user function to ensure organization_id is never NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  org_id uuid;
  user_role text;
  default_org_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Try to get organization_id and role from JWT claims
  org_id := (NEW.raw_user_meta_data ->> 'organization_id')::uuid;
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'worker');
  
  -- If no organization in JWT, use current_org() or default
  IF org_id IS NULL THEN
    org_id := current_org();
    -- Final fallback to default organization
    IF org_id IS NULL THEN
      org_id := default_org_id;
    END IF;
  END IF;

  -- Log for debugging
  RAISE LOG 'Creating profile for user % with org_id %', NEW.id, org_id;

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
    org_id,  -- This will never be NULL now
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;