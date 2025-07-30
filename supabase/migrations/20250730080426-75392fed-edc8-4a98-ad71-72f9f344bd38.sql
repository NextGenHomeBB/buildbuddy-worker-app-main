-- Update existing users to have admin role (for testing)
UPDATE profiles 
SET role = 'admin' 
WHERE role IS NULL OR role = '';

-- If no profiles exist, we'll create a test function for user setup
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid,
  user_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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