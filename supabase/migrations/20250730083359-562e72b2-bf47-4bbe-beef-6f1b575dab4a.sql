-- Add company_name field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Update the create_user_profile function to handle all metadata
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, organization_id, role, full_name, phone, company_name)
  VALUES (
    user_id,
    current_org(),
    'admin',
    COALESCE(split_part(user_email, '@', 1), 'User'),
    NULL,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
END;
$$;