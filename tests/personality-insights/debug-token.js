#!/usr/bin/env node

/**
 * Debug script to test if the token is valid and the endpoint accepts it
 */

import http from 'http';

const API_HOST = 'localhost';
const API_PORT = 3001;
const API_ENDPOINT = '/api/personality-insights';

// Get token from env
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test-token';
const TEST_USER_ID = process.env.TEST_USER_ID || '1';

console.log('🔍 DEBUG: Token Test');
console.log('═══════════════════════════════════════');
console.log(`📋 Auth Token: ${AUTH_TOKEN.substring(0, 50)}...`);
console.log(`👤 User ID: ${TEST_USER_ID}`);
console.log(`🌐 Endpoint: http://${API_HOST}:${API_PORT}${API_ENDPOINT}`);
console.log('═══════════════════════════════════════\n');

// Test with simple request
const options = {
  hostname: API_HOST,
  port: API_PORT,
  path: API_ENDPOINT,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'x-user-id': TEST_USER_ID
  }
};

console.log('📤 Headers being sent:');
console.log(JSON.stringify(options.headers, null, 2));
console.log('\n⏳ Sending request...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`✅ Response Status: ${res.statusCode}`);
  console.log(`📋 Response Headers:`);
  console.log(JSON.stringify(res.headers, null, 2));
  console.log('\n📦 Response Body:\n');
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
    
    console.log('\n✨ Debug test complete');
    
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS: Endpoint accepted the request!');
    } else if (res.statusCode === 401) {
      console.log('❌ FAILURE: Authentication rejected (401)');
      console.log('   Check: Token validity, expiration, or secret key mismatch');
    } else {
      console.log(`⚠️  UNEXPECTED: Got status ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
  console.log('\n💡 Ensure the server is running: npm run dev:server');
});

req.end();
