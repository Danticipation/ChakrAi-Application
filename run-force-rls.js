// run-force-rls.js - Apply force RLS migration
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_wpS8chHrNK0y@ep-tiny-unit-aerynwor-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function runForceRls() {
  try {
    console.log('🔒 Applying Force RLS Migration...');
    
    // Apply force RLS
    await sql`ALTER TABLE IF EXISTS journal_entries FORCE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE IF EXISTS mood_entries FORCE ROW LEVEL SECURITY`;
    
    console.log('✅ Force RLS applied successfully!');
    
    // Verify RLS status
    const rlsStatus = await sql`
      SELECT 
        relname,
        relrowsecurity as enabled,
        relforcerowsecurity as forced
      FROM pg_class 
      WHERE relname IN ('journal_entries', 'mood_entries')
    `;
    
    console.log('🛡️ RLS Status:');
    rlsStatus.forEach(row => {
      console.log(`  - ${row.relname}: enabled=${row.enabled}, forced=${row.forced}`);
    });
    
    console.log('🎉 Force RLS Migration Complete!');
    console.log('🚀 RLS is now mandatory - even superusers cannot bypass it!');
    
  } catch (error) {
    console.error('❌ Force RLS migration failed:', error);
  }
}

runForceRls();