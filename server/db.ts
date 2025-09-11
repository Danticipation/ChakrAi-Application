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

if (!process.env['DATABASE_URL']) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('📊 Database URL configured:', process.env['DATABASE_URL'].substring(0, 50) + '...');

export const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
export const db = drizzle({ client: pool, schema });
