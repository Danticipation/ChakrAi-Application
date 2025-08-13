// MEMORY SYSTEM TYPES - Comprehensive type definitions for therapeutic memory

export interface MemoryContext {
  userId: number;
  sessionId?: string;
  conversationId?: string;
  emotionalState?: string;
  therapeuticGoals?: string[];
  currentTopics?: string[];
  timeContext?: Date;
}

export interface ConversationSession {
  id: number;
  userId: number;
  sessionKey: string;
  title: string;
  keyTopics: string[];
  emotionalTone: string;
  unresolvedThreads: Record<string, any>;
  contextCarryover: Record<string, any>;
  messageCount: number;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
}

export interface SemanticMemory {
  id: number;
  userId: number;
  memoryType: 'conversation' | 'insight' | 'pattern' | 'goal' | 'breakthrough';
  content: string;
  semanticTags: string[];
  emotionalContext?: string;
  temporalContext?: string;
  relatedTopics: string[];
  confidence: string;
  accessCount: number;
  sourceConversationId?: string;
  isActiveMemory: boolean;
  lastAccessedAt?: Date;
  createdAt: Date;
}

export interface MemoryConnection {
  id: number;
  userId: number;
  fromMemoryId: number;
  toMemoryId: number;
  connectionType: 'relates_to' | 'contradicts' | 'builds_on' | 'resolves' | 'triggers';
  strength: string;
  automaticConnection: boolean;
  createdAt: Date;
}

export interface MemoryInsight {
  id: number;
  userId: number;
  insightType: 'pattern' | 'growth' | 'concern' | 'breakthrough' | 'recurring_theme';
  content: string;
  relatedMemoryIds: number[];
  confidence: string;
  therapeuticRelevance: string;
  actionSuggestions?: string[];
  createdAt: Date;
}

export interface ConversationThread {
  id: number;
  sessionId: number;
  threadType: 'main' | 'tangent' | 'emotional_processing' | 'goal_setting';
  topic: string;
  emotionalIntensity: number;
  isResolved: boolean;
  keyMessages: string[];
  insights: string[];
  createdAt: Date;
}

// Core Service Interfaces
export interface ISemanticMemoryService {
  // Memory Creation & Storage
  extractAndStoreMemories(content: string, context: MemoryContext): Promise<SemanticMemory[]>;
  createMemory(memory: Partial<SemanticMemory>): Promise<SemanticMemory>;
  updateMemory(id: number, updates: Partial<SemanticMemory>): Promise<SemanticMemory>;
  
  // Memory Retrieval
  getRecentMemories(userId: number, limit?: number): Promise<SemanticMemory[]>;
  getMemoriesByType(userId: number, type: SemanticMemory['memoryType']): Promise<SemanticMemory[]>;
  searchMemories(userId: number, query: string, limit?: number): Promise<SemanticMemory[]>;
  getRelatedMemories(memoryId: number): Promise<SemanticMemory[]>;
}

export interface IConversationContinuityService {
  // Session Management
  createSession(userId: number, initialContext?: any): Promise<ConversationSession>;
  getActiveSession(userId: number): Promise<ConversationSession | null>;
  updateSession(sessionId: number, updates: Partial<ConversationSession>): Promise<ConversationSession>;
  closeSession(sessionId: number): Promise<void>;
  
  // Context Management
  loadConversationContext(userId: number, sessionId?: number): Promise<any>;
  updateConversationContext(sessionId: number, context: any): Promise<void>;
  getSessionHistory(userId: number, limit?: number): Promise<ConversationSession[]>;
  
  // Thread Management
  createThread(sessionId: number, threadData: Partial<ConversationThread>): Promise<ConversationThread>;
  getActiveThreads(sessionId: number): Promise<ConversationThread[]>;
  resolveThread(threadId: number, resolution?: string): Promise<void>;
}

export interface IMemoryConnectionService {
  // Connection Management
  createConnection(connection: Partial<MemoryConnection>): Promise<MemoryConnection>;
  findConnections(memoryId: number): Promise<MemoryConnection[]>;
  suggestConnections(memoryId: number): Promise<MemoryConnection[]>;
  
  // Graph Operations
  getMemoryGraph(userId: number): Promise<{ memories: SemanticMemory[], connections: MemoryConnection[] }>;
  findMemoryPaths(fromMemoryId: number, toMemoryId: number): Promise<MemoryConnection[][]>;
  getStrongestConnections(userId: number, limit?: number): Promise<MemoryConnection[]>;
}

export interface IMemoryRetrievalService {
  // Intelligent Retrieval
  getContextualMemories(context: MemoryContext, limit?: number): Promise<SemanticMemory[]>;
  getConversationRelevantMemories(userId: number, currentMessage: string, limit?: number): Promise<SemanticMemory[]>;
  getEmotionallyRelevantMemories(userId: number, emotionalState: string, limit?: number): Promise<SemanticMemory[]>;
  
  // Pattern Recognition
  findRecurringPatterns(userId: number): Promise<MemoryInsight[]>;
  identifyProgressMarkers(userId: number): Promise<SemanticMemory[]>;
  detectEmotionalTrends(userId: number): Promise<MemoryInsight[]>;
}

export interface IMemoryAnalyticsService {
  // Analytics & Insights
  generateMemoryInsights(userId: number): Promise<MemoryInsight[]>;
  analyzeMemoryGrowth(userId: number): Promise<{ totalMemories: number, growthRate: number, categories: Record<string, number> }>;
  identifyMemoryGaps(userId: number): Promise<string[]>;
  
  // Therapeutic Analysis
  assessTherapeuticProgress(userId: number): Promise<MemoryInsight[]>;
  identifyBreakthroughMoments(userId: number): Promise<SemanticMemory[]>;
  analyzeEmotionalJourney(userId: number): Promise<{ timeline: any[], insights: MemoryInsight[] }>;
}

export interface IMemoryManager {
  // Central Memory Operations
  semanticMemory: ISemanticMemoryService;
  conversationContinuity: IConversationContinuityService;
  memoryConnection: IMemoryConnectionService;
  memoryRetrieval: IMemoryRetrievalService;
  memoryAnalytics: IMemoryAnalyticsService;
  
  // High-level Operations
  processMessage(userId: number, message: string, context?: any): Promise<{
    memories: SemanticMemory[];
    insights: MemoryInsight[];
    relevantHistory: SemanticMemory[];
    sessionUpdate: ConversationSession;
  }>;
  
  getComprehensiveContext(userId: number, currentMessage?: string): Promise<{
    recentMemories: SemanticMemory[];
    relevantInsights: MemoryInsight[];
    sessionContext: ConversationSession | null;
    emotionalContext: any;
  }>;
  
  // Maintenance Operations
  consolidateMemories(userId: number): Promise<void>;
  archiveOldSessions(userId: number, olderThanDays: number): Promise<void>;
  optimizeMemoryConnections(userId: number): Promise<void>;
}