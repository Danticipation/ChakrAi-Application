#!/usr/bin/env node

/**
 * Create an anonymous test user and get their token
 * This bypasses manual token generation
 */

import http from 'http';

const API_HOST = 'localhost';
const API_PORT = 3001;
const API_ENDPOINT = '/api/auth/anonymous';

console.log('🎭 Creating anonymous test user...\n');

const options = {
  hostname: API_HOST,
  port: API_PORT,
  path: API_ENDPOINT,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200 && response.token) {
        console.log('✅ Anonymous user created!');
        console.log('\n📋 User ID:', response.user.id);
        console.log('📧 Email:', response.user.email);
        console.log('\n🔑 Token:');
        console.log(response.token);
        console.log('\n🧪 Test command:');
        console.log(`$env:AUTH_TOKEN="${response.token}"; $env:TEST_USER_ID="${response.user.id}"; node tests/personality-insights/test-enhanced-endpoint.js`);
      } else {
        console.error('❌ Failed to create user');
        console.error('Status:', res.statusCode);
        console.error('Response:', response);
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Connection error: ${e.message}`);
  console.log('\n💡 Make sure the server is running: npm run dev:server');
});

req.end();
