#!/usr/bin/env node

/**
 * Add sample data to a test user so the endpoint has something to analyze
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

const requests = [
  {
    name: 'Add Journal Entry 1',
    method: 'POST',
    path: '/api/journal',
    body: {
      title: 'Reflection on Personal Growth',
      content: 'Today I realized how much I\'ve grown over the past few months. I\'m more aware of my emotions and better at managing stress. I\'ve been practicing mindfulness and it\'s really helping me stay grounded.'
    }
  },
  {
    name: 'Add Journal Entry 2',
    method: 'POST',
    path: '/api/journal',
    body: {
      title: 'Challenges I\'m Facing',
      content: 'I still struggle with perfectionism. I put too much pressure on myself to get everything right. I need to be gentler with myself and accept that mistakes are part of learning.'
    }
  },
  {
    name: 'Add Mood Entry 1',
    method: 'POST',
    path: '/api/mood',
    body: {
      mood: 'hopeful',
      intensity: 7,
      notes: 'Feeling positive about the future'
    }
  },
  {
    name: 'Add Mood Entry 2',
    method: 'POST',
    path: '/api/mood',
    body: {
      mood: 'anxious',
      intensity: 5,
      notes: 'Some work stress but manageable'
    }
  },
  {
    name: 'Add Chat Message',
    method: 'POST',
    path: '/api/chat',
    body: {
      content: 'I\'ve been thinking about my relationship patterns. I notice I tend to be avoidant when things get difficult. I want to work on being more open and vulnerable.',
      sessionId: 'session-1'
    }
  }
];

let completed = 0;

function makeRequest(req) {
  return new Promise((resolve) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: req.path,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'x-user-id': TEST_USER_ID
      }
    };

    const httpReq = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        completed++;
        const status = res.statusCode === 200 || res.statusCode === 201 ? '✅' : '⚠️';
        console.log(`${status} ${req.name} (${res.statusCode})`);
        resolve();
      });
    });

    httpReq.on('error', (e) => {
      completed++;
      console.error(`❌ ${req.name}: ${e.message}`);
      resolve();
    });

    httpReq.write(JSON.stringify(req.body));
    httpReq.end();
  });
}

async function addData() {
  console.log('📝 Adding sample data to test user...\n');
  
  for (const req of requests) {
    await makeRequest(req);
  }

  console.log(`\n✅ Added ${completed} data points`);
  console.log('\n🧪 Now run the test:');
  console.log(`$env:AUTH_TOKEN="${AUTH_TOKEN}"; $env:TEST_USER_ID="${TEST_USER_ID}"; node tests/personality-insights/test-enhanced-endpoint.js`);
}

addData();
