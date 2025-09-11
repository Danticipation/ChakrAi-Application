// Test current database connection from .env
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testCurrentConnection() {
  console.log('🔍 Testing current database connection from .env...');
  
  const databaseUrl = process.env.DATABASE_URL;
  console.log('Database URL (first 50 chars):', databaseUrl?.substring(0, 50) + '...');
  
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found in environment variables');
    return;
  }
  
  try {
    const pool = new Pool({ connectionString: databaseUrl });
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version);
    
    // Test if users table exists
    try {
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'journal_entries', 'mood_entries')
        ORDER BY table_name
      `);
      
      console.log('\n📋 Available tables:');
      if (tableCheck.rows.length > 0) {
        tableCheck.rows.forEach(row => {
          console.log(`  ✓ ${row.table_name}`);
        });
      } else {
        console.log('  ⚠️ No expected tables found - database might need setup');
      }
    } catch (tableError) {
      console.log('\n⚠️ Could not check tables:', tableError.message);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error details:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 SOLUTION: Your database password is incorrect.');
      console.log('1. Go to your Neon dashboard: https://console.neon.tech/');
      console.log('2. Reset your database password or get new connection string');
      console.log('3. Update your .env file with the correct DATABASE_URL');
    } else if (error.message.includes('does not exist')) {
      console.log('\n🔧 SOLUTION: Your database or table does not exist.');
      console.log('1. Check if you selected the correct database name');
      console.log('2. Run database migrations to create tables');
    } else if (error.message.includes('connect')) {
      console.log('\n🔧 SOLUTION: Network connection issue.');
      console.log('1. Check your internet connection');
      console.log('2. Verify the database URL is correct');
      console.log('3. Check if the database is running in Neon dashboard');
    }
  }
}

testCurrentConnection();
