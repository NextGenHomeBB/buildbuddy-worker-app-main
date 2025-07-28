-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the expire-daily-tasks function to run every hour
SELECT cron.schedule(
  'expire-daily-tasks-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://ppsjrqfgsznnlojpyjvu.supabase.co/functions/v1/expire-daily-tasks',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc2pycWZnc3pubmxvanB5anZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTY3NTgsImV4cCI6MjA2ODY3Mjc1OH0.dO08bUqr9XqMk3fVkDK1OxpnzY_S5pPzUPAicnpTURE"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);