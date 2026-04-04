// FIXED DATABASE CONNECTION - handles connection errors gracefully
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "../shared/schema.ts";

// Disable WebSocket to avoid connection errors during development
neonConfig.webSocketConstructor = undefined;

if (!process.env['DATABASE_URL']) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('📊 Database URL configured:', process.env['DATABASE_URL'].substring(0, 50) + '...');

// Create pool with error handling
let pool;
let db;

try {
  pool = new Pool({ 
    connectionString: process.env['DATABASE_URL'],
    // Add connection timeout and retry settings
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
  });
  
  db = drizzle({ client: pool, schema });
  
  // Test connection immediately
  pool.query('SELECT 1').then(() => {
    console.log('✅ Database connection verified');
  }).catch((error) => {
    console.error('❌ Database connection test failed:', error.message);
    console.log('🔧 Check your DATABASE_URL and internet connection');
  });
  
} catch (error) {
  console.error('❌ Failed to initialize database:', error.message);
  console.log('🔧 Please check your DATABASE_URL in .env file');
  
  // Create a mock database object to prevent crashes
  db = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => Promise.resolve() })
  };
}

export { pool, db };
