#!/usr/bin/env node

import 'dotenv/config';
import { SignJWT, jwtVerify } from 'jose';

console.log('\n🔐 DEBUG: Testing token generation & verification\n');

const secret = process.env.ACCESS_TOKEN_SECRET;
console.log('Secret from env:');
console.log('  Length:', secret.length);
console.log('  First 50 chars:', secret.substring(0, 50));
console.log('  Last 50 chars:', secret.substring(secret.length - 50));
console.log('  Full:', secret);
console.log('');

// Generate token
console.log('Generating token...');
const secretBytes = new TextEncoder().encode(secret);
console.log('Secret bytes length:', secretBytes.length);

const token = await new SignJWT({
  sub: '47',
  userId: 47,
  email: 'user47@test.local'
})
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('24h')
  .sign(secretBytes);

console.log('✅ Token generated');
console.log('Token:', token);
console.log('');

// Verify with same secret
console.log('Verifying token with SAME secret...');
try {
  const result = await jwtVerify(token, secretBytes, { algorithms: ['HS256'] });
  console.log('✅ Token verified successfully!');
  console.log('Payload:', result.payload);
} catch (err) {
  console.error('❌ Verification failed:', err.message);
}
