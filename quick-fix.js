// Quick database fix attempt
console.log('🔧 CHAKRAI DATABASE FIX ATTEMPT');
console.log('===============================');

try {
  // Test if environment variables are loaded
  console.log('\n1️⃣ Checking environment variables...');
  
  if (process.env.DATABASE_URL) {
    console.log('✅ DATABASE_URL found');
    console.log('📊 URL preview:', process.env.DATABASE_URL.substring(0, 60) + '...');
  } else {
    console.log('❌ DATABASE_URL not found in environment');
    console.log('🔧 Loading from .env file...');
    require('dotenv').config();
    
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL loaded from .env');
      console.log('📊 URL preview:', process.env.DATABASE_URL.substring(0, 60) + '...');
    } else {
      console.log('❌ DATABASE_URL still not found');
      process.exit(1);
    }
  }
  
  console.log('\n2️⃣ Testing database connection...');
  
  // Import and test connection
  const { Pool } = require('@neondatabase/serverless');
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000
  });
  
  // Test connection
  pool.query('SELECT NOW() as test_time, version() as pg_version')
    .then(result => {
      console.log('✅ DATABASE CONNECTION SUCCESSFUL!');
      console.log('⏰ Database time:', result.rows[0].test_time);
      console.log('🗄️ PostgreSQL version:', result.rows[0].pg_version.substring(0, 50) + '...');
      
      console.log('\n3️⃣ Checking if tables exist...');
      
      return pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'journal_entries', 'mood_entries', 'messages')
        ORDER BY table_name
      `);
    })
    .then(tableResult => {
      console.log('\n📋 AVAILABLE TABLES:');
      if (tableResult.rows.length > 0) {
        tableResult.rows.forEach(row => {
          console.log(`  ✓ ${row.table_name}`);
        });
        
        console.log('\n🎉 SUCCESS! Your database is ready.');
        console.log('💡 The 500 errors should be fixed now.');
        console.log('🚀 Try starting your server: npm run dev');
        
      } else {
        console.log('  ⚠️ No tables found');
        console.log('\n🔧 SOLUTION: Create database tables');
        console.log('📝 Run this command: npm run db:push');
        console.log('📝 Or check your schema files');
      }
      
      return pool.end();
    })
    .then(() => {
      console.log('\n✅ Database test completed successfully');
    })
    .catch(error => {
      console.error('\n❌ DATABASE CONNECTION FAILED');
      console.error('Error:', error.message);
      
      if (error.message.includes('password')) {
        console.log('\n🔧 SOLUTION: Authentication failed');
        console.log('1. Go to https://console.neon.tech/');
        console.log('2. Reset your database password');
        console.log('3. Get a new connection string');
        console.log('4. Update your .env file');
      } else if (error.message.includes('host') || error.message.includes('ENOTFOUND')) {
        console.log('\n🔧 SOLUTION: Connection/Network issue');
        console.log('1. Check your internet connection');
        console.log('2. Verify your Neon database is running');
        console.log('3. Check the hostname in your DATABASE_URL');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.log('\n🔧 SOLUTION: Database does not exist');
        console.log('1. Check your Neon dashboard');
        console.log('2. Create the database if missing');
        console.log('3. Verify the database name in your URL');
      }
      
      console.log('\n📞 If none of these help, the issue might be:');
      console.log('• Firewall blocking the connection');
      console.log('• VPN interfering with database access');
      console.log('• Temporary Neon service issues');
      
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ SETUP ERROR:', error.message);
  console.log('🔧 Make sure you have the required dependencies installed');
  console.log('📝 Run: npm install');
  process.exit(1);
}
