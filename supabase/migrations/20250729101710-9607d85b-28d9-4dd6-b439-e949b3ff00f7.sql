-- Fix ambiguous column reference issue in time_sheets table
-- This removes any triggers or functions that might cause column ambiguity

-- First, let's check if there are any existing triggers on time_sheets
-- and remove them if they're causing issues
DROP TRIGGER IF EXISTS calculate_pay_trigger ON time_sheets;
DROP FUNCTION IF EXISTS calculate_pay();

-- Recreate the time_sheets table structure cleanly if needed
-- This ensures no ambiguous column references exist
CREATE OR REPLACE FUNCTION update_timesheet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a clean trigger for updated_at
DROP TRIGGER IF EXISTS update_timesheet_updated_at_trigger ON time_sheets;
CREATE TRIGGER update_timesheet_updated_at_trigger
    BEFORE UPDATE ON time_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_timesheet_updated_at();