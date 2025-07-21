
-- Create a simpler function to just create a user profile
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Insert or update the user profile
  INSERT INTO public.profiles(id, full_name, role) 
  VALUES (user_id, COALESCE(user_email, 'User'), 'worker')
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role);

  -- Return success information
  result := jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'message', 'User profile created successfully'
  );
  
  RETURN result;
END;
$function$;

-- Add INSERT policy for profiles to allow users to create their own profile
DROP POLICY IF EXISTS "Profiles: self insert" ON public.profiles;
CREATE POLICY "Profiles: self insert" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());
