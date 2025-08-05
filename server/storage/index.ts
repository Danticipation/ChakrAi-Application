// Main storage interface - combines all modular storage services
import { UserStorage, type IUserStorage } from './userStorage.js';
import { MemoryStorage, type IMemoryStorage } from './memoryStorage.js';
import { JournalStorage, type IJournalStorage } from './journalStorage.js';
import { MoodStorage, type IMoodStorage } from './moodStorage.js';
import { CommunityStorage, type ICommunityStorage } from './communityStorage.js';
import { AnalyticsStorage, type IAnalyticsStorage } from './analyticsStorage.js';
import { GamificationStorage, type IGamificationStorage } from './gamificationStorage.js';
import { TherapeuticStorage, type ITherapeuticStorage } from './therapeuticStorage.js';
import { HealthStorage, type IHealthStorage } from './healthStorage.js';

// Re-export all storage interfaces for backward compatibility
export type { IUserStorage, IMemoryStorage, IJournalStorage, IMoodStorage, ICommunityStorage, IAnalyticsStorage, IGamificationStorage, ITherapeuticStorage, IHealthStorage };

// Unified storage interface that combines all modules
export interface IStorage extends 
  IUserStorage,
  IMemoryStorage, 
  IJournalStorage,
  IMoodStorage,
  ICommunityStorage,
  IAnalyticsStorage,
  IGamificationStorage,
  ITherapeuticStorage,
  IHealthStorage {
  
  // Additional methods not covered by specific modules
  getBotByUserId(userId: number): Promise<any>;
  createBot(data: any): Promise<any>;
  updateBot(id: number, data: any): Promise<any>;
  getMessagesByUserId(userId: number, limit?: number): Promise<any[]>;
  getUserMessages(userId: number, limit?: number): Promise<any[]>;
  createMessage(data: any): Promise<any>;
  migrateAnonymousUser(anonymousUserId: number, data: any): Promise<any>;
  createAmbientSoundPreferences(data: any): Promise<any>;
  getAmbientSoundPreferences(userId: number): Promise<any>;
  logAmbientSoundUsage(data: any): Promise<any>;
  clearUserMessages(userId: number): Promise<void>;
  
  // Conversation Continuity methods
  getActiveConversationSession(userId: number): Promise<any>;
  createConversationSession(data: any): Promise<any>;
  updateConversationSession(id: number, data: any): Promise<any>;
  getConversationSessions(userId: number): Promise<any[]>;
  createConversationThread(data: any): Promise<any>;
  getActiveThreads(sessionId: number): Promise<any[]>;
  updateConversationThread(id: number, data: any): Promise<any>;
  createSessionContinuity(data: any): Promise<any>;
  getSessionContinuity(fromSessionId: number, toSessionId: number): Promise<any>;
}

// Combined storage implementation
export class ModularStorage implements IStorage {
  private userStorage: UserStorage;
  private memoryStorage: MemoryStorage;
  private journalStorage: JournalStorage;
  private moodStorage: MoodStorage;
  private communityStorage: CommunityStorage;
  private analyticsStorage: AnalyticsStorage;
  private gamificationStorage: GamificationStorage;
  private therapeuticStorage: TherapeuticStorage;
  private healthStorage: HealthStorage;

  constructor() {
    // Initialize all storage modules
    this.userStorage = new UserStorage();
    this.memoryStorage = new MemoryStorage();
    this.journalStorage = new JournalStorage();
    this.moodStorage = new MoodStorage();
    this.communityStorage = new CommunityStorage();
    this.analyticsStorage = new AnalyticsStorage();
    this.gamificationStorage = new GamificationStorage();
    this.therapeuticStorage = new TherapeuticStorage();
    this.healthStorage = new HealthStorage();
  }

  // User methods
  async createUser(data: any): Promise<any> {
    return this.userStorage.createUser(data);
  }

  async getUserById(id: number): Promise<any> {
    return this.userStorage.getUserById(id);
  }

  async getUserByUsername(username: string): Promise<any> {
    return this.userStorage.getUserByUsername(username);
  }

  async getUserByDeviceFingerprint(fingerprint: string): Promise<any> {
    return this.userStorage.getUserByDeviceFingerprint(fingerprint);
  }

  async getUserByEmail(email: string): Promise<any> {
    return this.userStorage.getUserByEmail(email);
  }

  async createRegisteredUser(data: any): Promise<any> {
    return this.userStorage.createRegisteredUser(data);
  }

  async migrateAnonymousToRegistered(userId: number, data: any): Promise<any> {
    return this.userStorage.migrateAnonymousToRegistered(userId, data);
  }

  async updateUser(id: number, data: any): Promise<any> {
    return this.userStorage.updateUser(id, data);
  }

  async updateUserLastActive(id: number): Promise<void> {
    return this.userStorage.updateUserLastActive(id);
  }

  async deleteInactiveAnonymousUsers(beforeDate: Date): Promise<void> {
    return this.userStorage.deleteInactiveAnonymousUsers(beforeDate);
  }

  async createAuthToken(data: any): Promise<void> {
    return this.userStorage.createAuthToken(data);
  }

  async deleteAuthToken(token: string): Promise<void> {
    return this.userStorage.deleteAuthToken(token);
  }

  async cleanupExpiredTokens(): Promise<void> {
    return this.userStorage.cleanupExpiredTokens();
  }

  async createUserProfile(data: any): Promise<any> {
    return this.userStorage.createUserProfile(data);
  }

  async getUserProfile(userId: number): Promise<any> {
    return this.userStorage.getUserProfile(userId);
  }

  async updateUserProfile(userId: number, data: any): Promise<any> {
    return this.userStorage.updateUserProfile(userId, data);
  }

  async createVoluntaryQuestionAnswer(data: any): Promise<any> {
    return this.userStorage.createVoluntaryQuestionAnswer(data);
  }

  async getVoluntaryQuestionAnswers(userId: number): Promise<any[]> {
    return this.userStorage.getVoluntaryQuestionAnswers(userId);
  }

  async updateVoluntaryQuestionAnswer(userId: number, questionId: string, answer: string): Promise<any> {
    return this.userStorage.updateVoluntaryQuestionAnswer(userId, questionId, answer);
  }

  async getUserFeedback(userId: number): Promise<any[]> {
    return this.userStorage.getUserFeedback(userId);
  }

  async createFeedback(data: any): Promise<any> {
    return this.userStorage.createFeedback(data);
  }

  // Memory methods
  async getUserMemoriesByUserId(userId: number): Promise<any[]> {
    return this.memoryStorage.getUserMemoriesByUserId(userId);
  }

  async createUserMemory(data: any): Promise<any> {
    return this.memoryStorage.createUserMemory(data);
  }

  async getUserFactsByUserId(userId: number): Promise<any[]> {
    return this.memoryStorage.getUserFactsByUserId(userId);
  }

  async createUserFact(data: any): Promise<any> {
    return this.memoryStorage.createUserFact(data);
  }

  async getUserMemories(userId: number): Promise<any[]> {
    return this.memoryStorage.getUserMemories(userId);
  }

  async getUserFacts(userId: number): Promise<any[]> {
    return this.memoryStorage.getUserFacts(userId);
  }

  async clearUserMemories(userId: number): Promise<void> {
    return this.memoryStorage.clearUserMemories(userId);
  }

  // Journal methods
  async createJournalEntry(data: any): Promise<any> {
    return this.journalStorage.createJournalEntry(data);
  }

  async getJournalEntries(userId: number, limit?: number): Promise<any[]> {
    return this.journalStorage.getJournalEntries(userId, limit);
  }

  async migrateJournalEntries(currentUserId: number): Promise<number> {
    return this.journalStorage.migrateJournalEntries(currentUserId);
  }

  async createJournalAnalytics(data: any): Promise<any> {
    return this.journalStorage.createJournalAnalytics(data);
  }

  async getJournalAnalytics(userId: number, entryId?: number): Promise<any[]> {
    return this.journalStorage.getJournalAnalytics(userId, entryId);
  }

  async clearUserJournalEntries(userId: number): Promise<void> {
    return this.journalStorage.clearUserJournalEntries(userId);
  }

  // Mood methods
  async createMoodEntry(data: any): Promise<any> {
    return this.moodStorage.createMoodEntry(data);
  }

  async getMoodEntries(userId: number, limit?: number): Promise<any[]> {
    return this.moodStorage.getMoodEntries(userId, limit);
  }

  async createMoodForecast(data: any): Promise<any> {
    return this.moodStorage.createMoodForecast(data);
  }

  async getMoodForecasts(userId: number, limit?: number): Promise<any[]> {
    return this.moodStorage.getMoodForecasts(userId, limit);
  }

  async createEmotionalContext(data: any): Promise<any> {
    return this.moodStorage.createEmotionalContext(data);
  }

  async getEmotionalContexts(userId: number, limit?: number): Promise<any[]> {
    return this.moodStorage.getEmotionalContexts(userId, limit);
  }

  async clearUserMoodEntries(userId: number): Promise<void> {
    return this.moodStorage.clearUserMoodEntries(userId);
  }

  // Community methods
  async getSupportForums(): Promise<any[]> {
    return this.communityStorage.getSupportForums();
  }

  async getForumPosts(forumId: number): Promise<any[]> {
    return this.communityStorage.getForumPosts(forumId);
  }

  async createForumPost(data: any): Promise<any> {
    return this.communityStorage.createForumPost(data);
  }

  // Analytics methods
  async calculateWellnessScore(userId: number): Promise<number> {
    return this.analyticsStorage.calculateWellnessScore(userId);
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    return this.analyticsStorage.getUserAchievements(userId);
  }

  async getWellnessStreaks(userId: number): Promise<any[]> {
    return this.analyticsStorage.getWellnessStreaks(userId);
  }

  async createUserAchievement(data: any): Promise<any> {
    return this.analyticsStorage.createUserAchievement(data);
  }

  async updateWellnessStreak(streakId: number, updates: any): Promise<void> {
    return this.analyticsStorage.updateWellnessStreak(streakId, updates);
  }

  async clearUserAnalytics(userId: number): Promise<void> {
    return this.analyticsStorage.clearUserAnalytics(userId);
  }

  // Gamification methods
  async getDailyCheckinCount(userId: number): Promise<number> {
    return this.gamificationStorage.getDailyCheckinCount(userId);
  }

  async getJournalEntryCount(userId: number): Promise<number> {
    return this.gamificationStorage.getJournalEntryCount(userId);
  }

  async getMoodEntryCount(userId: number): Promise<number> {
    return this.gamificationStorage.getMoodEntryCount(userId);
  }

  async getChatSessionCount(userId: number): Promise<number> {
    return this.gamificationStorage.getChatSessionCount(userId);
  }

  async getGoalProgressCount(userId: number): Promise<number> {
    return this.gamificationStorage.getGoalProgressCount(userId);
  }

  async getDailyActivitiesHistory(userId: number, days?: number): Promise<any[]> {
    return this.gamificationStorage.getDailyActivitiesHistory(userId, days);
  }

  async getUserWellnessPoints(userId: number): Promise<any> {
    return this.gamificationStorage.getUserWellnessPoints(userId);
  }

  async createUserWellnessPoints(data: any): Promise<any> {
    return this.gamificationStorage.createUserWellnessPoints(data);
  }

  async awardWellnessPoints(userId: number, points: number, activity: string, description: string): Promise<void> {
    return this.gamificationStorage.awardWellnessPoints(userId, points, activity, description);
  }

  async getPointsTransactions(userId: number, limit?: number): Promise<any[]> {
    return this.gamificationStorage.getPointsTransactions(userId, limit);
  }

  async levelUpUser(userId: number): Promise<void> {
    return this.gamificationStorage.levelUpUser(userId);
  }

  async getAllAchievements(): Promise<any[]> {
    return this.gamificationStorage.getAllAchievements();
  }

  async checkAndUnlockAchievements(userId: number, activity: string, metadata: any): Promise<any[]> {
    return this.gamificationStorage.checkAndUnlockAchievements(userId, activity, metadata);
  }

  // Therapeutic methods
  async createTherapeuticGoal(data: any): Promise<any> {
    return this.therapeuticStorage.createTherapeuticGoal(data);
  }

  async getTherapeuticGoals(userId: number): Promise<any[]> {
    return this.therapeuticStorage.getTherapeuticGoals(userId);
  }

  async updateGoalProgress(goalId: number, currentValue: number): Promise<any> {
    return this.therapeuticStorage.updateGoalProgress(goalId, currentValue);
  }

  async clearUserGoals(userId: number): Promise<void> {
    return this.therapeuticStorage.clearUserGoals(userId);
  }

  // Health methods
  async createRiskAssessment(data: any): Promise<any> {
    return this.healthStorage.createRiskAssessment(data);
  }

  async getRiskAssessments(userId: number, limit?: number): Promise<any[]> {
    return this.healthStorage.getRiskAssessments(userId, limit);
  }

  async getLatestRiskAssessment(userId: number): Promise<any> {
    return this.healthStorage.getLatestRiskAssessment(userId);
  }

  async createCrisisDetectionLog(data: any): Promise<any> {
    return this.healthStorage.createCrisisDetectionLog(data);
  }

  async getCrisisDetectionLogs(userId: number, limit?: number): Promise<any[]> {
    return this.healthStorage.getCrisisDetectionLogs(userId, limit);
  }

  async createLongitudinalTrend(data: any): Promise<any> {
    return this.healthStorage.createLongitudinalTrend(data);
  }

  async getLongitudinalTrends(userId: number, trendType?: string, timeframe?: string): Promise<any[]> {
    return this.healthStorage.getLongitudinalTrends(userId, trendType, timeframe);
  }

  async calculateUserWellnessMetrics(userId: number): Promise<any> {
    return this.healthStorage.calculateUserWellnessMetrics(userId);
  }

  async calculateEmotionalVolatility(userId: number, days?: number): Promise<number> {
    return this.healthStorage.calculateEmotionalVolatility(userId, days);
  }

  async calculateTherapeuticEngagement(userId: number, days?: number): Promise<number> {
    return this.healthStorage.calculateTherapeuticEngagement(userId, days);
  }

  async generateWellnessInsights(userId: number): Promise<string> {
    return this.healthStorage.generateWellnessInsights(userId);
  }

  async getHealthCorrelations(userId: number): Promise<any[]> {
    return this.healthStorage.getHealthCorrelations(userId);
  }

  async createHealthCorrelation(data: any): Promise<any> {
    return this.healthStorage.createHealthCorrelation(data);
  }

  async getHealthMetrics(userId: number, period?: string, limit?: number): Promise<any[]> {
    return this.healthStorage.getHealthMetrics(userId, period, limit);
  }

  // Placeholder methods for missing functionality (to be moved to appropriate modules later)
  async getBotByUserId(userId: number): Promise<any> {
    return null; // Placeholder
  }

  async createBot(data: any): Promise<any> {
    return data; // Placeholder
  }

  async updateBot(id: number, data: any): Promise<any> {
    return data; // Placeholder
  }

  async getMessagesByUserId(userId: number, limit?: number): Promise<any[]> {
    return []; // Placeholder
  }

  async createMessage(data: any): Promise<any> {
    return data; // Placeholder
  }

  async migrateAnonymousUser(anonymousUserId: number, data: any): Promise<any> {
    return this.migrateAnonymousToRegistered(anonymousUserId, data);
  }

  async createAmbientSoundPreferences(data: any): Promise<any> {
    return data; // Placeholder
  }

  async getAmbientSoundPreferences(userId: number): Promise<any> {
    return {}; // Placeholder
  }

  async logAmbientSoundUsage(data: any): Promise<any> {
    return data; // Placeholder
  }

  async clearUserMessages(userId: number): Promise<void> {
    // Placeholder
  }

  async getUserMessages(userId: number, limit: number = 50): Promise<any[]> {
    // Alias for getMessagesByUserId for backward compatibility
    return this.getMessagesByUserId(userId, limit);
  }

  // Conversation Continuity methods - implement as stubs for now to fix chat
  async getActiveConversationSession(userId: number): Promise<any> {
    // Return null to force creation of new session
    return null;
  }

  async createConversationSession(data: any): Promise<any> {
    // Create a basic session object
    return {
      id: Date.now(),
      userId: data.userId,
      sessionKey: data.sessionKey,
      title: data.title || "New Conversation",
      keyTopics: data.keyTopics || [],
      emotionalTone: data.emotionalTone || "neutral",
      unresolvedThreads: data.unresolvedThreads || {},
      contextCarryover: data.contextCarryover || {},
      messageCount: data.messageCount || 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };
  }

  async updateConversationSession(id: number, data: any): Promise<any> {
    // Return updated session
    return {
      id,
      ...data,
      updatedAt: new Date()
    };
  }

  async getConversationSessions(userId: number): Promise<any[]> {
    // Return empty array for now
    return [];
  }

  async createConversationThread(data: any): Promise<any> {
    return {
      id: Date.now(),
      ...data,
      createdAt: new Date()
    };
  }

  async getActiveThreads(sessionId: number): Promise<any[]> {
    return [];
  }

  async updateConversationThread(id: number, data: any): Promise<any> {
    return {
      id,
      ...data,
      updatedAt: new Date()
    };
  }

  async createSessionContinuity(data: any): Promise<any> {
    return {
      id: Date.now(),
      ...data,
      createdAt: new Date()
    };
  }

  async getSessionContinuity(fromSessionId: number, toSessionId: number): Promise<any> {
    return null;
  }

  // Missing semantic memory methods - implement as stubs  
  async getRecentSemanticMemories(userId: number, limit?: number): Promise<any[]> {
    return [];
  }

  async searchSemanticMemories(userId: number, query: string, limit?: number): Promise<any[]> {
    return [];
  }

  async getMemoryInsights(userId: number): Promise<any[]> {
    return [];
  }

  async createConversationSummary(data: any): Promise<any> {
    return { id: Date.now(), ...data };
  }

  async getUnaddressedContinuity(userId: number): Promise<any[]> {
    return [];
  }

  async getAllUserMemoryConnections(userId: number): Promise<any[]> {
    return [];
  }

  async getConversationSessionHistory(sessionId: number, limit?: number): Promise<any[]> {
    // Return empty array for now
    return [];
  }
}

// Export singleton instance for backward compatibility
export const storage = new ModularStorage();