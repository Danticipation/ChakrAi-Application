// Simple database test without imports
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

async function quickTest() {
  console.log('Testing database...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found in .env file');
    return;
  }
  
  console.log('Database URL found:', databaseUrl.substring(0, 50) + '...');
  
  try {
    const pool = new Pool({ connectionString: databaseUrl });
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    console.log('Test query result:', result.rows[0]);
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.message.includes('password')) {
      console.log('🔧 Your database password might be incorrect');
    } else if (error.message.includes('host')) {
      console.log('🔧 Network connection issue - check internet and database URL');
    }
  }
}

quickTest();
