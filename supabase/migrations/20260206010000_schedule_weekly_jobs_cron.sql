-- Weekly job recommendations: ensure pg_net and schedule cron to call Edge Function.
-- Requires: pg_cron enabled (Dashboard → Database → Extensions).
-- Before this works, add Vault secrets: anon_key, cron_secret (see scripts/setup-cron-vault.sql or docs).

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Replace existing job if this migration is re-run
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'jobs-weekly-invoke') THEN
    PERFORM cron.unschedule('jobs-weekly-invoke');
  END IF;
END $$;

SELECT cron.schedule(
  'jobs-weekly-invoke',
  '0 0 * * 0',  -- Every Sunday 00:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://qydmjbiwukwlmblosolb.supabase.co/functions/v1/api',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE((SELECT decrypted_secret::text FROM vault.decrypted_secrets WHERE name = 'anon_key' LIMIT 1), ''),
      'X-Path', '/api/jobs/weekly',
      'X-Cron-Secret', COALESCE((SELECT decrypted_secret::text FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1), '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);
