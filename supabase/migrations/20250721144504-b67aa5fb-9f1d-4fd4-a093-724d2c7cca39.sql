-- First, let's ensure the user has a profile record
-- We'll use the existing setup_demo_data function to create proper data structure

-- Get the current user ID and create demo data if needed
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- Only proceed if we have a user
    IF current_user_id IS NOT NULL THEN
        -- Check if user already has a profile
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id) THEN
            -- Create the demo data for this user
            PERFORM public.setup_demo_data(current_user_id, current_user_id);
        END IF;
    END IF;
END $$;

-- Also update the INSERT policies to be more permissive for testing
DROP POLICY IF EXISTS "Tasks: users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tasks: project members can create tasks" ON public.tasks;

-- Create a more permissive INSERT policy for authenticated users
CREATE POLICY "Tasks: authenticated users can create tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (true);