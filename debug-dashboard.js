// debug-dashboard.js - Test the exact dashboard query
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_wpS8chHrNK0y@ep-tiny-unit-aerynwor-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function debugDashboard() {
  try {
    const uid = 'usr_1422e1a512314029b45b0d239605c48f';
    console.log('🔍 Testing dashboard queries for UID:', uid);
    
    // Calculate the same time window as the dashboard
    const now = new Date();
    const since = new Date(now);
    since.setDate(now.getDate() - 30); // 30 days back for 'month'
    
    console.log('Time range:');
    console.log('  Since:', since.toISOString());
    console.log('  Until:', now.toISOString());
    
    // Test the exact same query structure as the dashboard
    console.log('\n📊 Testing queries...');
    
    // Journal entries query
    const journalQuery = sql`
      select count(*)::text as count
      from journal_entries
      where uid = ${uid}
        and created_at >= ${since}
        and created_at < ${now};
    `;
    
    // Mood entries query  
    const moodQuery = sql`
      select count(*)::text as count
      from mood_entries
      where uid = ${uid}
        and created_at >= ${since}
        and created_at < ${now};
    `;
    
    // Conversations query
    const convoQuery = sql`
      select count(*)::text as count
      from conversations
      where uid = ${uid}
        and created_at >= ${since}
        and created_at < ${now};
    `;
    
    const [journalResult, moodResult, convoResult] = await Promise.all([
      journalQuery,
      moodQuery, 
      convoQuery
    ]);
    
    console.log('\n📈 Query Results:');
    console.log('  Journal entries:', journalResult[0].count);
    console.log('  Mood entries:', moodResult[0].count);
    console.log('  Conversations:', convoResult[0].count);
    
    // Also check what entries we have for this UID
    console.log('\n📋 Raw data check:');
    const allMoods = await sql`
      select id, mood, intensity, created_at
      from mood_entries 
      where uid = ${uid}
      order by created_at desc
    `;
    
    console.log(`  Found ${allMoods.length} mood entries for this UID:`);
    allMoods.forEach(m => {
      const inRange = new Date(m.created_at) >= since && new Date(m.created_at) < now;
      console.log(`    - ID ${m.id}: ${m.mood} (${m.created_at}) [In range: ${inRange}]`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugDashboard();