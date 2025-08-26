import express from 'express';
import { bulletproofMemory } from '../memory/BulletproofMemoryManager.js';
import { userSessionManager } from '../userSession.js';

const router = express.Router();

// 🧪 MEMORY SYSTEM DIAGNOSTICS & TESTING
router.get('/memory-test/:userId?', async (req, res) => {
  try {
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🧪 Running memory diagnostics for user ${userId}`);

    // Test 1: Get current memory status
    const contextData = await bulletproofMemory.getBulletproofContext(userId);
    
    // Test 2: Get cache statistics
    const cacheStats = bulletproofMemory.getCacheStats();
    
    // Test 3: Simulate memory storage test
    const testMessage = `Memory test at ${new Date().toISOString()}`;
    const memoryTest = await bulletproofMemory.processMessageWithGuaranteedMemory(
      userId,
      testMessage,
      'testing',
      false
    );

    // Test 4: Retrieve the test message back
    const retrievalTest = await bulletproofMemory.getBulletproofContext(userId);
    const testMessageFound = retrievalTest.messageHistory.some(msg => 
      msg.content.includes('Memory test at')
    );

    const diagnostics = {
      timestamp: new Date().toISOString(),
      userId: userId,
      memoryStrength: contextData.memoryStrength,
      messageCount: contextData.messageHistory.length,
      contextLength: contextData.contextString.length,
      cacheStats: cacheStats,
      tests: {
        memoryStorage: {
          success: memoryTest.success,
          error: memoryTest.error || null
        },
        memoryRetrieval: {
          success: testMessageFound,
          message: testMessageFound ? 'Test message found in context' : 'Test message not found'
        }
      },
      status: {
        overall: memoryTest.success && testMessageFound ? 'HEALTHY' : 'NEEDS_ATTENTION',
        memoryPersistence: memoryTest.success ? 'WORKING' : 'FAILING',
        contextRetrieval: testMessageFound ? 'WORKING' : 'FAILING'
      }
    };

    console.log(`🧪 Memory diagnostics complete:`, diagnostics.status);

    res.json(diagnostics);

  } catch (error) {
    console.error('🚨 Memory diagnostics failed:', error);
    res.status(500).json({
      error: 'Memory diagnostics failed',
      details: error.message,
      timestamp: new Date().toISOString(),
      status: {
        overall: 'ERROR',
        memoryPersistence: 'ERROR',
        contextRetrieval: 'ERROR'
      }
    });
  }
});

// 🧠 MEMORY DASHBOARD - Enhanced version with bulletproof memory
router.get('/memory-dashboard', async (req, res) => {
  try {
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🧠 Loading bulletproof memory dashboard for user ${userId}`);

    // Get comprehensive memory context
    const contextData = await bulletproofMemory.getBulletproofContext(userId);
    
    // Get cache statistics
    const cacheStats = bulletproofMemory.getCacheStats();

    // Analyze conversation patterns
    const messages = contextData.messageHistory;
    const userMessages = messages.filter(msg => msg.role === 'user');
    const botMessages = messages.filter(msg => msg.role === 'assistant');

    // Extract topics and emotions
    const allText = messages.map(msg => msg.content).join(' ').toLowerCase();
    const detectedTopics = [];
    
    if (allText.includes('anxiety') || allText.includes('anxious')) detectedTopics.push({ topic: 'anxiety', count: (allText.match(/anxiety|anxious/g) || []).length });
    if (allText.includes('stress') || allText.includes('stressed')) detectedTopics.push({ topic: 'stress', count: (allText.match(/stress|stressed/g) || []).length });
    if (allText.includes('depression') || allText.includes('depressed')) detectedTopics.push({ topic: 'depression', count: (allText.match(/depression|depressed/g) || []).length });
    if (allText.includes('work') || allText.includes('job')) detectedTopics.push({ topic: 'work', count: (allText.match(/work|job/g) || []).length });
    if (allText.includes('relationship') || allText.includes('partner')) detectedTopics.push({ topic: 'relationships', count: (allText.match(/relationship|partner/g) || []).length });

    // Build dashboard data
    const dashboard = {
      summary: {
        totalMemories: messages.length,
        activeMemories: messages.length,
        conversationSessions: 1, // Active session
        memoryConnections: detectedTopics.length,
        lastMemoryDate: messages.length > 0 ? new Date().toISOString() : null
      },
      stats: {
        totalMemories: messages.length,
        activeMemories: messages.length,
        connectionCount: userMessages.length + botMessages.length,
        insightCount: detectedTopics.length,
        topTopics: detectedTopics.sort((a, b) => b.count - a.count).slice(0, 5)
      },
      recentMemories: messages.slice(-10).map((msg, index) => ({
        id: index,
        content: msg.content,
        emotionalContext: 'analyzing...',
        temporalContext: 'recent',
        topics: [],
        semanticTags: [],
        accessCount: 1,
        createdAt: new Date().toISOString()
      })),
      topTopics: detectedTopics.slice(0, 5),
      memoryInsights: [
        {
          type: 'conversation_patterns',
          insight: `You've had ${userMessages.length} meaningful exchanges showing strong engagement with the therapeutic process.`,
          confidence: 0.9,
          generatedAt: new Date().toISOString()
        },
        {
          type: 'communication_style',
          insight: contextData.memoryStrength === 'strong' ? 
            'Your communication shows depth and consistency, indicating strong therapeutic alliance.' :
            'Building therapeutic rapport through consistent engagement.',
          confidence: contextData.memoryStrength === 'strong' ? 0.8 : 0.6,
          generatedAt: new Date().toISOString()
        }
      ],
      bulletproofStatus: {
        memoryStrength: contextData.memoryStrength,
        messagesInContext: contextData.messageHistory.length,
        cacheStats: cacheStats,
        systemStatus: 'ACTIVE',
        lastUpdate: new Date().toISOString()
      }
    };

    console.log(`🧠 Dashboard loaded with ${dashboard.summary.totalMemories} memories and ${dashboard.stats.topTopics.length} topics`);

    res.json(dashboard);

  } catch (error) {
    console.error('🚨 Memory dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load memory dashboard',
      details: error.message,
      bulletproofStatus: {
        systemStatus: 'ERROR',
        lastUpdate: new Date().toISOString()
      }
    });
  }
});

// 🗑️ CLEAR MEMORY CACHE (for testing)
router.post('/clear-cache/:userId?', async (req, res) => {
  try {
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🗑️ Clearing memory cache for user ${userId}`);

    bulletproofMemory.clearCache(userId);

    res.json({
      success: true,
      message: `Memory cache cleared for user ${userId}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Cache clear error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

// 📊 MEMORY STATISTICS
router.get('/memory-stats', async (req, res) => {
  try {
    const cacheStats = bulletproofMemory.getCacheStats();
    
    res.json({
      cacheStats: cacheStats,
      systemInfo: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      status: 'HEALTHY'
    });

  } catch (error) {
    console.error('🚨 Memory stats error:', error);
    res.status(500).json({
      error: 'Failed to get memory statistics',
      details: error.message,
      status: 'ERROR'
    });
  }
});

export default router;