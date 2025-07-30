-- Add company_name field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Update the create_user_profile function to handle all metadata
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, organization_id, role, full_name, phone, company_name)
  VALUES (
    user_id,
    current_org(),
    'admin', -- Default new users to admin for testing
    COALESCE(split_part(user_email, '@', 1), 'User'),
    NULL, -- Will be updated by trigger
    NULL  -- Will be updated by trigger
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
END;
$function$

-- Create function to handle new user signup with metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, organization_id, role, full_name, phone, company_name)
  VALUES (
    NEW.id,
    current_org(),
    'admin', -- Default new users to admin for testing
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'company_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name);
  
  RETURN NEW;
END;
$function$

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();