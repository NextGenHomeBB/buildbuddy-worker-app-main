-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    operation_name TEXT NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    organization_id UUID NOT NULL DEFAULT current_org(),
    
    -- Create unique constraint for the ON CONFLICT clause
    UNIQUE(user_id, operation_name, window_start)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own rate limits" 
ON public.rate_limits 
FOR ALL 
USING (user_id = auth.uid());

-- Create or replace the rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    operation_name TEXT,
    max_attempts INTEGER DEFAULT 5,
    window_minutes INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_window_start TIMESTAMP WITH TIME ZONE;
    current_count INTEGER;
BEGIN
    -- Calculate the current window start time (rounded down to window_minutes intervals)
    current_window_start := date_trunc('minute', NOW()) - 
        (EXTRACT(MINUTE FROM NOW())::INTEGER % window_minutes) * INTERVAL '1 minute';
    
    -- Clean up old entries (older than current window)
    DELETE FROM public.rate_limits 
    WHERE user_id = auth.uid() 
    AND operation_name = check_rate_limit.operation_name 
    AND window_start < current_window_start;
    
    -- Try to insert or update the current window entry
    INSERT INTO public.rate_limits (user_id, operation_name, window_start, attempt_count, organization_id)
    VALUES (auth.uid(), check_rate_limit.operation_name, current_window_start, 1, current_org())
    ON CONFLICT (user_id, operation_name, window_start)
    DO UPDATE SET 
        attempt_count = rate_limits.attempt_count + 1,
        updated_at = NOW();
    
    -- Get the current attempt count
    SELECT attempt_count INTO current_count
    FROM public.rate_limits
    WHERE user_id = auth.uid() 
    AND operation_name = check_rate_limit.operation_name 
    AND window_start = current_window_start;
    
    -- Return true if under the limit, false if exceeded
    RETURN current_count <= max_attempts;
END;
$$;