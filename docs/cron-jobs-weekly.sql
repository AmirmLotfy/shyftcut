-- Weekly job recommendations cron: invoke Edge Function POST /api/jobs/weekly
-- Preferred: use migrations (20260206000000_create_avatars_bucket.sql, 20260206010000_schedule_weekly_jobs_cron.sql)
-- and populate Vault with anon_key + cron_secret via: node scripts/setup-cron-vault.mjs
--
-- This file is an alternative: run manually in SQL editor after replacing placeholders.
-- Requires: pg_cron and pg_net enabled. Set CRON_SECRET in Edge Function secrets.

-- Unschedule if you need to remove it:
-- SELECT cron.unschedule('jobs-weekly-invoke');

SELECT cron.schedule(
  'jobs-weekly-invoke',
  '0 0 * * 0',  -- Every Sunday at 00:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/api',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'X-Path', '/api/jobs/weekly',
      'X-Cron-Secret', 'YOUR_CRON_SECRET'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);
