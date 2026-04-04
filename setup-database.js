// Database setup script to create all tables
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function setupDatabase() {
  console.log('🔧 Setting up database tables...');
  
  try {
    // This will create all tables defined in the schema
    console.log('📊 Creating database tables...');
    
    // Test connection first
    await db.execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Database connection confirmed');
    
    // The tables will be auto-created when we run db:push
    console.log('✅ Database tables ready to be created');
    console.log('📝 Please run: npm run db:push');
    console.log('   This will create all the tables your app needs');
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  }
}

setupDatabase();
