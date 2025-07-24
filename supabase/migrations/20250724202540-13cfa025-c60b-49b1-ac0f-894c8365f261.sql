-- Add work_role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN work_role TEXT DEFAULT 'Construction Worker';