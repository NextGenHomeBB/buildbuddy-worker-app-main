-- Update the existing profile with the correct user information
UPDATE public.profiles 
SET 
  full_name = 'Ahmed',
  name = 'Ahmed',
  company_name = 'NextGenHome',
  phone = '0642875621',
  updated_at = now()
WHERE id = 'fad8b1dd-a2d8-4699-8230-349bd110cd18';