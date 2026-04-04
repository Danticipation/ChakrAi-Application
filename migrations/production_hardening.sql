-- PRODUCTION DB HARDENING - CHAKRAI HIPAA DEPLOYMENT
-- Run once against production Postgres/Neon

BEGIN;

-- Ensure RLS is enabled and FORCED (mandatory for HIPAA compliance)
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE mood_entries     FORCE ROW LEVEL SECURITY;

-- Verify policies exist and filter by app.uid GUC
-- These should already exist from previous migrations
DO $$
BEGIN
  -- Check journal_entries policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journal_entries' 
    AND policyname = 'journal_by_uid'
  ) THEN
    CREATE POLICY journal_by_uid ON journal_entries
      USING (uid = current_setting('app.uid', true));
  END IF;

  -- Check mood_entries policy  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mood_entries' 
    AND policyname = 'mood_by_uid'
  ) THEN
    CREATE POLICY mood_by_uid ON mood_entries
      USING (uid = current_setting('app.uid', true));
  END IF;
END$$;

-- Revoke any public access (app role only)
REVOKE ALL ON journal_entries FROM public;
REVOKE ALL ON mood_entries FROM public;
REVOKE ALL ON conversations FROM public;
REVOKE ALL ON uid_legacy_map FROM public;

-- Grant only to application role (replace 'neondb_owner' with your app role)
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON mood_entries TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO neondb_owner;
GRANT SELECT ON uid_legacy_map TO neondb_owner;

-- Verify no NULL UIDs exist (CRITICAL for HIPAA compliance)
DO $$
DECLARE
  journal_nulls INTEGER;
  mood_nulls INTEGER;
BEGIN
  SELECT COUNT(*) INTO journal_nulls FROM journal_entries WHERE uid IS NULL;
  SELECT COUNT(*) INTO mood_nulls FROM mood_entries WHERE uid IS NULL;
  
  IF journal_nulls > 0 OR mood_nulls > 0 THEN
    RAISE EXCEPTION 'PRODUCTION DEPLOYMENT BLOCKED: Found % journal + % mood entries with NULL UIDs. Run UID backfill first.', journal_nulls, mood_nulls;
  END IF;
  
  RAISE NOTICE 'PRODUCTION READY: All entries have UIDs. Journal: %, Mood: %', 
    (SELECT COUNT(*) FROM journal_entries),
    (SELECT COUNT(*) FROM mood_entries);
END$$;

COMMIT;