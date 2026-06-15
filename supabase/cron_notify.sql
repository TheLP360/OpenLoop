-- ════════════════════════════════════════════════════════════════════════════
-- OpenLoop — schedule the notification scan from inside Supabase (pg_cron).
--
-- Run this ONCE in the Supabase SQL editor AFTER deploying the app, with the
-- two placeholders replaced:
--   <APP_URL>      e.g. https://openloop.vercel.app   (no trailing slash)
--   <CRON_SECRET>  the same value as the app's CRON_SECRET env var
--
-- pg_cron fires every 15 minutes and pg_net POSTs to the app's notify endpoint,
-- which finds due / resurfaced items and sends Web Push to your devices.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous schedule of the same name, then (re)create it.
select cron.unschedule('openloop-notify')
where exists (select 1 from cron.job where jobname = 'openloop-notify');

select cron.schedule(
  'openloop-notify',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := '<APP_URL>/api/cron/notify',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer <CRON_SECRET>'
               ),
    body    := '{}'::jsonb
  );
  $$
);

-- Inspect runs:  select * from cron.job_run_details order by start_time desc limit 10;
