-- Roles that let PostgREST serve the local Postgres database the way
-- @supabase/supabase-js expects. Safe to run repeatedly.
--   web_anon       -> the anonymous role PostgREST switches into
--   authenticator  -> the login role PostgREST connects as
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
    CREATE ROLE web_anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN PASSWORD 'postgres' NOINHERIT;
  END IF;
END
$$;

GRANT web_anon TO authenticator;
