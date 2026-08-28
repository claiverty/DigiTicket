-- Execute uma vez no SQL Editor de cada projeto Supabase depois das migrations.
-- A configuração é mantida separada porque jobs são específicos do ambiente.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'digiticket-expire-reservations';

SELECT cron.schedule(
  'digiticket-expire-reservations',
  '* * * * *',
  'SELECT public.expire_pending_reservations(500);'
);
