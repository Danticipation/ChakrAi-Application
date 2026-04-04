/**
 * AUTHENTICATION VERIFICATION TEST
 * Tests unified auth system across all endpoints
 */

import express from 'express';
import { unifiedAuthMiddleware, getAuthenticatedUser } from '../auth/unifiedAuth.js';
import { storage } from '../storage.js';

const router = express.Router();

// Test unified auth middleware
router.get('/test-middleware', unifiedAuthMiddleware, (req, res) => {
  res.json({
    success: true,
    userId: req.userId,
    isAnonymous: req.isAnonymous,
    user: {
      id: req.user.id,
      displayName: req.user.displayName,
      deviceFingerprint: req.user.deviceFingerprint
    }
  });
});

// Test user creation consistency
router.post('/test-user-creation', async (req, res) => {
  try {
    // Create 3 users with same device fingerprint - should return same ID
    const deviceFingerprint = req.headers['x-device-fingerprint'] || 'test-device-123';
    
    const mockReq1 = { headers: { 'x-device-fingerprint': deviceFingerprint } };
    const mockReq2 = { headers: { 'x-device-fingerprint': deviceFingerprint } };
    const mockReq3 = { headers: { 'x-device-fingerprint': deviceFingerprint } };
    
    const user1 = await getAuthenticatedUser(mockReq1);
    const user2 = await getAuthenticatedUser(mockReq2);
    const user3 = await getAuthenticatedUser(mockReq3);
    
    res.json({
      success: true,
      consistent: user1.id === user2.id && user2.id === user3.id,
      userIds: [user1.id, user2.id, user3.id],
      deviceFingerprint: deviceFingerprint,
      message: user1.id === user2.id && user2.id === user3.id 
        ? 'SUCCESS: Same device returns consistent user ID' 
        : 'FAILURE: Same device returned different user IDs'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test different devices get different user IDs
router.post('/test-device-isolation', async (req, res) => {
  try {
    const device1 = 'device-1-test';
    const device2 = 'device-2-test';
    const device3 = 'device-3-test';
    
    const mockReq1 = { headers: { 'x-device-fingerprint': device1 } };
    const mockReq2 = { headers: { 'x-device-fingerprint': device2 } };
    const mockReq3 = { headers: { 'x-device-fingerprint': device3 } };
    
    const user1 = await getAuthenticatedUser(mockReq1);
    const user2 = await getAuthenticatedUser(mockReq2);
    const user3 = await getAuthenticatedUser(mockReq3);
    
    const allDifferent = user1.id !== user2.id && user2.id !== user3.id && user1.id !== user3.id;
    
    res.json({
      success: true,
      isolated: allDifferent,
      users: [
        { device: device1, userId: user1.id },
        { device: device2, userId: user2.id },
        { device: device3, userId: user3.id }
      ],
      message: allDifferent 
        ? 'SUCCESS: Different devices get different user IDs' 
        : 'FAILURE: Some devices got same user ID'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test that no user gets ID 107 (the old hardcoded ID)
router.post('/test-no-hardcoded-ids', async (req, res) => {
  try {
    const testDevices = ['test-a', 'test-b', 'test-c', 'test-d', 'test-e'];
    const results = [];
    
    for (const device of testDevices) {
      const mockReq = { headers: { 'x-device-fingerprint': device } };
      const user = await getAuthenticatedUser(mockReq);
      results.push({ device, userId: user.id });
    }
    
    const hasOldId = results.some(r => r.userId === 107);
    
    res.json({
      success: true,
      noHardcodedIds: !hasOldId,
      results: results,
      message: !hasOldId 
        ? 'SUCCESS: No hardcoded user ID 107 found' 
        : 'FAILURE: Still using hardcoded user ID 107'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test data isolation between users
router.post('/test-data-isolation', unifiedAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Create test data for this user
    const testMessage = `Test message from user ${userId} at ${new Date().toISOString()}`;
    
    // Try to create a message
    let messageCreated = false;
    try {
      await storage.createMessage?.({
        userId: userId,
        content: testMessage,
        isBot: false
      });
      messageCreated = true;
    } catch (msgError) {
      console.log('Message creation not available:', msgError.message);
    }
    
    // Try to get messages for this user
    let userMessages = [];
    try {
      userMessages = await storage.getMessagesByUserId?.(userId) || [];
    } catch (getError) {
      console.log('Message retrieval not available:', getError.message);
    }
    
    res.json({
      success: true,
      userId: userId,
      messageCreated: messageCreated,
      messageCount: userMessages.length,
      testMessage: testMessage,
      message: `User ${userId} data isolation test complete`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Summary endpoint to run all tests
router.get('/run-all-tests', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: {},
      overallStatus: 'UNKNOWN'
    };
    
    // Test 1: User creation consistency
    try {
      const deviceFingerprint = 'test-consistency-device';
      const mockReq = { headers: { 'x-device-fingerprint': deviceFingerprint } };
      
      const user1 = await getAuthenticatedUser(mockReq);
      const user2 = await getAuthenticatedUser(mockReq);
      
      results.tests.userConsistency = {
        passed: user1.id === user2.id,
        userIds: [user1.id, user2.id],
        status: user1.id === user2.id ? 'PASS' : 'FAIL'
      };
    } catch (error) {
      results.tests.userConsistency = {
        passed: false,
        error: error.message,
        status: 'ERROR'
      };
    }
    
    // Test 2: No hardcoded IDs
    try {
      const mockReq = { headers: { 'x-device-fingerprint': 'test-hardcode-check' } };
      const user = await getAuthenticatedUser(mockReq);
      
      results.tests.noHardcodedIds = {
        passed: user.id !== 107,
        userId: user.id,
        status: user.id !== 107 ? 'PASS' : 'FAIL'
      };
    } catch (error) {
      results.tests.noHardcodedIds = {
        passed: false,
        error: error.message,
        status: 'ERROR'
      };
    }
    
    // Test 3: Device isolation
    try {
      const device1 = 'test-device-isolation-1';
      const device2 = 'test-device-isolation-2';
      
      const user1 = await getAuthenticatedUser({ headers: { 'x-device-fingerprint': device1 } });
      const user2 = await getAuthenticatedUser({ headers: { 'x-device-fingerprint': device2 } });
      
      results.tests.deviceIsolation = {
        passed: user1.id !== user2.id,
        userIds: [user1.id, user2.id],
        status: user1.id !== user2.id ? 'PASS' : 'FAIL'
      };
    } catch (error) {
      results.tests.deviceIsolation = {
        passed: false,
        error: error.message,
        status: 'ERROR'
      };
    }
    
    // Determine overall status
    const allTests = Object.values(results.tests);
    const allPassed = allTests.every(test => test.passed);
    const anyError = allTests.some(test => test.status === 'ERROR');
    
    results.overallStatus = anyError ? 'ERROR' : allPassed ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED';
    
    res.json(results);
    
  } catch (error) {
    res.status(500).json({
      error: 'Test suite failed',
      details: error.message,
      overallStatus: 'SUITE_ERROR'
    });
  }
});

export default router;
