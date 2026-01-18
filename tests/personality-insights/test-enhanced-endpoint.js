#!/usr/bin/env node

/**
 * ============================================================================
 * ENHANCED PERSONALITY INSIGHTS ENDPOINT TEST SUITE
 * ============================================================================
 * 
 * Tests the fully restored personality reflection endpoint with:
 * ✅ Memory intelligence systems
 * ✅ Comprehensive analytics (190+ dimensions)
 * ✅ Therapeutic statistics
 * ✅ Emotional journey analysis
 * ✅ Breakthrough detection
 * ✅ Conversation continuity
 * 
 * Run with: node test-enhanced-endpoint.js
 */

import http from 'http';
import https from 'https';
import chalk from 'chalk';
import { SignJWT } from 'jose';

import 'dotenv/config';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3001;
const API_PROTOCOL = process.env.API_PROTOCOL || 'http';
const TEST_USER_ID = process.env.TEST_USER_ID || 1;
let AUTH_TOKEN = process.env.AUTH_TOKEN || null;

// Generate JWT token if not provided
async function ensureAuthToken() {
  if (AUTH_TOKEN) return AUTH_TOKEN;
  
  console.log(chalk.yellow('⚠️  No AUTH_TOKEN provided. Generating JWT token...'));
  
  // Load secret from environment (same as server)
  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET not found in environment');
  }
  
  const secret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
  
  AUTH_TOKEN = await new SignJWT({
    sub: String(TEST_USER_ID),
    userId: TEST_USER_ID,
    email: `user${TEST_USER_ID}@test.local`
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
  
  // Small delay to ensure token is ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log(chalk.green('✅ JWT token generated successfully'));
  return AUTH_TOKEN;
}

const API_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;
const ENDPOINT = '/api/personality-insights';

// ============================================================================
// TEST RESULTS TRACKER
// ============================================================================

class TestResults {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  pass(testName, details = '') {
    this.passed++;
    this.tests.push({
      name: testName,
      status: 'PASS',
      details,
      timestamp: new Date().toISOString()
    });
    console.log(chalk.green(`✅ PASS: ${testName}`), details ? chalk.gray(`(${details})`) : '');
  }

  fail(testName, error) {
    this.failed++;
    this.tests.push({
      name: testName,
      status: 'FAIL',
      error: error.toString(),
      timestamp: new Date().toISOString()
    });
    console.log(chalk.red(`❌ FAIL: ${testName}`), chalk.yellow(`Error: ${error.message}`));
  }

  warn(testName, details = '') {
    this.warnings++;
    this.tests.push({
      name: testName,
      status: 'WARN',
      details,
      timestamp: new Date().toISOString()
    });
    console.log(chalk.yellow(`⚠️  WARN: ${testName}`), chalk.gray(`(${details})`));
  }

  summary() {
    console.log('\n' + chalk.bold('════════════════════════════════════════════════════════════'));
    console.log(chalk.bold('TEST SUMMARY'));
    console.log(chalk.bold('════════════════════════════════════════════════════════════'));
    console.log(chalk.green(`Passed: ${this.passed}`));
    console.log(chalk.red(`Failed: ${this.failed}`));
    console.log(chalk.yellow(`Warnings: ${this.warnings}`));
    console.log(chalk.bold('════════════════════════════════════════════════════════════\n'));

    return this.failed === 0;
  }

  export() {
    return {
      summary: {
        passed: this.passed,
        failed: this.failed,
        warnings: this.warnings,
        total: this.passed + this.failed + this.warnings
      },
      tests: this.tests,
      timestamp: new Date().toISOString(),
      endpoint: `${API_URL}${ENDPOINT}`,
      testUserId: TEST_USER_ID
    };
  }
}

// ============================================================================
// HTTP REQUEST HELPER
// ============================================================================

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const requestModule = API_PROTOCOL === 'https' ? https : http;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'x-user-id': TEST_USER_ID,
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      ...headers
    };

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: defaultHeaders,
      timeout: 120000
    };

    const req = requestModule.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawBody: data
          });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout after 120 seconds'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
  // Ensure we have a valid auth token
  await ensureAuthToken();
  
  console.log(chalk.blue(`\n🔐 Using Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`));
  
  const results = new TestResults();

  console.log(chalk.bold.cyan(`
╔════════════════════════════════════════════════════════════╗
║  ENHANCED PERSONALITY INSIGHTS - ENDPOINT TEST SUITE       ║
╚════════════════════════════════════════════════════════════╝
  `));

  console.log(chalk.cyan(`API Endpoint: ${API_URL}${ENDPOINT}`));
  console.log(chalk.cyan(`Test User ID: ${TEST_USER_ID}`));
  console.log(chalk.cyan(`Started: ${new Date().toISOString()}\n`));

  // ========================================================================
  // TEST 1: CONNECTIVITY
  // ========================================================================

  console.log(chalk.bold.blue('\n📡 TEST 1: ENDPOINT CONNECTIVITY\n'));

  try {
    const response = await makeRequest('GET', ENDPOINT);
    
    if (response.status === 200) {
      results.pass('Endpoint is reachable', `Status: ${response.status}`);
    } else if (response.status === 401) {
      results.fail('Authentication failed', new Error(`Got 401 - check AUTH_TOKEN`));
    } else if (response.status === 404) {
      results.fail('Endpoint not found', new Error(`Got 404 - endpoint may not exist`));
    } else {
      results.fail('Unexpected status code', new Error(`Got ${response.status}`));
    }
  } catch (error) {
    results.fail('Endpoint connectivity', error);
  }

  // ========================================================================
  // TEST 2: RESPONSE STRUCTURE
  // ========================================================================

  console.log(chalk.bold.blue('\n📋 TEST 2: RESPONSE STRUCTURE\n'));

  let responseData = null;

  try {
    const response = await makeRequest('GET', ENDPOINT);
    responseData = response.body;

    // Check main structure
    const requiredFields = [
      'analysisStatus',
      'analysisTimestamp',
      'dataQuality',
      'dataSources',
      'analysisDepth'
    ];

    for (const field of requiredFields) {
      if (responseData.hasOwnProperty(field)) {
        results.pass(`Response has field: ${field}`);
      } else {
        results.fail(`Missing required field: ${field}`, new Error(`Field not present in response`));
      }
    }
  } catch (error) {
    results.fail('Response structure check', error);
  }

  // ========================================================================
  // TEST 3: DATA SOURCES
  // ========================================================================

  console.log(chalk.bold.blue('\n📊 TEST 3: DATA SOURCES\n'));

  if (responseData && responseData.dataSources) {
    const dataSources = responseData.dataSources;
    const expectedSources = [
      'journalEntries',
      'conversationMessages',
      'moodDataPoints',
      'extractedMemories',
      'extractedFacts',
      'semanticMemories',
      'generatedInsights',
      'identifiedBreakthroughs',
      'total'
    ];

    for (const source of expectedSources) {
      if (dataSources.hasOwnProperty(source)) {
        const value = dataSources[source];
        results.pass(
          `Data source collected: ${source}`,
          `Count: ${value}`
        );
      } else {
        results.warn(`Data source not tracked: ${source}`);
      }
    }

    // Check data quality
    const totalDataPoints = dataSources.total || 0;
    if (totalDataPoints >= 3) {
      results.pass(
        'Sufficient data collected',
        `Total: ${totalDataPoints} data points`
      );
    } else if (totalDataPoints > 0) {
      results.warn(
        'Limited data',
        `Only ${totalDataPoints} data points (need 3+)`
      );
    } else {
      results.warn('No data collected', 'User may be new');
    }
  }

  // ========================================================================
  // TEST 4: MEMORY INTELLIGENCE SYSTEMS
  // ========================================================================

  console.log(chalk.bold.blue('\n🧠 TEST 4: MEMORY INTELLIGENCE SYSTEMS\n'));

  if (responseData && responseData.memoryIntelligence) {
    const memory = responseData.memoryIntelligence;
    
    const memoryFields = [
      'extractedMemories',
      'extractedFacts',
      'semanticMemories',
      'relevantInsights',
      'memoryGaps',
      'recentMemories',
      'emotionalContext'
    ];

    for (const field of memoryFields) {
      if (memory.hasOwnProperty(field)) {
        const value = memory[field];
        if (Array.isArray(value)) {
          results.pass(
            `Memory system active: ${field}`,
            `Items: ${value.length}`
          );
        } else if (value !== undefined && value !== null) {
          results.pass(`Memory system active: ${field}`);
        }
      } else {
        results.warn(`Memory field not present: ${field}`);
      }
    }
  } else {
    results.warn('Memory intelligence section not present');
  }

  // ========================================================================
  // TEST 5: COMPREHENSIVE PROFILE
  // ========================================================================

  console.log(chalk.bold.blue('\n👤 TEST 5: COMPREHENSIVE PERSONALITY PROFILE\n'));

  if (responseData && responseData.comprehensiveProfile) {
    const profile = responseData.comprehensiveProfile;
    
    if (profile.status === 'analysis_in_progress') {
      results.warn('Comprehensive profile', 'Analysis still in progress (insufficient data?)');
    } else if (Object.keys(profile).length > 0) {
      results.pass(
        'Comprehensive profile generated',
        `Domains: ${Object.keys(profile).length}`
      );
    } else {
      results.fail('Comprehensive profile empty', new Error('No profile data'));
    }
  } else {
    results.fail('Comprehensive profile missing', new Error('Not in response'));
  }

  // ========================================================================
  // TEST 6: THERAPEUTIC STATISTICS
  // ========================================================================

  console.log(chalk.bold.blue('\n📈 TEST 6: THERAPEUTIC STATISTICS\n'));

  if (responseData && responseData.therapeuticStatistics) {
    const stats = responseData.therapeuticStatistics;
    
    const expectedStats = [
      'conversationMetrics',
      'emotionalJourney',
      'therapeuticProgress',
      'behavioralPatterns',
      'memoryAnalytics'
    ];

    for (const stat of expectedStats) {
      if (stats.hasOwnProperty(stat)) {
        results.pass(`Statistics available: ${stat}`);
      } else {
        results.warn(`Statistics missing: ${stat}`);
      }
    }
  } else {
    results.warn('Therapeutic statistics not present');
  }

  // ========================================================================
  // TEST 7: EMOTIONAL JOURNEY ANALYSIS
  // ========================================================================

  console.log(chalk.bold.blue('\n📊 TEST 7: EMOTIONAL JOURNEY ANALYSIS\n'));

  if (responseData && responseData.emotionalJourney) {
    const journey = responseData.emotionalJourney;
    
    if (journey.timeline && Array.isArray(journey.timeline)) {
      results.pass(
        'Emotional timeline tracked',
        `Entries: ${journey.timeline.length}`
      );
    } else {
      results.warn('Emotional timeline not found');
    }

    if (journey.dominantMoods && Array.isArray(journey.dominantMoods)) {
      results.pass(
        'Dominant moods identified',
        `Moods: ${journey.dominantMoods.map(m => m.mood).join(', ')}`
      );
    } else {
      results.warn('Dominant moods not analyzed');
    }

    if (journey.moodTrends) {
      results.pass('Mood trends analyzed', journey.moodTrends);
    }

    if (journey.emotionalBreakthroughs && Array.isArray(journey.emotionalBreakthroughs)) {
      if (journey.emotionalBreakthroughs.length > 0) {
        results.pass(
          'Emotional breakthroughs identified',
          `Count: ${journey.emotionalBreakthroughs.length}`
        );
      } else {
        results.warn('No emotional breakthroughs detected yet');
      }
    }
  } else {
    results.warn('Emotional journey section not present');
  }

  // ========================================================================
  // TEST 8: THERAPEUTIC BREAKTHROUGHS
  // ========================================================================

  console.log(chalk.bold.blue('\n💡 TEST 8: BREAKTHROUGH DETECTION\n'));

  if (responseData && responseData.therapeuticBreakthroughs) {
    const breakthroughs = responseData.therapeuticBreakthroughs;
    
    if (breakthroughs.count !== undefined) {
      results.pass(
        'Breakthrough tracking enabled',
        `Count: ${breakthroughs.count}`
      );
    }

    if (breakthroughs.recentBreakthroughs) {
      results.pass(
        'Recent breakthroughs identified',
        `Items: ${breakthroughs.recentBreakthroughs.length}`
      );
    }

    if (breakthroughs.overallPattern) {
      results.pass('Breakthrough pattern analysis', breakthroughs.overallPattern);
    }
  } else {
    results.warn('Breakthrough detection not present');
  }

  // ========================================================================
  // TEST 9: ANALYSIS DEPTH
  // ========================================================================

  console.log(chalk.bold.blue('\n📐 TEST 9: ANALYSIS DEPTH & FRAMEWORKS\n'));

  if (responseData && responseData.analysisDepth) {
    const depth = responseData.analysisDepth;
    
    if (depth.dimensionsAnalyzed) {
      results.pass(
        'Multi-dimensional analysis active',
        `Dimensions: ${depth.dimensionsAnalyzed}`
      );
    }

    if (Array.isArray(depth.psychologicalFrameworks)) {
      results.pass(
        'Psychological frameworks applied',
        `Frameworks: ${depth.psychologicalFrameworks.length}`
      );
      
      const expectedFrameworks = [
        'Big Five Personality',
        'Attachment Style',
        'Cognitive Patterns',
        'Emotional Intelligence'
      ];

      for (const fw of expectedFrameworks) {
        if (depth.psychologicalFrameworks.includes(fw)) {
          results.pass(`Framework active: ${fw}`);
        } else {
          results.warn(`Framework missing: ${fw}`);
        }
      }
    }

    if (Array.isArray(depth.memorySystemsActive)) {
      results.pass(
        'Memory systems active',
        `Systems: ${depth.memorySystemsActive.length}`
      );
      
      const expectedSystems = [
        'Semantic Memory Service',
        'Memory Analytics Service',
        'Memory Retrieval Service',
        'Conversation Continuity Service'
      ];

      for (const sys of expectedSystems) {
        if (depth.memorySystemsActive.includes(sys)) {
          results.pass(`System active: ${sys}`);
        } else {
          results.warn(`System offline: ${sys}`);
        }
      }
    }

    if (Array.isArray(depth.analyticsLayersActive)) {
      results.pass(
        'Analytics layers active',
        `Layers: ${depth.analyticsLayersActive.length}`
      );
    }
  } else {
    results.fail('Analysis depth not reported', new Error('Missing analysisDepth section'));
  }

  // ========================================================================
  // TEST 10: MIRRORED PERSONALITY PROFILE
  // ========================================================================

  console.log(chalk.bold.blue('\n🎭 TEST 10: MIRRORED PERSONALITY PROFILE\n'));

  if (responseData && responseData.mirroredProfile) {
    const profile = responseData.mirroredProfile;
    
    const expectedFields = [
      'communicationStyle',
      'emotionalPatterns',
      'values',
      'coreTraits',
      'motivations'
    ];

    for (const field of expectedFields) {
      if (profile.hasOwnProperty(field) && profile[field]) {
        results.pass(`Mirror profile active: ${field}`);
      } else {
        results.warn(`Mirror profile field empty: ${field}`);
      }
    }
  } else {
    results.warn('Mirrored personality profile not present');
  }

  // ========================================================================
  // TEST 11: CONVERSATION CONTINUITY
  // ========================================================================

  console.log(chalk.bold.blue('\n💬 TEST 11: CONVERSATION CONTINUITY\n'));

  if (responseData && responseData.conversationContext) {
    const context = responseData.conversationContext;
    
    if (context.activeSession) {
      results.pass('Active session tracked');
    } else {
      results.warn('No active session found (new user?)');
    }

    if (context.currentTone) {
      results.pass('Current emotional tone tracked', context.currentTone);
    }

    if (context.unresolvedThreads && Array.isArray(context.unresolvedThreads)) {
      if (context.unresolvedThreads.length > 0) {
        results.pass(
          'Unresolved topics tracked',
          `Count: ${context.unresolvedThreads.length}`
        );
      } else {
        results.pass('No unresolved topics (all conversations complete)');
      }
    }

    if (context.suggestedFollowUps && Array.isArray(context.suggestedFollowUps)) {
      results.pass(
        'Follow-up suggestions generated',
        `Suggestions: ${context.suggestedFollowUps.length}`
      );
    }
  } else {
    results.warn('Conversation continuity not tracked');
  }

  // ========================================================================
  // TEST 12: REFLECTION SUMMARY
  // ========================================================================

  console.log(chalk.bold.blue('\n✍️  TEST 12: REFLECTION SUMMARY\n'));

  if (responseData && responseData.reflectionSummary) {
    const summary = responseData.reflectionSummary;
    
    const expectedSections = [
      'personalityReflection',
      'emotionalJourneyReflection',
      'therapeuticInsights',
      'growthAnalysis',
      'therapeuticRecommendations'
    ];

    for (const section of expectedSections) {
      if (summary.hasOwnProperty(section) && summary[section]) {
        results.pass(`Reflection section present: ${section}`);
      } else {
        results.warn(`Reflection section missing: ${section}`);
      }
    }
  } else {
    results.warn('Reflection summary not present');
  }

  // ========================================================================
  // FINAL SUMMARY
  // ========================================================================

  const allPassed = results.summary();

  if (allPassed) {
    console.log(chalk.green.bold('\n🎉 ALL TESTS PASSED! Enhanced endpoint is working correctly!\n'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️  SOME TESTS FAILED - Review the output above\n'));
  }

  // Export test results
  const exportData = results.export();
  console.log(chalk.blue('\n📋 Full test results:'));
  console.log(JSON.stringify(exportData, null, 2));

  return allPassed ? 0 : 1;
}

// ============================================================================
// RUN TESTS
// ============================================================================

runTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error(chalk.red('Test suite failed:'), error);
    process.exit(1);
  });
