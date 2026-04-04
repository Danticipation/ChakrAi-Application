import { pool } from './server/db.ts';

async function diagnoseChatMemory() {
  console.log('🔍 DIAGNOSING CHAT MEMORY SYSTEM...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', result.rows[0].current_time);
    
    // Test 2: Check if chat-related tables exist
    console.log('\n2️⃣ Checking for chat memory tables...');
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'messages', 
        'conversation_sessions',
        'conversation_summaries',
        'semantic_memories',
        'user_memories'
      )
      ORDER BY table_name
    `);
    
    console.log('📋 Chat memory tables found:');
    if (tableCheck.rows.length > 0) {
      tableCheck.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    } else {
      console.log('  ❌ NO CHAT MEMORY TABLES FOUND');
    }
    
    // Test 3: Check if messages table has data
    if (tableCheck.rows.find(row => row.table_name === 'messages')) {
      console.log('\n3️⃣ Checking messages table data...');
      const messageCount = await pool.query('SELECT COUNT(*) as count FROM messages');
      console.log(`📊 Total messages in database: ${messageCount.rows[0].count}`);
      
      if (messageCount.rows[0].count > 0) {
        const recentMessages = await pool.query(`
          SELECT id, "text", "isBot", timestamp 
          FROM messages 
          ORDER BY timestamp DESC 
          LIMIT 3
        `);
        console.log('📝 Most recent messages:');
        recentMessages.rows.forEach(msg => {
          const sender = msg.isBot ? 'AI' : 'User';
          console.log(`  ${sender}: ${msg.text.substring(0, 50)}...`);
        });
      } else {
        console.log('📭 No messages found - this explains the memory issue!');
      }
    }
    
    // Test 4: Check all available tables
    console.log('\n4️⃣ All available tables:');
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📚 Total tables: ${allTables.rows.length}`);
    allTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    await pool.end();
    
    // Analysis
    console.log('\n🔬 DIAGNOSIS SUMMARY:');
    if (tableCheck.rows.length === 0) {
      console.log('❌ PROBLEM: Chat memory tables do not exist');
      console.log('💡 SOLUTION: Run database migrations to create tables');
    } else if (tableCheck.rows.find(row => row.table_name === 'messages')) {
      console.log('✅ Chat tables exist - checking if chat system is using them...');
    }
    
  } catch (error) {
    console.error('❌ Database diagnosis failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('password authentication')) {
      console.log('\n🔧 SOLUTION: Database password issue');
    } else if (error.message.includes('does not exist')) {
      console.log('\n🔧 SOLUTION: Database or tables do not exist');
    }
  }
}

diagnoseChatMemory();
