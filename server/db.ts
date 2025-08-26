import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.ts";

// FIX: Disable WebSocket for now to avoid "host" connection errors
// The "getaddrinfo ENOTFOUND host" error is caused by WebSocket trying to connect to 'host'
// neonConfig.webSocketConstructor = ws;

if (!process.env['DATABASE_URL']) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('📊 Database URL configured:', process.env['DATABASE_URL'].substring(0, 50) + '...');

export const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
export const db = drizzle({ client: pool, schema });