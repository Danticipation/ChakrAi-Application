// FIXED DATABASE CONNECTION - disables WebSocket to avoid connection errors
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "../shared/schema.ts";

// IMPORTANT FIX: Disable WebSocket to prevent "non-101 status code" errors
neonConfig.webSocketConstructor = undefined;
// Also disable fetch cache that can cause issues
neonConfig.fetchConnectionCache = false;

if (!process.env['DATABASE_URL']) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('📊 Database URL configured:', process.env['DATABASE_URL'].substring(0, 50) + '...');
console.log('🔧 WebSocket disabled for compatibility');

// Create pool with better error handling
export const pool = new Pool({ 
  connectionString: process.env['DATABASE_URL'],
  // Add connection settings for better reliability
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
  ssl: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

export const db = drizzle({ client: pool, schema });

// Test connection on startup
pool.query('SELECT 1 as test').then(() => {
  console.log('✅ Database connection verified (WebSocket disabled)');
}).catch((error) => {
  console.error('❌ Database connection test failed:', error.message);
  console.log('🔧 This may not prevent the app from working - trying anyway...');
});
