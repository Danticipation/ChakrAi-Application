import dotenv from 'dotenv';

console.log('DEBUG: DATABASE_URL before dotenv.config():', process.env['DATABASE_URL']);

// Load environment variables first
dotenv.config({ path: '../.env' });

console.log('DEBUG: DATABASE_URL after dotenv.config():', process.env['DATABASE_URL']);

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "../shared/schema.js";

// CRITICAL FIX: Disable WebSocket to prevent "non-101 status code" errors
neonConfig.webSocketConstructor = undefined;
neonConfig.fetchConnectionCache = false;

let pool;
let db;

if (!process.env['DATABASE_URL']) {
  console.log('⚠️  DATABASE_URL not set. Database operations will fail.');
  pool = null;
  db = null;
} else {
  console.log('📊 Database URL configured:', process.env['DATABASE_URL'].substring(0, 50) + '...');
  pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
  db = drizzle({ client: pool, schema });
}

export { pool };
export { db };
