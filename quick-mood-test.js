// quick-mood-test.js - Quick test of current mood data
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_wpS8chHrNK0y@ep-tiny-unit-aerynwor-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function quickTest() {
  const uid = 'usr_1422e1a512314029b45b0d239605c48f';
  
  console.log('🔍 Quick mood data test for current session UID');
  console.log('UID:', uid);
  
  // Check all mood entries for this UID
  const moods = await sql`
    SELECT id, mood, intensity, created_at
    FROM mood_entries 
    WHERE uid = ${uid}
    ORDER BY created_at DESC
  `;
  
  console.log(`\n📊 Found ${moods.length} mood entries:`);
  moods.forEach(m => {
    console.log(`  - ID ${m.id}: ${m.mood} (${m.intensity}) at ${m.created_at}`);
  });
  
  // Test the simple count query that should work
  const simpleCount = await sql`
    SELECT COUNT(*) as count
    FROM mood_entries 
    WHERE uid = ${uid}
  `;
  
  console.log(`\n🔢 Simple count: ${simpleCount[0].count}`);
  
  // Test the timeframe query with explicit dates
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  console.log(`\n📅 Testing timeframe query:`);
  console.log(`  From: ${thirtyDaysAgo.toISOString()}`);
  console.log(`  To: ${now.toISOString()}`);
  
  const timeframeCount = await sql`
    SELECT COUNT(*) as count
    FROM mood_entries 
    WHERE uid = ${uid}
      AND created_at >= ${thirtyDaysAgo.toISOString()}::timestamptz
      AND created_at < ${now.toISOString()}::timestamptz
  `;
  
  console.log(`  Result: ${timeframeCount[0].count}`);
  
  // Check what timezone the database thinks these timestamps are in
  const timezoneCheck = await sql`
    SELECT 
      id,
      created_at,
      created_at AT TIME ZONE 'UTC' as utc_time,
      created_at AT TIME ZONE 'America/Phoenix' as mountain_time
    FROM mood_entries 
    WHERE uid = ${uid}
    ORDER BY created_at DESC
    LIMIT 2
  `;
  
  console.log(`\n🌍 Timezone analysis:`);
  timezoneCheck.forEach(row => {
    console.log(`  ID ${row.id}:`);
    console.log(`    Original: ${row.created_at}`);
    console.log(`    UTC: ${row.utc_time}`);
    console.log(`    Mountain: ${row.mountain_time}`);
  });
}

quickTest().catch(console.error);