-- Update role to worker as requested
UPDATE public.profiles 
SET role = 'worker', updated_at = now()
WHERE id = 'fad8b1dd-a2d8-4699-8230-349bd110cd18';