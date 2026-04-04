// fix-missing-uid.js - Find and fix the missing UID
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_wpS8chHrNK0y@ep-tiny-unit-aerynwor-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function fixMissingUid() {
  try {
    console.log('🔍 Investigating missing UID...');
    
    // Find the mood entries with missing UIDs
    const missingUids = await sql`
      SELECT id, user_id, mood, intensity, created_at
      FROM mood_entries 
      WHERE uid IS NULL
      ORDER BY id
    `;
    
    console.log(`📊 Found ${missingUids.length} mood entries missing UIDs:`);
    missingUids.forEach(entry => {
      console.log(`  - ID ${entry.id}: ${entry.mood} (${entry.intensity}) for user_id ${entry.user_id} at ${entry.created_at}`);
    });
    
    // Check the UID mapping table for this user_id
    for (const entry of missingUids) {
      console.log(`\n🔍 Looking up UID for user_id ${entry.user_id}...`);
      
      const mapping = await sql`
        SELECT uid, legacy_user_id
        FROM uid_legacy_map
        WHERE legacy_user_id = ${entry.user_id}
      `;
      
      if (mapping.length > 0) {
        const uid = mapping[0].uid;
        console.log(`  ✅ Found UID mapping: ${uid}`);
        
        // Update the mood entry with the correct UID
        await sql`
          UPDATE mood_entries
          SET uid = ${uid}
          WHERE id = ${entry.id}
        `;
        
        console.log(`  ✅ Updated mood entry ${entry.id} with UID ${uid}`);
      } else {
        console.log(`  ❌ No UID mapping found for user_id ${entry.user_id}`);
        
        // Generate a new UID mapping for this user_id
        const newUid = 'usr_' + crypto.randomUUID().replace(/-/g, '');
        
        await sql`
          INSERT INTO uid_legacy_map (uid, legacy_user_id)
          VALUES (${newUid}, ${entry.user_id})
        `;
        
        console.log(`  ✅ Created new UID mapping: ${newUid} -> ${entry.user_id}`);
        
        // Update the mood entry
        await sql`
          UPDATE mood_entries
          SET uid = ${newUid}
          WHERE id = ${entry.id}
        `;
        
        console.log(`  ✅ Updated mood entry ${entry.id} with new UID ${newUid}`);
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const stillMissing = await sql`
      SELECT COUNT(*) as count FROM mood_entries WHERE uid IS NULL
    `;
    
    if (Number(stillMissing[0].count) === 0) {
      console.log('✅ All mood entries now have UIDs!');
      console.log('🚀 Ready to run lock-in migration: node run-lockin-migration.js');
    } else {
      console.log(`❌ Still ${stillMissing[0].count} entries missing UIDs`);
    }
    
    // Show final summary
    const allMoods = await sql`
      SELECT uid, COUNT(*) as count
      FROM mood_entries
      GROUP BY uid
      ORDER BY uid
    `;
    
    console.log('\n📊 Mood entries by UID:');
    allMoods.forEach(row => {
      console.log(`  - ${row.uid}: ${row.count} entries`);
    });
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.error('Error details:', error.message);
  }
}

fixMissingUid();