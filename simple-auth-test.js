#!/usr/bin/env node

import 'dotenv/config';
import http from 'http';
import { SignJWT } from 'jose';

const userId = 47;

async function makeAuthRequest() {
  console.log('🔐 Testing Authentication Request\n');
  
  // Load secret from environment
  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  console.log('1️⃣  Loading environment...');
  console.log('ACCESS_TOKEN_SECRET length:', ACCESS_TOKEN_SECRET ? ACCESS_TOKEN_SECRET.length : 'NOT FOUND');
  
  if (!ACCESS_TOKEN_SECRET) {
    console.error('❌ ERROR: ACCESS_TOKEN_SECRET not found in .env');
    process.exit(1);
  }
  
  // Generate token
  console.log('2️⃣  Generating JWT token...');
  const secret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
  const token = await new SignJWT({
    sub: String(userId),
    userId,
    email: `user${userId}@test.local`
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
  
  console.log('✅ Token generated');
  console.log('Token (first 50 chars):', token.substring(0, 50) + '...\n');
  
  // Make request with token
  console.log('3️⃣  Making request to /api/personality-insights...\n');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/personality-insights',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };
    
    console.log('Request headers:');
    console.log('  Authorization: Bearer ' + token.substring(0, 30) + '...');
    console.log('  x-user-id:', userId);
    console.log('');
    
    const req = http.request(options, (res) => {
      let data = '';
      
      console.log(`✅ Response Status: ${res.statusCode}`);
      console.log('');
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('📋 Response Body:');
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Response (raw):', data);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      resolve();
    });
    
    req.on('timeout', () => {
      console.error('❌ Request timeout');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

makeAuthRequest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
