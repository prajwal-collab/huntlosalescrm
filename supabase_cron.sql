CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

select cron.schedule(
  'process-email-sequences',
  '0 * * * *', -- Every hour at minute 0
  $$
    select net.http_post(
        url:='https://xlkrdeygblaocxkdogoy.supabase.co/functions/v1/process-sequences',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa3JkZXlnYmxhb2N4a2RvZ295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTY3NjcsImV4cCI6MjA5NDQ5Mjc2N30.4waoEDQkDL7ua4kQSZMwdXYImAlgjibx2lSkJj7AKXY"}'::jsonb
    ) as request_id;
  $$
);
