-- 010_uidify_core.sql
-- Run on Neon / Postgres
-- Idempotent migration to add UID support to existing tables

-- A) Tables: add uid (text)
ALTER TABLE IF EXISTS journal_entries ADD COLUMN IF NOT EXISTS uid text;
ALTER TABLE IF EXISTS mood_entries    ADD COLUMN IF NOT EXISTS uid text;

-- B) Mapping table: legacy INT -> HIPAA UID (opaque, non-reversible)
CREATE TABLE IF NOT EXISTS uid_legacy_map (
  uid text PRIMARY KEY,
  legacy_user_id integer UNIQUE
);

-- C) Generate missing mappings for all legacy user_ids we've ever seen
--    Use cryptographically random IDs so they can't be brute-forced from ints.
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()

WITH legacy AS (
  SELECT user_id FROM journal_entries
  UNION
  SELECT user_id FROM mood_entries
)
INSERT INTO uid_legacy_map (uid, legacy_user_id)
SELECT 'usr_' || replace(gen_random_uuid()::text, '-', ''), l.user_id
FROM legacy l
LEFT JOIN uid_legacy_map m ON m.legacy_user_id = l.user_id
WHERE m.legacy_user_id IS NULL;

-- D) Backfill uid into existing rows
UPDATE journal_entries je
SET uid = m.uid
FROM uid_legacy_map m
WHERE je.uid IS NULL AND je.user_id = m.legacy_user_id;

UPDATE mood_entries me
SET uid = m.uid
FROM uid_legacy_map m
WHERE me.uid IS NULL AND me.user_id = m.legacy_user_id;

-- E) Helpful indexes (keep the dashboard snappy)
CREATE INDEX IF NOT EXISTS journal_entries_uid_created_idx ON journal_entries(uid, created_at);
CREATE INDEX IF NOT EXISTS mood_entries_uid_created_idx    ON mood_entries(uid, created_at);

-- F) Optional (if you saw "relation conversations does not exist" in logs)
CREATE TABLE IF NOT EXISTS conversations (
  id bigserial PRIMARY KEY,
  uid text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS conversations_uid_created_idx ON conversations(uid, created_at);

-- G) Optional safety rail: format check now, NOT NULL later when fully migrated
ALTER TABLE journal_entries ADD CONSTRAINT IF NOT EXISTS journal_entries_uid_fmt CHECK (uid ~ '^usr_[0-9a-f]{32}$');
ALTER TABLE mood_entries    ADD CONSTRAINT IF NOT EXISTS mood_entries_uid_fmt    CHECK (uid ~ '^usr_[0-9a-f]{32}$');

-- After you confirm every new write sets uid, you can:
-- ALTER TABLE journal_entries ALTER COLUMN uid SET NOT NULL;
-- ALTER TABLE mood_entries    ALTER COLUMN uid SET NOT NULL;
-- ALTER TABLE conversations   ALTER COLUMN uid SET NOT NULL;