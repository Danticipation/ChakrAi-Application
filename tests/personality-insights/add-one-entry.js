#!/usr/bin/env node

/**
 * Add one more journal entry to reach the 3+ data point threshold
 */

import http from 'http';

const API_HOST = 'localhost';
const API_PORT = 3001;
const TEST_USER_ID = process.env.TEST_USER_ID || '47';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('❌ AUTH_TOKEN environment variable required');
  process.exit(1);
}

function makeRequest(body) {
  return new Promise((resolve) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/journal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'x-user-id': TEST_USER_ID
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Journal entry added');
        } else {
          console.error(`❌ Failed: ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error: ${e.message}`);
      resolve();
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

async function addEntry() {
  console.log('📝 Adding one more journal entry to reach 3+ data points threshold...\n');
  
  await makeRequest({
    title: 'Self-Discovery Journey',
    content: 'I\'m learning so much about myself through these reflections. Each entry helps me understand my patterns better. I\'m excited to continue this journey of self-discovery and personal development.'
  });

  console.log('\n✅ Now you have 3+ data points!');
  console.log('\n🧪 Run the test again:');
  console.log(`$env:AUTH_TOKEN="${AUTH_TOKEN}"; $env:TEST_USER_ID="${TEST_USER_ID}"; node tests/personality-insights/test-enhanced-endpoint.js`);
}

addEntry();
