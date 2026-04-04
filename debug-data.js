// debug-data.js - Check what data we have with UIDs
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_wpS8chHrNK0y@ep-tiny-unit-aerynwor-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function debugData() {
  try {
    console.log('🔍 Checking UID-based data...');
    
    // Check what UIDs we have
    const allUids = await sql`
      SELECT DISTINCT uid FROM (
        SELECT uid FROM journal_entries WHERE uid IS NOT NULL
        UNION
        SELECT uid FROM mood_entries WHERE uid IS NOT NULL
        UNION 
        SELECT uid FROM conversations WHERE uid IS NOT NULL
      ) uids
    `;
    
    console.log('📊 Available UIDs:', allUids.map(r => r.uid));
    
    for (const uidRow of allUids) {
      const uid = uidRow.uid;
      console.log(`\n👤 Data for UID: ${uid}`);
      
      // Check journal entries
      const journals = await sql`
        SELECT id, title, mood, created_at 
        FROM journal_entries 
        WHERE uid = ${uid}
        ORDER BY created_at DESC
        LIMIT 5
      `;
      console.log(`  📔 Journal entries: ${journals.length}`);
      journals.forEach(j => console.log(`    - ${j.id}: "${j.title}" (${j.created_at})`));
      
      // Check mood entries  
      const moods = await sql`
        SELECT id, mood, intensity, created_at
        FROM mood_entries 
        WHERE uid = ${uid}
        ORDER BY created_at DESC
        LIMIT 5
      `;
      console.log(`  😊 Mood entries: ${moods.length}`);
      moods.forEach(m => console.log(`    - ${m.id}: ${m.mood} (${m.intensity}) (${m.created_at})`));
      
      // Check conversations
      const convos = await sql`
        SELECT id, summary, created_at
        FROM conversations 
        WHERE uid = ${uid}
        ORDER BY created_at DESC
        LIMIT 5
      `;
      console.log(`  💬 Conversations: ${convos.length}`);
      convos.forEach(c => console.log(`    - ${c.id}: "${c.summary}" (${c.created_at})`));
      
      // Test the dashboard query manually
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const journalCount = await sql`
        SELECT count(*)::text as count
        FROM journal_entries
        WHERE uid = ${uid}
          AND created_at >= ${thirtyDaysAgo}
      `;
      
      const moodCount = await sql`
        SELECT count(*)::text as count  
        FROM mood_entries
        WHERE uid = ${uid}
          AND created_at >= ${thirtyDaysAgo}
      `;
      
      const convoCount = await sql`
        SELECT count(*)::text as count
        FROM conversations
        WHERE uid = ${uid}
          AND created_at >= ${thirtyDaysAgo}
      `;
      
      console.log(`  📈 Dashboard counts (last 30 days):`);
      console.log(`    - Journals: ${journalCount[0].count}`);
      console.log(`    - Moods: ${moodCount[0].count}`);
      console.log(`    - Conversations: ${convoCount[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugData();