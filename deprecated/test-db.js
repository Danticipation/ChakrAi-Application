// test-db.js
import dotenv from 'dotenv';
dotenv.config({ override: true });   // <— force .env to win

import pkg from 'pg';
import dns from 'node:dns/promises';
const { Client } = pkg;

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }

const host = new URL(url.replace('postgresql://', 'http://')).host;
console.log('🔎 Parsed host:', JSON.stringify(host));
console.log('🌐 DNS lookup:', await dns.lookup(host));

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: true } });
await client.connect();
const { rows } = await client.query('select now() as server_time');
console.log('✅ Connected! Server time:', rows[0].server_time);
await client.end();