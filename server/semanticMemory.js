import { openai } from './openaiRetry.js';
import { storage } from './storage.js';

/**
 * Semantic Memory Service - Intelligent conversation analysis and contextual recall
 * Transforms static getUserMemories() into dynamic semantic recall system
 */

// Analyze conversation and extract semantic meaning
export async function analyzeConversationForMemory(userId, userMessage, botResponse, sessionId = null) {
  try {
    const analysisPrompt = `Analyze this conversation for semantic memory storage:

USER: ${userMessage}
BOT: ${botResponse}

Extract semantic information and return JSON with exactly these fields:
{
  "keyTopics": ["actual_topic1", "actual_topic2"],
  "emotionalContext": "user's actual emotional state or feeling",
  "temporalContext": "time reference (today, this week, recently, etc)", 
  "memoryType": "conversation",
  "importance": 5,
  "semanticTags": ["actual", "tags", "from", "conversation"],
  "relatedTopics": ["related_topic1", "related_topic2"],
  "summary": "Accurate summary of what the user actually discussed in this specific conversation"
}

CRITICAL: Base the summary and all fields on the ACTUAL conversation content above, not on examples. The summary must reflect what was really discussed.`;

    // Use Ollama in development, OpenAI in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    let response;
    
    if (isDevelopment) {
      try {
        console.log('🦙 Using Ollama for semantic memory analysis in development mode');
        const { generateOllamaResponse, isOllamaAvailable } = await import('./ollamaIntegration');
        
        if (await isOllamaAvailable()) {
          const ollamaMessages = [{ role: 'user', content: analysisPrompt }];
          const responseText = await generateOllamaResponse(ollamaMessages);
          response = { choices: [{ message: { content: responseText } }] };
          console.log('✅ Ollama semantic analysis completed');
        } else {
          console.log('⚠️ Ollama not available, falling back to OpenAI');
          throw new Error('Ollama not available');
        }
      } catch (ollamaError) {
        console.log('❌ Ollama semantic analysis failed, using OpenAI fallback:', ollamaError.message);
        response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: analysisPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.3
        });
      }
    } else {
      // Production mode - use OpenAI
      console.log('🤖 Using OpenAI for semantic memory analysis in production mode');
      response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });
    }

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    // Store conversation summary if it doesn't exist
    let conversationSummary = null;
    if (sessionId) {
      conversationSummary = await storage.getConversationSummary(userId, sessionId);
    }
    
    if (!conversationSummary && analysis.summary) {
      conversationSummary = await storage.createConversationSummary({
        userId,
        sessionId: sessionId || `session_${Date.now()}`,
        summary: analysis.summary,
        keyTopics: analysis.keyTopics || [],
        emotionalTone: analysis.emotionalContext || '',
        importance: analysis.importance || 5,
        messageCount: 1,
        startedAt: new Date(),
        lastUpdatedAt: new Date()
      });
    } else if (conversationSummary) {
      // Update existing conversation summary
      await storage.updateConversationSummary(conversationSummary.id, {
        summary: `${conversationSummary.summary}. ${analysis.summary}`,
        keyTopics: [...new Set([...conversationSummary.keyTopics, ...analysis.keyTopics])],
        messageCount: conversationSummary.messageCount + 1,
        lastUpdatedAt: new Date()
      });
    }

    // Create semantic memory
    const semanticMemory = await storage.createSemanticMemory({
      userId,
      memoryType: analysis.memoryType || 'conversation',
      content: analysis.summary || `${userMessage} -> ${botResponse}`,
      semanticTags: analysis.semanticTags || [],
      emotionalContext: analysis.emotionalContext,
      temporalContext: analysis.temporalContext,
      relatedTopics: analysis.relatedTopics || [],
      confidence: "0.85",
      sourceConversationId: conversationSummary?.id,
      isActiveMemory: true
    });

    // Analyze for memory connections
    await findAndCreateMemoryConnections(userId, semanticMemory.id, analysis);

    // Extract discrete facts for long-term memory
    try {
      await extractAndStoreFacts(userId, userMessage, botResponse);
    } catch (factError) {
      console.error('Error extracting facts:', factError);
    }

    console.log(`Semantic memory created: ${semanticMemory.id}`);
    return semanticMemory;
  } catch (error) {
    console.error('Error analyzing conversation for memory:', error);
    return null;
  }
}

// Find connections between memories
async function findAndCreateMemoryConnections(userId, newMemoryId, analysis) {
  try {
    const recentMemories = await storage.getRecentSemanticMemories(userId, 10);
    
    for (const memory of recentMemories) {
      if (memory.id === newMemoryId) continue;
      
      // Check for topic overlap
      const topicOverlap = analysis.semanticTags?.filter(tag => 
        memory.semanticTags?.includes(tag)
      ) || [];
      
      const relatedTopicOverlap = analysis.relatedTopics?.filter(topic =>
        memory.relatedTopics?.includes(topic)
      ) || [];
      
      if (topicOverlap.length > 0 || relatedTopicOverlap.length > 0) {
        const connectionStrength = Math.min(0.95, 
          (topicOverlap.length * 0.3 + relatedTopicOverlap.length * 0.2) / 2
        );
        
        if (connectionStrength > 0.2) {
          await storage.createMemoryConnection({
            userId,
            fromMemoryId: memory.id,
            toMemoryId: newMemoryId,
            connectionType: 'relates_to',
            strength: connectionStrength.toString(),
            automaticConnection: true
          });
        }
      }
    }
  } catch (error) {
    console.error('Error creating memory connections:', error);
  }
}

// Enhanced semantic recall for chat responses
export async function getSemanticContext(userId, currentMessage) {
  try {
    const contextPrompt = `Analyze this user message for memory recall: "${currentMessage}"

Extract keywords and topics that might connect to past conversations.
Return JSON with:
{
  "searchTerms": ["work", "stress", "overwhelmed"],
  "emotionalContext": "current emotional state",
  "temporalReferences": ["last week", "recently", "before"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: contextPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const context = JSON.parse(response.choices[0].message.content || '{}');
    
    // Search for relevant memories
    const relevantMemories = await storage.searchSemanticMemories(
      userId, 
      context.searchTerms || [],
      5
    );

    // Get memory connections for deeper context
    const connectedMemories = [];
    for (const memory of relevantMemories) {
      const connections = await storage.getMemoryConnections(memory.id);
      connectedMemories.push(...connections);
    }

    return {
      relevantMemories,
      connectedMemories: connectedMemories.slice(0, 3),
      searchContext: context
    };
  } catch (error) {
    console.error('Error getting semantic context:', error);
    return { relevantMemories: [], connectedMemories: [], searchContext: {} };
  }
}

// Generate contextual references for bot responses
export async function generateContextualReferences(userId, currentMessage, semanticContext) {
  try {
    if (!semanticContext.relevantMemories?.length) {
      return { hasReferences: false, references: [] };
    }

    const memoryTexts = semanticContext.relevantMemories
      .map(m => `${m.temporalContext}: ${m.content}`)
      .join('\n');

    const referencePrompt = `Based on these past conversations, generate contextual references for the bot response:

PAST MEMORIES:
${memoryTexts}

CURRENT MESSAGE: ${currentMessage}

Generate natural references the bot can make, like:
"Last week, you mentioned feeling overwhelmed at work — has anything improved since then?"
"You've been working on managing stress — how are those techniques helping?"

Return JSON with:
{
  "hasReferences": true,
  "references": [
    {
      "text": "Last week, you mentioned feeling overwhelmed at work",
      "followUp": "has anything improved since then?",
      "memoryId": 123,
      "confidence": 0.9
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [{ role: "user", content: referencePrompt }],
      response_format: { type: "json_object" },
      temperature: 0.4
    });

    const references = JSON.parse(response.choices[0].message.content || '{}');
    
    // Update access counts for referenced memories
    for (const ref of references.references || []) {
      if (ref.memoryId) {
        await storage.updateMemoryAccessCount(ref.memoryId);
      }
    }

    return references;
  } catch (error) {
    console.error('Error generating contextual references:', error);
    return { hasReferences: false, references: [] };
  }
}

// Generate memory insights for dashboard
export async function generateMemoryInsights(userId) {
  try {
    const recentMemories = await storage.getRecentSemanticMemories(userId, 20);
    const memoryConnections = await storage.getAllUserMemoryConnections(userId);
    
    if (recentMemories.length === 0) {
      return [];
    }

    const memoryTexts = recentMemories.map(m => 
      `${m.createdAt.toDateString()}: ${m.content} [${m.semanticTags?.join(', ')}]`
    ).join('\n');

    const insightPrompt = `Analyze these user memories to generate therapeutic insights:

${memoryTexts}

Generate insights about patterns, growth, concerns, and progress. Return JSON with:
{
  "insights": [
    {
      "type": "pattern",
      "insight": "User consistently mentions work stress on Mondays, suggesting weekend-to-workweek transition difficulty",
      "supportingMemoryIds": [1, 3, 7],
      "confidence": 0.8
    },
    {
      "type": "growth", 
      "insight": "Increasing use of coping strategies shows developing emotional regulation skills",
      "supportingMemoryIds": [2, 5, 9],
      "confidence": 0.9
    }
  ]
}

Focus on therapeutically valuable insights that show progress, patterns, or areas for attention.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: insightPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
    const insights = [];

    for (const insight of analysisResult.insights || []) {
      const memoryInsight = await storage.createMemoryInsight({
        userId,
        insightType: insight.type,
        insight: insight.insight,
        supportingMemories: insight.supportingMemoryIds?.map(String) || [],
        confidence: insight.confidence?.toString() || "0.75",
        isSharedWithUser: false
      });
      insights.push(memoryInsight);
    }

    return insights;
  } catch (error) {
    console.error('Error generating memory insights:', error);
    return [];
  }
}

// Get memory dashboard data
export async function getMemoryDashboard(userId) {
  try {
    const [memories, insights, connections] = await Promise.all([
      storage.getRecentSemanticMemories(userId, 15),
      storage.getMemoryInsights(userId),
      storage.getAllUserMemoryConnections(userId)
    ]);

    // Group memories by type and time
    const memoriesByType = memories.reduce((acc, memory) => {
      acc[memory.memoryType] = acc[memory.memoryType] || [];
      acc[memory.memoryType].push(memory);
      return acc;
    }, {});

    const memoriesByTime = memories.reduce((acc, memory) => {
      const timeframe = getTimeframe(memory.createdAt);
      acc[timeframe] = acc[timeframe] || [];
      acc[timeframe].push(memory);
      return acc;
    }, {});

    // Calculate memory statistics
    const stats = {
      totalMemories: memories.length,
      activeMemories: memories.filter(m => m.isActiveMemory).length,
      mostAccessedMemory: memories.reduce((max, m) => m.accessCount > max.accessCount ? m : max, memories[0]),
      topTopics: getTopTopics(memories),
      connectionCount: connections.length,
      insightCount: insights.length
    };

    return {
      memories,
      insights,
      connections,
      memoriesByType,
      memoriesByTime,
      stats
    };
  } catch (error) {
    console.error('Error getting memory dashboard:', error);
    return {
      memories: [],
      insights: [],
      connections: [],
      memoriesByType: {},
      memoriesByTime: {},
      stats: {}
    };
  }
}

// Helper functions
function getTimeframe(date) {
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'this_week';
  if (diffDays <= 30) return 'this_month';
  return 'older';
}

function getTopTopics(memories) {
  const topicCounts = {};
  memories.forEach(memory => {
    memory.semanticTags?.forEach(tag => {
      topicCounts[tag] = (topicCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(topicCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));
}

// Extract and store discrete facts from conversation
export async function extractAndStoreFacts(userId, userMessage, botResponse) {
  try {
    const factPrompt = `Analyze this conversation to extract discrete, persistent facts about the user:

USER: ${userMessage}
BOT: ${botResponse}

Extract only clear, factual statements that should be remembered long-term. Return JSON:
{
  "facts": [
    // Only include facts explicitly mentioned by the user in the conversation above
  ]
}

Categories: personal_life, career, health, relationships, interests, preferences, challenges, goals

CRITICAL: Only include facts explicitly mentioned by the user. Do not infer, assume, or use examples. If no facts are mentioned, return empty facts array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: factPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const factData = JSON.parse(response.choices[0].message.content || '{}');
    
    // Check for existing facts to avoid duplicates
    const existingFacts = await storage.getUserFacts(userId);
    const existingFactTexts = existingFacts.map(f => f.fact.toLowerCase());
    
    for (const factInfo of factData.facts || []) {
      if (factInfo.fact && !existingFactTexts.includes(factInfo.fact.toLowerCase())) {
        await storage.createUserFact({
          userId,
          fact: factInfo.fact,
          category: factInfo.category || 'general'
        });
        console.log(`📝 New fact stored: ${factInfo.fact}`);
      }
    }
  } catch (error) {
    console.error('Error extracting facts:', error);
  }
}