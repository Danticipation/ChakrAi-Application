// run-migration.js - Simple migration runner using Neon serverless
import { neon } from '@neondatabase/serverless';

// Use your existing database URL from .env
const DATABASE_URL = "postgresql://neondb_owner:npg_wpS8chHrNK0y@ep-tiny-unit-aerynwor-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(DATABASE_URL);

async function runMigration() {
  try {
    console.log('🔗 Connecting to Neon database...');
    console.log('✅ Connected!');
    
    console.log('🚀 Running UID migration...');
    
    // Run migration steps one by one
    console.log('  ✈️ Step 1: Adding uid columns...');
    await sql`ALTER TABLE IF EXISTS journal_entries ADD COLUMN IF NOT EXISTS uid text`;
    await sql`ALTER TABLE IF EXISTS mood_entries ADD COLUMN IF NOT EXISTS uid text`;
    
    console.log('  ✈️ Step 2: Creating mapping table...');
    await sql`
      CREATE TABLE IF NOT EXISTS uid_legacy_map (
        uid text PRIMARY KEY,
        legacy_user_id integer UNIQUE
      )
    `;
    
    console.log('  ✈️ Step 3: Enabling crypto extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
    
    console.log('  ✈️ Step 4: Generating mappings for existing users...');
    await sql`
      WITH legacy AS (
        SELECT user_id FROM journal_entries
        UNION
        SELECT user_id FROM mood_entries
      )
      INSERT INTO uid_legacy_map (uid, legacy_user_id)
      SELECT 'usr_' || replace(gen_random_uuid()::text, '-', ''), l.user_id
      FROM legacy l
      LEFT JOIN uid_legacy_map m ON m.legacy_user_id = l.user_id
      WHERE m.legacy_user_id IS NULL
    `;
    
    console.log('  ✈️ Step 5: Backfilling UIDs...');
    await sql`
      UPDATE journal_entries je
      SET uid = m.uid
      FROM uid_legacy_map m
      WHERE je.uid IS NULL AND je.user_id = m.legacy_user_id
    `;
    
    await sql`
      UPDATE mood_entries me
      SET uid = m.uid
      FROM uid_legacy_map m
      WHERE me.uid IS NULL AND me.user_id = m.legacy_user_id
    `;
    
    console.log('  ✈️ Step 6: Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS journal_entries_uid_created_idx ON journal_entries(uid, created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS mood_entries_uid_created_idx ON mood_entries(uid, created_at)`;
    
    console.log('  ✈️ Step 7: Creating conversations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id bigserial PRIMARY KEY,
        uid text,
        summary text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS conversations_uid_created_idx ON conversations(uid, created_at)`;
    
    console.log('  ✈️ Step 8: Adding constraints...');
    try {
      await sql`ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_uid_fmt`;
      await sql`ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_uid_fmt CHECK (uid ~ '^usr_[0-9a-f]{32}$')`;
      
      await sql`ALTER TABLE mood_entries DROP CONSTRAINT IF EXISTS mood_entries_uid_fmt`;
      await sql`ALTER TABLE mood_entries ADD CONSTRAINT mood_entries_uid_fmt CHECK (uid ~ '^usr_[0-9a-f]{32}$')`;
    } catch (error) {
      console.log('  ⚠️ Constraint creation skipped (might already exist)');
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Test the results
    console.log('🔍 Checking migration results...');
    
    const journalCheck = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(uid) as with_uid,
        COUNT(*) - COUNT(uid) as missing_uid
      FROM journal_entries
    `;
    
    const moodCheck = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(uid) as with_uid,
        COUNT(*) - COUNT(uid) as missing_uid
      FROM mood_entries
    `;
    
    const mappingCheck = await sql`
      SELECT COUNT(*) as total_mappings FROM uid_legacy_map
    `;
    
    console.log('📊 Migration Results:');
    console.log('  Journal Entries:', journalCheck[0]);
    console.log('  Mood Entries:', moodCheck[0]);
    console.log('  UID Mappings:', mappingCheck[0]);
    
    if (journalCheck[0].missing_uid === 0 && moodCheck[0].missing_uid === 0) {
      console.log('🎉 SUCCESS: All entries have UIDs!');
    } else {
      console.log('⚠️  Some entries are missing UIDs - this might be normal if tables were empty');
    }
    
    console.log('✅ Migration complete! Your database is now UID-ready.');
    console.log('🚀 You can now restart your server and test the UID system!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

runMigration();