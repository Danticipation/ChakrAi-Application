// Test database connection from current setup
import { pool } from './server/db.js';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version.substring(0, 50) + '...');
    
    // Test if essential tables exist
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'journal_entries', 'mood_entries', 'messages')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    if (tableCheck.rows.length > 0) {
      tableCheck.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    } else {
      console.log('  ⚠️ No expected tables found - database might need setup');
      console.log('  💡 Run: npm run db:push to create tables');
    }
    
    await pool.end();
    console.log('\n🎯 Next steps if tables are missing:');
    console.log('1. Run: npm run db:push');
    console.log('2. If that fails, check your DATABASE_URL in .env');
    console.log('3. Make sure your Neon database is running');
    
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
    } else if (error.message.includes('connect') || error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 SOLUTION: Network connection issue.');
      console.log('1. Check your internet connection');
      console.log('2. Verify the database URL is correct');
      console.log('3. Check if the database is running in Neon dashboard');
    } else if (error.message.includes('host')) {
      console.log('\n🔧 SOLUTION: WebSocket connection issue.');
      console.log('1. This might be a Neon WebSocket issue');
      console.log('2. Try disabling WebSocket in db.ts file');
    }
  }
}

testDatabaseConnection();
