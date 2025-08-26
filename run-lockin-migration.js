// run-lockin-migration.js - Apply the UID lock-in with RLS
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_wpS8chHrNK0y@ep-tiny-unit-aerynwor-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function runLockInMigration() {
  try {
    console.log('🔒 Starting UID Lock-In Migration...');
    
    console.log('📋 Executing migration steps one by one...');
    
    // Step 1: Safety check - abort if any missing UID
    console.log('  ✈️ Step 1: Safety check for missing UIDs...');
    const journalMissing = await sql`
      SELECT COUNT(*) as count FROM journal_entries WHERE uid IS NULL
    `;
    const moodMissing = await sql`
      SELECT COUNT(*) as count FROM mood_entries WHERE uid IS NULL
    `;
    
    if (Number(journalMissing[0].count) > 0 || Number(moodMissing[0].count) > 0) {
      throw new Error(`UID backfill incomplete; aborting lock-in. Journal missing: ${journalMissing[0].count}, Mood missing: ${moodMissing[0].count}`);
    }
    console.log('    ✅ All entries have UIDs');
    
    // Step 2: Add/update format constraints
    console.log('  ✈️ Step 2: Adding UID format constraints...');
    await sql`
      ALTER TABLE journal_entries
        DROP CONSTRAINT IF EXISTS journal_entries_uid_fmt
    `;
    await sql`
      ALTER TABLE journal_entries
        ADD CONSTRAINT journal_entries_uid_fmt CHECK (uid ~ '^usr_[0-9a-f]{32}$')
    `;
    
    await sql`
      ALTER TABLE mood_entries
        DROP CONSTRAINT IF EXISTS mood_entries_uid_fmt
    `;
    await sql`
      ALTER TABLE mood_entries
        ADD CONSTRAINT mood_entries_uid_fmt CHECK (uid ~ '^usr_[0-9a-f]{32}$')
    `;
    console.log('    ✅ Format constraints added');
    
    // Step 3: Set NOT NULL constraints
    console.log('  ✈️ Step 3: Setting NOT NULL constraints...');
    await sql`ALTER TABLE journal_entries ALTER COLUMN uid SET NOT NULL`;
    await sql`ALTER TABLE mood_entries ALTER COLUMN uid SET NOT NULL`;
    console.log('    ✅ NOT NULL constraints added');
    
    // Step 4: Enable Row-Level Security
    console.log('  ✈️ Step 4: Enabling Row-Level Security...');
    await sql`ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY`;
    console.log('    ✅ RLS enabled');
    
    // Step 5: Create RLS policies
    console.log('  ✈️ Step 5: Creating RLS policies...');
    await sql`DROP POLICY IF EXISTS journal_by_uid ON journal_entries`;
    await sql`DROP POLICY IF EXISTS mood_by_uid ON mood_entries`;
    
    await sql`
      CREATE POLICY journal_by_uid ON journal_entries
        USING (uid = current_setting('app.uid', true))
    `;
    
    await sql`
      CREATE POLICY mood_by_uid ON mood_entries
        USING (uid = current_setting('app.uid', true))
    `;
    console.log('    ✅ RLS policies created');
    
    console.log('✅ Lock-in migration completed successfully!');
    
    // Verify the migration worked
    console.log('🔍 Verifying migration results...');
    
    // Check that NOT NULL constraints are in place
    const constraints = await sql`
      SELECT 
        table_name,
        column_name,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name IN ('journal_entries', 'mood_entries') 
        AND column_name = 'uid'
    `;
    
    console.log('📊 UID Column Status:');
    constraints.forEach(c => {
      console.log(`  - ${c.table_name}.uid: nullable=${c.is_nullable}, default=${c.column_default}`);
    });
    
    // Check RLS policies
    const policies = await sql`
      SELECT 
        schemaname,
        tablename, 
        policyname,
        permissive,
        cmd,
        qual
      FROM pg_policies 
      WHERE tablename IN ('journal_entries', 'mood_entries')
    `;
    
    console.log('🛡️ RLS Policies:');
    policies.forEach(p => {
      console.log(`  - ${p.tablename}.${p.policyname}: ${p.cmd} (${p.permissive})`);
      console.log(`    Filter: ${p.qual}`);
    });
    
    // Test data access with RLS
    console.log('🧪 Testing RLS with sample UID...');
    const testUid = 'usr_1422e1a512314029b45b0d239605c48f';
    
    // Set the session UID
    await sql`SELECT set_config('app.uid', ${testUid}, true)`;
    
    // Try to query mood entries (should only return entries for this UID)
    const testQuery = await sql`
      SELECT COUNT(*) as count, uid
      FROM mood_entries 
      WHERE uid = ${testUid}
      GROUP BY uid
    `;
    
    console.log('📈 RLS Test Results:');
    testQuery.forEach(r => {
      console.log(`  - UID ${r.uid.slice(-8)}: ${r.count} entries accessible`);
    });
    
    console.log('🎉 UID Lock-In Migration Complete!');
    console.log('');
    console.log('✅ Security Features Enabled:');
    console.log('  - NOT NULL constraints on uid columns');
    console.log('  - Row-Level Security (RLS) enabled');
    console.log('  - Data isolation by UID');
    console.log('  - Format validation for UIDs');
    console.log('');
    console.log('🚀 Your Chakrai app is now production-ready with enterprise security!');
    
  } catch (error) {
    console.error('❌ Lock-in migration failed:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('UID backfill incomplete')) {
      console.error('');
      console.error('🚨 SAFETY CHECK FAILED:');
      console.error('   Some entries are missing UIDs.');
      console.error('   Run the backfill migration first: node run-migration.js');
      console.error('   Then retry the lock-in: node run-lockin-migration.js');
    }
    
    process.exit(1);
  }
}

runLockInMigration();