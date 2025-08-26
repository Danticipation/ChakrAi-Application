// Simple database connection test - Fixed for ES modules
import { Pool } from '@neondatabase/serverless';

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  const databaseUrl = "postgresql://neondb_owner:npg_wpS8chHrNK0y@ep-tiny-unit-aerynwor-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  
  try {
    const pool = new Pool({ connectionString: databaseUrl });
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('Current time from database:', result.rows[0].current_time);
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error details:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 SOLUTION: Your database password might be incorrect.');
      console.log('1. Go to your Neon dashboard: https://console.neon.tech/');
      console.log('2. Find your project and get the correct connection string');
      console.log('3. Update your .env file with the new DATABASE_URL');
    }
  }
}

testConnection();
