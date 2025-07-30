-- Fix the handle_new_user function to handle cases where current_org() might be null
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Try to get organization_id from JWT, fallback to a default if null
  org_id := current_org();
  
  -- If no organization in JWT, we'll need to handle this case
  -- For now, we'll use a default organization or create one
  IF org_id IS NULL THEN
    -- You may want to create a default organization or handle this differently
    -- For now, we'll just use NULL and the admin can assign later
    org_id := NULL;
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
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'worker'),
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
    organization_id = COALESCE(EXCLUDED.organization_id, profiles.organization_id);
  
  RETURN NEW;
END;
$$;

-- Create the missing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a profile for the existing user (replace with actual user ID if known)
-- This will create a profile for any existing users who don't have one yet
INSERT INTO public.profiles (
  id, 
  auth_user_id, 
  organization_id, 
  role, 
  full_name, 
  name,
  is_placeholder
)
SELECT 
  u.id,
  u.id,
  NULL, -- Will be set by admin later
  'worker',
  COALESCE(split_part(u.email, '@', 1), 'User'),
  COALESCE(split_part(u.email, '@', 1), 'User'),
  false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;