-- Create manual profile for existing user
-- This user already exists in auth.users but doesn't have a profile
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
SELECT 
  au.id,
  au.id,
  current_org(),
  'admin',
  'Ahmed',
  'Ahmed',
  '0642875621',
  'NextGenHome',
  false
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
AND au.email IS NOT NULL
LIMIT 1;

-- Also ensure all existing users without profiles get one
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
SELECT 
  au.id,
  au.id,
  current_org(),
  'admin',
  COALESCE(au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1)),
  au.raw_user_meta_data ->> 'phone_number',
  au.raw_user_meta_data ->> 'company_name',
  false
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;