BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'powersync'
      AND schemaname <> 'spike'
  ) THEN
    RAISE EXCEPTION 'Refusing Z0 teardown: publication powersync contains non-spike tables';
  END IF;
END
$$;

DROP PUBLICATION IF EXISTS powersync;
DROP SCHEMA IF EXISTS spike CASCADE;

COMMIT;
