#!/usr/bin/env node

/**
 * Generate a valid JWT token for testing
 * Uses jose library (same as server verification)
 * NOTE: Uses testsecret123 which is the dev server secret
 */

import { SignJWT } from 'jose';

// Use the DEV secret from server package.json dev script
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'testsecret123';

const userId = parseInt(process.argv[2] || '1');
const email = `user${userId}@test.local`;

async function generateToken() {
  // Convert secret to Uint8Array (same as server does)
  const secret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
  
  const payload = {
    userId,
    email,
    sub: userId.toString()
  };

  // Create JWT using jose SignJWT
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);

  console.log('✅ Generated JWT Token for User ID:', userId);
  console.log('\n📋 Token (valid for 24 hours):');
  console.log(token);
  console.log('\n🧪 Test command:');
  console.log(`$env:AUTH_TOKEN="${token}"; $env:TEST_USER_ID="${userId}"; node tests/personality-insights/test-enhanced-endpoint.js`);
  console.log('\n📊 Token Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n🔐 Secret Used:', ACCESS_TOKEN_SECRET);
}

generateToken().catch(err => {
  console.error('❌ Error generating token:', err.message);
  process.exit(1);
});
