// Test the current database connection
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing updated database connection...');
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ No DATABASE_URL found in environment');
    return;
  }
  
  console.log('📊 Testing connection to:', dbUrl.substring(0, 60) + '...');
  
  try {
    const pool = new Pool({ 
      connectionString: dbUrl,
      connectionTimeoutMillis: 10000
    });
    
    // Test basic connection
    console.log('⏳ Attempting connection...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    console.log('✅ Database connection successful!');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🗄️ Database version:', result.rows[0].db_version.substring(0, 50) + '...');
    
    // Check for required tables
    console.log('\n🔍 Checking for required tables...');
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'journal_entries', 'mood_entries', 'messages')
      ORDER BY table_name
    `);
    
    console.log('📋 Found tables:');
    if (tableCheck.rows.length > 0) {
      tableCheck.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
      
      console.log('\n🎉 Database is ready! Your 500 errors should be fixed now.');
      console.log('💡 Try creating a journal entry in your app.');
      
    } else {
      console.log('  ⚠️ No required tables found');
      console.log('\n🔧 Next step: Create database tables');
      console.log('Run this command: npm run db:push');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 SOLUTION: Password authentication failed');
      console.log('1. Go to https://console.neon.tech/');
      console.log('2. Reset your database password');
      console.log('3. Get a new connection string');
      console.log('4. Update DATABASE_URL in your .env file');
    } else if (error.message.includes('does not exist')) {
      console.log('\n🔧 SOLUTION: Database does not exist');
      console.log('1. Check your Neon dashboard');
      console.log('2. Verify the database name is correct');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('connect')) {
      console.log('\n🔧 SOLUTION: Network connection issue');
      console.log('1. Check your internet connection');
      console.log('2. Verify the hostname in your DATABASE_URL');
      console.log('3. Check if your Neon database is running');
    }
  }
}

testConnection();
