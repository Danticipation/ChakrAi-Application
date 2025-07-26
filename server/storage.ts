import { db } from "./db";
import { 
  users, userProfiles, bots, messages, userMemories, userFacts,
  journalEntries, moodEntries, therapeuticGoals, supportForums, forumPosts,
  userAchievements, wellnessStreaks, emotionalPatterns,
  moodForecasts, emotionalContexts, predictiveInsights, emotionalResponseAdaptations, crisisDetectionLogs,
  monthlyWellnessReports, analyticsMetrics, progressTracking, riskAssessments, longitudinalTrends,
  userWellnessPoints, pointsTransactions, rewardsShop, userPurchases, achievements,
  dailyActivities, communityChallenges, userChallengeProgress, userLevels, userStreaks,
  conversationSummaries, semanticMemories, memoryConnections, memoryInsights,
  therapists, clientTherapistRelationships, clientPrivacySettings, therapistSessionNotes, riskAlerts,
  vrEnvironments, vrSessions, vrProgressTracking, vrTherapeuticPlans, vrAccessibilityProfiles,
  voluntaryQuestions, userFeedback, authTokens,
  type User, type InsertUser,
  type UserProfile, type InsertUserProfile,
  type VoluntaryQuestion, type InsertVoluntaryQuestion,
  type Bot, type InsertBot,
  type Message, type InsertMessage,
  type UserMemory, type InsertUserMemory,
  type UserFact, type InsertUserFact,
  type JournalEntry, type InsertJournalEntry,
  type MoodEntry, type InsertMoodEntry,
  type TherapeuticGoal, type InsertTherapeuticGoal,
  type SupportForum, type InsertSupportForum,
  type ForumPost, type InsertForumPost,
  type UserAchievement, type InsertUserAchievement,
  type WellnessStreak, type InsertWellnessStreak,
  type EmotionalPattern, type InsertEmotionalPattern,
  type MoodForecast, type InsertMoodForecast,
  type EmotionalContext, type InsertEmotionalContext,
  type PredictiveInsight, type InsertPredictiveInsight,
  type EmotionalResponseAdaptation, type InsertEmotionalResponseAdaptation,
  type CrisisDetectionLog, type InsertCrisisDetectionLog,
  type MonthlyWellnessReport, type InsertMonthlyWellnessReport,
  type AnalyticsMetric, type InsertAnalyticsMetric,
  type ProgressTracking, type InsertProgressTracking,
  type RiskAssessment, type InsertRiskAssessment,
  type LongitudinalTrend, type InsertLongitudinalTrend,
  type ConversationSummary, type InsertConversationSummary,
  type SemanticMemory, type InsertSemanticMemory,
  type MemoryConnection, type InsertMemoryConnection,
  type MemoryInsight, type InsertMemoryInsight,
  type Therapist, type InsertTherapist,
  type ClientTherapistRelationship, type InsertClientTherapistRelationship,
  type ClientPrivacySettings, type InsertClientPrivacySettings,
  type TherapistSessionNotes, type InsertTherapistSessionNotes,
  type RiskAlert, type InsertRiskAlert,
  type VrEnvironment, type InsertVrEnvironment,
  type VrSession, type InsertVrSession,
  type VrProgressTracking, type InsertVrProgressTracking,
  type VrTherapeuticPlan, type InsertVrTherapeuticPlan,
  type VrAccessibilityProfile, type InsertVrAccessibilityProfile,
  type UserStreak, type InsertUserStreak,
  type DailyActivity, type InsertDailyActivity,
  type UserFeedback, type InsertUserFeedback,
} from "@shared/schema";
import { eq, desc, and, lt, ne, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  createUser(data: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByDeviceFingerprint(fingerprint: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createRegisteredUser(data: Partial<InsertUser> & { username: string }): Promise<User>;
  migrateAnonymousToRegistered(userId: number, data: Partial<InsertUser>): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  updateUserLastActive(id: number): Promise<void>;
  deleteInactiveAnonymousUsers(beforeDate: Date): Promise<void>;
  
  // Authentication tokens
  createAuthToken(data: { userId: number; token: string; expiresAt: Date; deviceInfo?: string }): Promise<void>;
  deleteAuthToken(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  
  // User Profiles
  createUserProfile(data: InsertUserProfile): Promise<UserProfile>;
  getUserProfile(userId: number): Promise<UserProfile | null>;
  updateUserProfile(userId: number, data: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Voluntary Questions
  createVoluntaryQuestionAnswer(data: InsertVoluntaryQuestion): Promise<VoluntaryQuestion>;
  getVoluntaryQuestionAnswers(userId: number): Promise<VoluntaryQuestion[]>;
  updateVoluntaryQuestionAnswer(userId: number, questionId: string, answer: string): Promise<VoluntaryQuestion>;
  
  // Feedback System
  getUserFeedback(userId: number): Promise<UserFeedback[]>;
  createFeedback(data: InsertUserFeedback): Promise<UserFeedback>;
  
  // Ambient Sound System
  createAmbientSoundPreferences(data: any): Promise<any>;
  getAmbientSoundPreferences(userId: number): Promise<any>;
  logAmbientSoundUsage(data: any): Promise<any>;
  
  // Data clearing methods for fresh starts
  clearUserMessages(userId: number): Promise<void>;
  clearUserJournalEntries(userId: number): Promise<void>;
  clearUserMoodEntries(userId: number): Promise<void>;
  clearUserMemories(userId: number): Promise<void>;
  clearUserGoals(userId: number): Promise<void>;
  clearUserAchievements(userId: number): Promise<void>;
  clearUserAnalytics(userId: number): Promise<void>;
  
  // Bots
  getBotByUserId(userId: number): Promise<Bot | null>;
  createBot(data: InsertBot): Promise<Bot>;
  updateBot(id: number, data: Partial<InsertBot>): Promise<Bot>;
  
  // Messages
  getMessagesByUserId(userId: number, limit?: number): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  

  

  
  // User memories and facts
  getUserMemoriesByUserId(userId: number): Promise<UserMemory[]>;
  createUserMemory(data: InsertUserMemory): Promise<UserMemory>;
  getUserFactsByUserId(userId: number): Promise<UserFact[]>;
  createUserFact(data: InsertUserFact): Promise<UserFact>;
  
  // Personality mirroring methods
  getUserMemories(userId: number): Promise<UserMemory[]>;
  getUserFacts(userId: number): Promise<UserFact[]>;
  
  // Journal Entries
  createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntries(userId: number, limit?: number): Promise<JournalEntry[]>;
  migrateJournalEntries(currentUserId: number): Promise<number>;
  
  // Mood Entries
  createMoodEntry(data: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntries(userId: number, limit?: number): Promise<MoodEntry[]>;
  
  // Therapeutic Goals
  createTherapeuticGoal(data: InsertTherapeuticGoal): Promise<TherapeuticGoal>;
  getTherapeuticGoals(userId: number): Promise<TherapeuticGoal[]>;
  updateGoalProgress(goalId: number, currentValue: number): Promise<TherapeuticGoal>;
  
  // Community
  getSupportForums(): Promise<SupportForum[]>;
  getForumPosts(forumId: number): Promise<ForumPost[]>;
  createForumPost(data: InsertForumPost): Promise<ForumPost>;
  
  // Analytics
  calculateWellnessScore(userId: number): Promise<number>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  getWellnessStreaks(userId: number): Promise<WellnessStreak[]>;
  createUserAchievement(data: InsertUserAchievement): Promise<UserAchievement>;
  updateWellnessStreak(userId: number, streakType: string): Promise<WellnessStreak>;
  
  // Advanced Emotional Intelligence
  createEmotionalContext(data: InsertEmotionalContext): Promise<EmotionalContext>;
  createMoodForecast(data: InsertMoodForecast): Promise<MoodForecast>;
  createPredictiveInsight(data: InsertPredictiveInsight): Promise<PredictiveInsight>;
  createEmotionalResponseAdaptation(data: InsertEmotionalResponseAdaptation): Promise<EmotionalResponseAdaptation>;
  createCrisisDetectionLog(data: InsertCrisisDetectionLog): Promise<CrisisDetectionLog>;
  getMoodForecasts(userId: number, limit?: number): Promise<MoodForecast[]>;
  getPredictiveInsights(userId: number, limit?: number): Promise<PredictiveInsight[]>;
  getEmotionalResponseAdaptations(userId: number, limit?: number): Promise<EmotionalResponseAdaptation[]>;
  getCrisisDetectionLogs(userId: number, limit?: number): Promise<CrisisDetectionLog[]>;
  getEmotionalContexts(userId: number, limit?: number): Promise<EmotionalContext[]>;
  
  // Comprehensive Analytics & Reporting
  createMonthlyWellnessReport(data: InsertMonthlyWellnessReport): Promise<MonthlyWellnessReport>;
  getMonthlyWellnessReports(userId: number, limit?: number): Promise<MonthlyWellnessReport[]>;
  getMonthlyWellnessReport(userId: number, reportMonth: string): Promise<MonthlyWellnessReport | null>;
  
  createAnalyticsMetric(data: InsertAnalyticsMetric): Promise<AnalyticsMetric>;
  getAnalyticsMetrics(userId: number, metricType?: string, limit?: number): Promise<AnalyticsMetric[]>;
  
  createProgressTracking(data: InsertProgressTracking): Promise<ProgressTracking>;
  getProgressTracking(userId: number, period?: string, limit?: number): Promise<ProgressTracking[]>;
  
  createRiskAssessment(data: InsertRiskAssessment): Promise<RiskAssessment>;
  getRiskAssessments(userId: number, limit?: number): Promise<RiskAssessment[]>;
  getLatestRiskAssessment(userId: number): Promise<RiskAssessment | null>;
  
  createLongitudinalTrend(data: InsertLongitudinalTrend): Promise<LongitudinalTrend>;
  getLongitudinalTrends(userId: number, trendType?: string, timeframe?: string): Promise<LongitudinalTrend[]>;
  
  // Analytics calculation methods
  calculateUserWellnessMetrics(userId: number): Promise<any>;
  calculateEmotionalVolatility(userId: number, days?: number): Promise<number>;
  calculateTherapeuticEngagement(userId: number, days?: number): Promise<number>;
  generateWellnessInsights(userId: number): Promise<string>;
  getHealthCorrelations(userId: number): Promise<any[]>;

  // Enhanced Gamification & Rewards System
  getUserWellnessPoints(userId: number): Promise<any>;
  createUserWellnessPoints(data: any): Promise<any>;
  awardWellnessPoints(userId: number, points: number, activity: string, description: string): Promise<void>;
  getPointsTransactions(userId: number, limit?: number): Promise<any[]>;
  levelUpUser(userId: number): Promise<void>;
  
  getAllAchievements(): Promise<any[]>;
  checkAndUnlockAchievements(userId: number, activity: string, metadata: any): Promise<any[]>;
  
  getAvailableRewards(): Promise<any[]>;
  getUserPurchases(userId: number): Promise<any[]>;
  getRewardById(rewardId: number): Promise<any>;
  purchaseReward(userId: number, rewardId: number, cost: number): Promise<void>;
  
  getUserStreaks(userId: number): Promise<any[]>;
  updateStreak(userId: number, streakType: string): Promise<any>;
  
  getActiveCommunityChallenes(): Promise<any[]>;
  getUserChallengeProgress(userId: number): Promise<any[]>;
  joinCommunityChallenge(userId: number, challengeId: number): Promise<void>;
  updateChallengeProgress(userId: number, challengeId: number, progressIncrement: number): Promise<any>;
  
  getTodayActivity(userId: number): Promise<any>;
  
  // Semantic Memory System
  createConversationSummary(data: InsertConversationSummary): Promise<ConversationSummary>;
  getConversationSummary(userId: number, sessionId: string): Promise<ConversationSummary | null>;
  updateConversationSummary(id: number, data: Partial<InsertConversationSummary>): Promise<ConversationSummary>;
  
  createSemanticMemory(data: InsertSemanticMemory): Promise<SemanticMemory>;
  getRecentSemanticMemories(userId: number, limit?: number): Promise<SemanticMemory[]>;
  searchSemanticMemories(userId: number, searchTerms: string[], limit?: number): Promise<SemanticMemory[]>;
  updateMemoryAccessCount(memoryId: number): Promise<void>;
  
  createMemoryConnection(data: InsertMemoryConnection): Promise<MemoryConnection>;
  getMemoryConnections(memoryId: number): Promise<MemoryConnection[]>;
  getAllUserMemoryConnections(userId: number): Promise<MemoryConnection[]>;
  
  createMemoryInsight(data: InsertMemoryInsight): Promise<MemoryInsight>;
  getMemoryInsights(userId: number): Promise<MemoryInsight[]>;

  // Therapist Portal System - New Feature Addition
  createTherapist(data: InsertTherapist): Promise<Therapist>;
  getTherapistById(id: number): Promise<Therapist | null>;
  getTherapistByEmail(email: string): Promise<Therapist | null>;
  updateTherapist(id: number, data: Partial<InsertTherapist>): Promise<Therapist>;
  
  createClientTherapistRelationship(data: InsertClientTherapistRelationship): Promise<ClientTherapistRelationship>;
  getClientTherapistRelationships(therapistId: number): Promise<ClientTherapistRelationship[]>;
  getTherapistForClient(clientUserId: number): Promise<ClientTherapistRelationship | null>;
  updateRelationshipStatus(id: number, status: string): Promise<ClientTherapistRelationship>;
  
  getClientPrivacySettings(clientUserId: number, therapistId: number): Promise<ClientPrivacySettings | null>;
  updateClientPrivacySettings(data: InsertClientPrivacySettings): Promise<ClientPrivacySettings>;
  
  createTherapistSessionNote(data: InsertTherapistSessionNotes): Promise<TherapistSessionNotes>;
  getTherapistSessionNotes(therapistId: number, clientUserId?: number): Promise<TherapistSessionNotes[]>;
  
  createRiskAlert(data: InsertRiskAlert): Promise<RiskAlert>;
  getRiskAlerts(therapistId: number, clientUserId?: number, acknowledged?: boolean): Promise<RiskAlert[]>;
  acknowledgeRiskAlert(id: number): Promise<RiskAlert>;
  
  getClientDashboardData(therapistId: number, clientUserId: number): Promise<any>;
  generateRiskAlerts(clientUserId: number): Promise<void>;

  // Streak Tracking System
  createUserStreak(data: InsertUserStreak): Promise<UserStreak>;
  updateUserStreak(userId: number, streakType: string, updates: Partial<InsertUserStreak>): Promise<void>;
  getUserStreaks(userId: number): Promise<UserStreak[]>;
  getUserStreak(userId: number, streakType: string): Promise<UserStreak | null>;
  
  recordDailyActivity(data: InsertDailyActivity): Promise<DailyActivity>;
  getDailyActivities(userId: number, days?: number): Promise<DailyActivity[]>;
  hasActivityToday(userId: number, activityType: string): Promise<boolean>;
  
  calculateStreak(userId: number, streakType: string): Promise<number>;
  updateStreakOnActivity(userId: number, activityType: string): Promise<void>;
  
  // VR/AR Therapeutic Experiences methods
  getVrEnvironments(category?: string): Promise<VrEnvironment[]>;
  getVrEnvironment(id: number): Promise<VrEnvironment | null>;
  createVrEnvironment(environment: InsertVrEnvironment): Promise<VrEnvironment>;
  updateVrEnvironment(id: number, updates: Partial<InsertVrEnvironment>): Promise<VrEnvironment>;
  
  getUserVrSessions(userId: number, limit?: number): Promise<VrSession[]>;
  getVrSession(id: number): Promise<VrSession | null>;
  createVrSession(session: InsertVrSession): Promise<VrSession>;
  updateVrSession(id: number, updates: Partial<InsertVrSession>): Promise<VrSession>;
  
  getUserVrProgress(userId: number, environmentId?: number): Promise<VrProgressTracking[]>;
  getVrProgress(userId: number, environmentId: number): Promise<VrProgressTracking | null>;
  createVrProgress(progress: InsertVrProgressTracking): Promise<VrProgressTracking>;
  updateVrProgress(userId: number, environmentId: number, updates: Partial<InsertVrProgressTracking>): Promise<VrProgressTracking>;
  
  getUserVrTherapeuticPlans(userId: number): Promise<VrTherapeuticPlan[]>;
  getVrTherapeuticPlan(id: number): Promise<VrTherapeuticPlan | null>;
  createVrTherapeuticPlan(plan: InsertVrTherapeuticPlan): Promise<VrTherapeuticPlan>;
  updateVrTherapeuticPlan(id: number, updates: Partial<InsertVrTherapeuticPlan>): Promise<VrTherapeuticPlan>;
  
  getUserVrAccessibilityProfile(userId: number): Promise<VrAccessibilityProfile | null>;
  createVrAccessibilityProfile(profile: InsertVrAccessibilityProfile): Promise<VrAccessibilityProfile>;
  updateVrAccessibilityProfile(userId: number, updates: Partial<InsertVrAccessibilityProfile>): Promise<VrAccessibilityProfile>;
}

export class DbStorage implements IStorage {
  private db: typeof db;
  
  constructor() {
    this.db = db;
  }

  // Users
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [user] = await this.db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getUserByDeviceFingerprint(fingerprint: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.deviceFingerprint, fingerprint));
    return user || null;
  }

  async updateUserLastActive(id: number): Promise<void> {
    await this.db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, id));
  }

  async deleteInactiveAnonymousUsers(beforeDate: Date): Promise<void> {
    await this.db.delete(users).where(
      and(
        eq(users.isAnonymous, true),
        lt(users.lastActiveAt, beforeDate)
      )
    );
  }

  // Bots
  async getBotByUserId(userId: number): Promise<Bot | null> {
    const [bot] = await this.db.select().from(bots).where(eq(bots.userId, userId));
    return bot || null;
  }

  async createBot(data: InsertBot): Promise<Bot> {
    const [bot] = await this.db.insert(bots).values(data).returning();
    return bot;
  }

  async updateBot(id: number, data: Partial<InsertBot>): Promise<Bot> {
    const [bot] = await this.db.update(bots).set(data).where(eq(bots.id, id)).returning();
    return bot;
  }

  // User Profiles
  async createUserProfile(data: InsertUserProfile): Promise<UserProfile> {
    const [profile] = await this.db.insert(userProfiles).values(data).returning();
    return profile;
  }

  async getUserProfile(userId: number): Promise<UserProfile | null> {
    const profiles = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profiles[0] || null;
  }

  async updateUserProfile(userId: number, data: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [profile] = await this.db.update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return profile;
  }

  // Voluntary Questions
  async createVoluntaryQuestionAnswer(data: InsertVoluntaryQuestion): Promise<VoluntaryQuestion> {
    // Check if answer already exists, update if so
    const existing = await this.db.select()
      .from(voluntaryQuestions)
      .where(and(
        eq(voluntaryQuestions.userId, data.userId),
        eq(voluntaryQuestions.questionId, data.questionId)
      ));

    if (existing.length > 0) {
      const [updated] = await this.db.update(voluntaryQuestions)
        .set({ 
          answer: data.answer,
          answeredAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(voluntaryQuestions.userId, data.userId),
          eq(voluntaryQuestions.questionId, data.questionId)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await this.db.insert(voluntaryQuestions).values(data).returning();
      return created;
    }
  }

  async getVoluntaryQuestionAnswers(userId: number): Promise<VoluntaryQuestion[]> {
    return await this.db.select()
      .from(voluntaryQuestions)
      .where(eq(voluntaryQuestions.userId, userId))
      .orderBy(voluntaryQuestions.answeredAt);
  }

  async updateVoluntaryQuestionAnswer(userId: number, questionId: string, answer: string): Promise<VoluntaryQuestion> {
    const [updated] = await this.db.update(voluntaryQuestions)
      .set({ 
        answer,
        answeredAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(voluntaryQuestions.userId, userId),
        eq(voluntaryQuestions.questionId, questionId)
      ))
      .returning();
    return updated;
  }

  // Feedback System
  async getUserFeedback(userId: number): Promise<UserFeedback[]> {
    return await this.db.select()
      .from(userFeedback)
      .where(eq(userFeedback.userId, userId))
      .orderBy(desc(userFeedback.createdAt));
  }

  async createFeedback(data: InsertUserFeedback): Promise<UserFeedback> {
    const [feedback] = await this.db.insert(userFeedback).values(data).returning();
    return feedback;
  }

  // Authentication methods
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async getUserByCustomerId(customerId: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.customerId, customerId)).limit(1);
    return result[0] || null;
  }

  async createRegisteredUser(data: Partial<InsertUser> & { username: string }): Promise<User> {
    const userData = {
      ...data,
      isAnonymous: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };
    
    const [user] = await this.db.insert(users).values(userData).returning();
    return user;
  }

  async migrateAnonymousToRegistered(userId: number, data: Partial<InsertUser>): Promise<User> {
    const updateData = {
      ...data,
      isAnonymous: false,
      updatedAt: new Date()
    };
    
    const [user] = await this.db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createAuthToken(data: { userId: number; token: string; expiresAt: Date; deviceInfo?: string }): Promise<void> {
    await this.db.insert(authTokens).values(data);
  }

  async deleteAuthToken(token: string): Promise<void> {
    await this.db.delete(authTokens).where(eq(authTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.db.delete(authTokens).where(lt(authTokens.expiresAt, new Date()));
  }

  // Messages
  async getMessagesByUserId(userId: number, limit: number = 50): Promise<Message[]> {
    console.log(`Fetching messages for userId: ${userId} with limit: ${limit}`);
    const result = await this.db.select().from(messages).where(eq(messages.userId, userId)).orderBy(messages.timestamp).limit(limit);
    console.log(`Found ${result.length} messages for user ${userId}`);
    return result;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const messageData = {
      userId: data.userId,
      text: data.content || '', // Use text field which is required by database schema
      content: data.content || '', // Also set content for compatibility
      isBot: data.isBot || false,
      timestamp: new Date()
    };
    
    try {
      console.log('Attempting to save message:', messageData);
      const [message] = await this.db.insert(messages).values(messageData).returning();
      console.log('Message saved successfully:', message.id);
      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }





  // User memories and facts
  async getUserMemoriesByUserId(userId: number): Promise<UserMemory[]> {
    return await this.db.select().from(userMemories).where(eq(userMemories.userId, userId)).orderBy(desc(userMemories.createdAt));
  }

  async createUserMemory(data: InsertUserMemory): Promise<UserMemory> {
    const [memory] = await this.db.insert(userMemories).values(data).returning();
    return memory;
  }

  async getUserFactsByUserId(userId: number): Promise<UserFact[]> {
    return await this.db.select().from(userFacts).where(eq(userFacts.userId, userId)).orderBy(desc(userFacts.createdAt));
  }

  async createUserFact(data: InsertUserFact): Promise<UserFact> {
    const [fact] = await this.db.insert(userFacts).values(data).returning();
    return fact;
  }
  
  // Journal Entries
  async createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await this.db.insert(journalEntries).values(data).returning();
    return entry;
  }
  
  async getJournalEntries(userId: number, limit?: number): Promise<JournalEntry[]> {
    if (limit) {
      return await this.db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt)).limit(limit);
    } else {
      return await this.db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt));
    }
  }

  // Migrate all journal entries from other users to current user
  async migrateJournalEntries(currentUserId: number): Promise<number> {
    // Update all journal entries to belong to the current user
    const result = await this.db.update(journalEntries)
      .set({ userId: currentUserId })
      .where(ne(journalEntries.userId, currentUserId))
      .returning();
    
    return result.length;
  }
  
  // Mood Entries
  async createMoodEntry(data: InsertMoodEntry): Promise<MoodEntry> {
    const [entry] = await this.db.insert(moodEntries).values(data).returning();
    return entry;
  }
  
  async getMoodEntries(userId: number, limit?: number): Promise<MoodEntry[]> {
    if (limit) {
      return await this.db.select().from(moodEntries).where(eq(moodEntries.userId, userId)).orderBy(desc(moodEntries.createdAt)).limit(limit);
    } else {
      return await this.db.select().from(moodEntries).where(eq(moodEntries.userId, userId)).orderBy(desc(moodEntries.createdAt));
    }
  }
  
  // Therapeutic Goals
  async createTherapeuticGoal(data: InsertTherapeuticGoal): Promise<TherapeuticGoal> {
    const [goal] = await this.db.insert(therapeuticGoals).values(data).returning();
    return goal;
  }
  
  async getTherapeuticGoals(userId: number): Promise<TherapeuticGoal[]> {
    return await this.db.select().from(therapeuticGoals).where(eq(therapeuticGoals.userId, userId)).orderBy(desc(therapeuticGoals.createdAt));
  }
  
  async updateGoalProgress(goalId: number, currentValue: number): Promise<TherapeuticGoal> {
    const [goal] = await this.db.update(therapeuticGoals)
      .set({ currentValue })
      .where(eq(therapeuticGoals.id, goalId))
      .returning();
    return goal;
  }
  
  // Community
  async getSupportForums(): Promise<SupportForum[]> {
    return await this.db.select().from(supportForums).where(eq(supportForums.isActive, true));
  }
  
  async getForumPosts(forumId: number): Promise<ForumPost[]> {
    return await this.db.select().from(forumPosts).where(eq(forumPosts.forumId, forumId)).orderBy(desc(forumPosts.createdAt));
  }
  
  async createForumPost(data: InsertForumPost): Promise<ForumPost> {
    const [post] = await this.db.insert(forumPosts).values(data).returning();
    return post;
  }
  
  // Analytics
  async calculateWellnessScore(userId: number): Promise<number> {
    // Calculate based on recent activity
    const recentMoods = await this.db.select().from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(10);
    
    if (recentMoods.length === 0) return 50; // Default neutral score
    
    const avgMood = recentMoods.reduce((sum, entry) => sum + entry.intensity, 0) / recentMoods.length;
    return Math.round((avgMood / 10) * 100); // Convert to percentage
  }
  
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await this.db.select().from(userAchievements).where(eq(userAchievements.userId, userId)).orderBy(desc(userAchievements.unlockedAt));
  }
  
  async getWellnessStreaks(userId: number): Promise<WellnessStreak[]> {
    return await this.db.select().from(wellnessStreaks).where(eq(wellnessStreaks.userId, userId));
  }

  async createUserAchievement(data: InsertUserAchievement): Promise<UserAchievement> {
    const [achievement] = await this.db.insert(userAchievements).values(data).returning();
    return achievement;
  }

  async updateWellnessStreak(userId: number, streakType: string): Promise<WellnessStreak> {
    const [existing] = await this.db.select().from(wellnessStreaks)
      .where(and(eq(wellnessStreaks.userId, userId), eq(wellnessStreaks.streakType, streakType)));
    
    if (existing) {
      const currentStreak = existing.currentStreak || 0;
      const longestStreak = existing.longestStreak || 0;
      const [updated] = await this.db.update(wellnessStreaks)
        .set({ 
          currentStreak: currentStreak + 1,
          longestStreak: Math.max(longestStreak, currentStreak + 1),
          lastActivityDate: new Date()
        })
        .where(eq(wellnessStreaks.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await this.db.insert(wellnessStreaks).values({
        userId,
        streakType,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date()
      }).returning();
      return created;
    }
  }

  // Advanced Emotional Intelligence Storage Methods
  
  async createEmotionalContext(data: InsertEmotionalContext): Promise<EmotionalContext> {
    const [created] = await this.db.insert(emotionalContexts).values(data).returning();
    return created;
  }

  async createMoodForecast(data: InsertMoodForecast): Promise<MoodForecast> {
    const [created] = await this.db.insert(moodForecasts).values(data).returning();
    return created;
  }

  async createPredictiveInsight(data: InsertPredictiveInsight): Promise<PredictiveInsight> {
    const [created] = await this.db.insert(predictiveInsights).values(data).returning();
    return created;
  }

  async createEmotionalResponseAdaptation(data: InsertEmotionalResponseAdaptation): Promise<EmotionalResponseAdaptation> {
    const [created] = await this.db.insert(emotionalResponseAdaptations).values(data).returning();
    return created;
  }

  async createCrisisDetectionLog(data: InsertCrisisDetectionLog): Promise<CrisisDetectionLog> {
    const [created] = await this.db.insert(crisisDetectionLogs).values(data).returning();
    return created;
  }

  async getMoodForecasts(userId: number, limit: number = 10): Promise<MoodForecast[]> {
    return await this.db.select().from(moodForecasts)
      .where(eq(moodForecasts.userId, userId))
      .orderBy(desc(moodForecasts.createdAt))
      .limit(limit);
  }

  async getPredictiveInsights(userId: number, limit: number = 10): Promise<PredictiveInsight[]> {
    return await this.db.select().from(predictiveInsights)
      .where(eq(predictiveInsights.userId, userId))
      .orderBy(desc(predictiveInsights.createdAt))
      .limit(limit);
  }

  async getEmotionalResponseAdaptations(userId: number, limit: number = 10): Promise<EmotionalResponseAdaptation[]> {
    return await this.db.select().from(emotionalResponseAdaptations)
      .where(eq(emotionalResponseAdaptations.userId, userId))
      .orderBy(desc(emotionalResponseAdaptations.createdAt))
      .limit(limit);
  }

  async getCrisisDetectionLogs(userId: number, limit: number = 10): Promise<CrisisDetectionLog[]> {
    return await this.db.select().from(crisisDetectionLogs)
      .where(eq(crisisDetectionLogs.userId, userId))
      .orderBy(desc(crisisDetectionLogs.createdAt))
      .limit(limit);
  }

  async getEmotionalContexts(userId: number, limit: number = 20): Promise<EmotionalContext[]> {
    return await this.db.select().from(emotionalContexts)
      .where(eq(emotionalContexts.userId, userId))
      .orderBy(desc(emotionalContexts.createdAt))
      .limit(limit);
  }

  // Personality mirroring implementation
  async getUserMemories(userId: number): Promise<UserMemory[]> {
    return await this.db.select().from(userMemories)
      .where(eq(userMemories.userId, userId))
      .orderBy(desc(userMemories.createdAt));
  }

  async getUserFacts(userId: number): Promise<UserFact[]> {
    return await this.db.select().from(userFacts)
      .where(eq(userFacts.userId, userId))
      .orderBy(desc(userFacts.createdAt));
  }

  // Comprehensive Analytics & Reporting Implementation
  async createMonthlyWellnessReport(data: InsertMonthlyWellnessReport): Promise<MonthlyWellnessReport> {
    const [report] = await this.db.insert(monthlyWellnessReports).values(data).returning();
    return report;
  }

  async getMonthlyWellnessReports(userId: number, limit: number = 12): Promise<MonthlyWellnessReport[]> {
    return await this.db.select().from(monthlyWellnessReports)
      .where(eq(monthlyWellnessReports.userId, userId))
      .orderBy(desc(monthlyWellnessReports.reportMonth))
      .limit(limit);
  }

  async getMonthlyWellnessReport(userId: number, reportMonth: string): Promise<MonthlyWellnessReport | null> {
    const [report] = await this.db.select().from(monthlyWellnessReports)
      .where(and(
        eq(monthlyWellnessReports.userId, userId),
        eq(monthlyWellnessReports.reportMonth, reportMonth)
      ));
    return report || null;
  }

  async createAnalyticsMetric(data: InsertAnalyticsMetric): Promise<AnalyticsMetric> {
    const [metric] = await this.db.insert(analyticsMetrics).values(data).returning();
    return metric;
  }

  async getAnalyticsMetrics(userId: number, metricType?: string, limit: number = 30): Promise<AnalyticsMetric[]> {
    if (metricType) {
      return await this.db.select().from(analyticsMetrics)
        .where(and(
          eq(analyticsMetrics.userId, userId),
          eq(analyticsMetrics.metricType, metricType)
        ))
        .orderBy(desc(analyticsMetrics.calculatedDate))
        .limit(limit);
    }
    
    return await this.db.select().from(analyticsMetrics)
      .where(eq(analyticsMetrics.userId, userId))
      .orderBy(desc(analyticsMetrics.calculatedDate))
      .limit(limit);
  }

  async createProgressTracking(data: InsertProgressTracking): Promise<ProgressTracking> {
    const [tracking] = await this.db.insert(progressTracking).values(data).returning();
    return tracking;
  }

  async getProgressTracking(userId: number, period?: string, limit: number = 20): Promise<ProgressTracking[]> {
    if (period) {
      return await this.db.select().from(progressTracking)
        .where(and(
          eq(progressTracking.userId, userId),
          eq(progressTracking.trackingPeriod, period)
        ))
        .orderBy(desc(progressTracking.startDate))
        .limit(limit);
    }
    
    return await this.db.select().from(progressTracking)
      .where(eq(progressTracking.userId, userId))
      .orderBy(desc(progressTracking.startDate))
      .limit(limit);
  }

  async createRiskAssessment(data: InsertRiskAssessment): Promise<RiskAssessment> {
    const [assessment] = await this.db.insert(riskAssessments).values(data).returning();
    return assessment;
  }

  async getRiskAssessments(userId: number, limit: number = 10): Promise<RiskAssessment[]> {
    return await this.db.select().from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.assessmentDate))
      .limit(limit);
  }

  async getLatestRiskAssessment(userId: number): Promise<RiskAssessment | null> {
    const [assessment] = await this.db.select().from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.assessmentDate))
      .limit(1);
    return assessment || null;
  }

  async createLongitudinalTrend(data: InsertLongitudinalTrend): Promise<LongitudinalTrend> {
    const [trend] = await this.db.insert(longitudinalTrends).values(data).returning();
    return trend;
  }

  async getLongitudinalTrends(userId: number, trendType?: string, timeframe?: string): Promise<LongitudinalTrend[]> {
    if (trendType && timeframe) {
      return await this.db.select().from(longitudinalTrends)
        .where(and(
          eq(longitudinalTrends.userId, userId),
          eq(longitudinalTrends.trendType, trendType),
          eq(longitudinalTrends.timeframe, timeframe)
        ))
        .orderBy(desc(longitudinalTrends.lastCalculated));
    } else if (trendType) {
      return await this.db.select().from(longitudinalTrends)
        .where(and(
          eq(longitudinalTrends.userId, userId),
          eq(longitudinalTrends.trendType, trendType)
        ))
        .orderBy(desc(longitudinalTrends.lastCalculated));
    }
    
    return await this.db.select().from(longitudinalTrends)
      .where(eq(longitudinalTrends.userId, userId))
      .orderBy(desc(longitudinalTrends.lastCalculated));
  }

  async calculateUserWellnessMetrics(userId: number): Promise<any> {
    // Calculate comprehensive wellness metrics
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Get recent mood entries
    const recentMoods = await this.db.select().from(moodEntries)
      .where(and(
        eq(moodEntries.userId, userId),
        eq(moodEntries.createdAt, thirtyDaysAgo)
      ))
      .orderBy(desc(moodEntries.createdAt));
    
    // Get journal entries
    const journalCount = await this.db.select().from(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.createdAt, thirtyDaysAgo)
      ));
    
    // Calculate averages and metrics
    const averageMood = recentMoods.length > 0 
      ? recentMoods.reduce((sum, mood) => sum + (mood.intensity || 5), 0) / recentMoods.length
      : 5;
    
    const wellnessScore = Math.min(100, (averageMood / 10) * 100);
    const engagement = Math.min(100, (journalCount.length / 30) * 100);
    
    return {
      wellnessScore: Number(wellnessScore.toFixed(2)),
      averageMood: Number(averageMood.toFixed(2)),
      moodEntries: recentMoods.length,
      journalEntries: journalCount.length,
      engagement: Number(engagement.toFixed(2)),
      calculatedAt: currentDate
    };
  }

  async calculateEmotionalVolatility(userId: number, days: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    
    const moods = await this.db.select().from(moodEntries)
      .where(and(
        eq(moodEntries.userId, userId),
        eq(moodEntries.createdAt, cutoffDate)
      ))
      .orderBy(desc(moodEntries.createdAt));
    
    if (moods.length < 2) return 0;
    
    // Calculate standard deviation of mood intensities
    const intensities = moods.map(mood => mood.intensity || 5);
    const mean = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
    const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length;
    const volatility = Math.sqrt(variance);
    
    return Number(volatility.toFixed(2));
  }

  async calculateTherapeuticEngagement(userId: number, days: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    
    // Count therapeutic activities
    const journalCount = await this.db.select().from(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.createdAt, cutoffDate)
      ));
    
    const moodCount = await this.db.select().from(moodEntries)
      .where(and(
        eq(moodEntries.userId, userId),
        eq(moodEntries.createdAt, cutoffDate)
      ));
    
    const messageCount = await this.db.select().from(messages)
      .where(and(
        eq(messages.userId, userId),
        eq(messages.timestamp, cutoffDate)
      ));
    
    // Calculate engagement score (0-100)
    const totalActivities = journalCount.length + moodCount.length + (messageCount.length / 5);
    const maxPossibleActivities = days * 3; // 3 activities per day max
    const engagement = Math.min(100, (totalActivities / maxPossibleActivities) * 100);
    
    return Number(engagement.toFixed(2));
  }

  async generateWellnessInsights(userId: number): Promise<string> {
    const metrics = await this.calculateUserWellnessMetrics(userId);
    const volatility = await this.calculateEmotionalVolatility(userId);
    const engagement = await this.calculateTherapeuticEngagement(userId);
    
    let insights = "Based on your recent therapeutic data:\n\n";
    
    if (metrics.wellnessScore >= 75) {
      insights += "• Your wellness score shows strong emotional stability\n";
    } else if (metrics.wellnessScore >= 50) {
      insights += "• Your wellness score indicates moderate emotional balance with room for improvement\n";
    } else {
      insights += "• Your wellness score suggests focusing on emotional support strategies\n";
    }
    
    if (volatility <= 1.5) {
      insights += "• Your emotional patterns show good stability\n";
    } else if (volatility <= 3.0) {
      insights += "• Some emotional fluctuation detected - consider stress management techniques\n";
    } else {
      insights += "• Higher emotional volatility observed - regular therapeutic check-ins recommended\n";
    }
    
    if (engagement >= 60) {
      insights += "• Excellent therapeutic engagement - keep up the consistent practice\n";
    } else if (engagement >= 30) {
      insights += "• Moderate engagement - consider increasing journaling frequency\n";
    } else {
      insights += "• Low engagement detected - daily mindfulness practice recommended\n";
    }
    
    return insights;
  }

  async getHealthCorrelations(userId: number): Promise<any[]> {
    // Return empty array for now - health correlations would be implemented
    // when integrating with actual health data sources (wearables, health apps)
    return [];
  }

  // Enhanced Gamification & Rewards System Implementation

  async getUserWellnessPoints(userId: number): Promise<any> {
    const [result] = await this.db.select().from(userWellnessPoints).where(eq(userWellnessPoints.userId, userId));
    return result || null;
  }

  async createUserWellnessPoints(data: any): Promise<any> {
    const [result] = await this.db.insert(userWellnessPoints).values(data).returning();
    return result;
  }

  async awardWellnessPoints(userId: number, points: number, activity: string, description: string): Promise<void> {
    // Award points to user
    await this.db
      .update(userWellnessPoints)
      .set({
        totalPoints: sql`${userWellnessPoints.totalPoints} + ${points}`,
        availablePoints: sql`${userWellnessPoints.availablePoints} + ${points}`,
        lifetimePoints: sql`${userWellnessPoints.lifetimePoints} + ${points}`,
        lastActivityDate: new Date()
      })
      .where(eq(userWellnessPoints.userId, userId));

    // Create transaction record
    await this.db.insert(pointsTransactions).values({
      userId,
      points,
      transactionType: 'earned',
      activity,
      description,
      metadata: {}
    });
  }

  async getPointsTransactions(userId: number, limit: number = 10): Promise<any[]> {
    const results = await this.db
      .select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, userId))
      .orderBy(desc(pointsTransactions.createdAt))
      .limit(limit);
    return results;
  }

  async levelUpUser(userId: number): Promise<void> {
    await this.db
      .update(userWellnessPoints)
      .set({
        currentLevel: sql`${userWellnessPoints.currentLevel} + 1`,
        pointsToNextLevel: sql`${userWellnessPoints.pointsToNextLevel} + 100`
      })
      .where(eq(userWellnessPoints.userId, userId));
  }

  async getAllAchievements(): Promise<any[]> {
    const results = await this.db.select().from(achievements).where(eq(achievements.isActive, true));
    return results;
  }

  async checkAndUnlockAchievements(userId: number, activity: string, metadata: any): Promise<any[]> {
    // Get user's current achievements
    const userAchievs = await this.getUserAchievements(userId);
    const completedIds = userAchievs.filter(ua => ua.isCompleted).map(ua => ua.achievementId);
    
    // Get available achievements for this activity
    const availableAchievs = await this.db
      .select()
      .from(achievements)
      .where(and(
        eq(achievements.isActive, true),
        // Achievement not already completed
      ));

    const newAchievements = [];
    
    // Check for "First Steps" achievement (first journal entry)
    if (activity === 'journal_entry' && !completedIds.includes(1)) {
      const firstSteps = {
        id: 1,
        name: "First Steps",
        description: "Write your first journal entry",
        category: "engagement",
        pointsReward: 10
      };
      
      await this.db.insert(userAchievements).values({
        userId,
        achievementId: 1,
        progress: 1,
        isCompleted: true
      });
      
      newAchievements.push(firstSteps);
    }

    return newAchievements;
  }

  async getAvailableRewards(): Promise<any[]> {
    const results = await this.db.select().from(rewardsShop).where(eq(rewardsShop.isAvailable, true));
    return results;
  }

  async getUserPurchases(userId: number): Promise<any[]> {
    const results = await this.db.select().from(userPurchases).where(eq(userPurchases.userId, userId));
    return results;
  }

  async getRewardById(rewardId: number): Promise<any> {
    const [result] = await this.db.select().from(rewardsShop).where(eq(rewardsShop.id, rewardId));
    return result || null;
  }

  async purchaseReward(userId: number, rewardId: number, cost: number): Promise<void> {
    // Deduct points
    await this.db
      .update(userWellnessPoints)
      .set({
        availablePoints: sql`${userWellnessPoints.availablePoints} - ${cost}`
      })
      .where(eq(userWellnessPoints.userId, userId));

    // Record purchase
    await this.db.insert(userPurchases).values({
      userId,
      rewardId,
      metadata: {}
    });

    // Create transaction
    await this.db.insert(pointsTransactions).values({
      userId,
      points: -cost,
      transactionType: 'spent',
      activity: 'reward_purchase',
      description: `Purchased reward ID ${rewardId}`,
      metadata: { rewardId }
    });
  }

  async getUserStreaks(userId: number): Promise<any[]> {
    const results = await this.db
      .select()
      .from(wellnessStreaks)
      .where(and(eq(wellnessStreaks.userId, userId), eq(wellnessStreaks.isActive, true)));
    return results;
  }

  async updateStreak(userId: number, streakType: string): Promise<any> {
    const today = new Date();
    const [existing] = await this.db
      .select()
      .from(wellnessStreaks)
      .where(and(
        eq(wellnessStreaks.userId, userId),
        eq(wellnessStreaks.streakType, streakType)
      ));

    if (existing) {
      const lastActivity = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
      const isConsecutive = lastActivity && 
        (today.getTime() - lastActivity.getTime()) <= (24 * 60 * 60 * 1000 + 60 * 60 * 1000); // Within 25 hours

      const newStreak = isConsecutive ? (existing.currentStreak || 0) + 1 : 1;
      const longestStreak = Math.max(existing.longestStreak || 0, newStreak);

      await this.db
        .update(wellnessStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak,
          lastActivityDate: today,
          updatedAt: today
        })
        .where(eq(wellnessStreaks.id, existing.id));

      return { ...existing, currentStreak: newStreak, longestStreak };
    } else {
      const [newStreak] = await this.db.insert(wellnessStreaks).values({
        userId,
        streakType,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        isActive: true
      }).returning();

      return newStreak;
    }
  }

  async getActiveCommunityChallenes(): Promise<any[]> {
    const now = new Date();
    const results = await this.db
      .select()
      .from(communityChallenges)
      .where(and(
        eq(communityChallenges.isActive, true),
        // Active challenges (end date in future)
      ));
    return results;
  }

  async getUserChallengeProgress(userId: number): Promise<any[]> {
    const results = await this.db
      .select()
      .from(userChallengeProgress)
      .where(eq(userChallengeProgress.userId, userId));
    return results;
  }

  async joinCommunityChallenge(userId: number, challengeId: number): Promise<void> {
    await this.db.insert(userChallengeProgress).values({
      userId,
      challengeId,
      currentProgress: 0,
      isCompleted: false,
      pointsEarned: 0
    });

    // Increment participant count
    await this.db
      .update(communityChallenges)
      .set({
        participantCount: sql`${communityChallenges.participantCount} + 1`
      })
      .where(eq(communityChallenges.id, challengeId));
  }

  async updateChallengeProgress(userId: number, challengeId: number, progressIncrement: number): Promise<any> {
    const [updated] = await this.db
      .update(userChallengeProgress)
      .set({
        currentProgress: sql`${userChallengeProgress.currentProgress} + ${progressIncrement}`

      })
      .where(and(
        eq(userChallengeProgress.userId, userId),
        eq(userChallengeProgress.challengeId, challengeId)
      ))
      .returning();

    return updated;
  }

  async getTodayActivity(userId: number): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [result] = await this.db
      .select()
      .from(dailyActivities)
      .where(and(
        eq(dailyActivities.userId, userId),
        eq(dailyActivities.activityDate, today)
      ));

    return result || {
      activitiesCompleted: 0,
      pointsEarned: 0
    };
  }

  // Semantic Memory System Implementation
  async createConversationSummary(data: InsertConversationSummary): Promise<ConversationSummary> {
    const [summary] = await this.db.insert(conversationSummaries).values(data).returning();
    return summary;
  }

  async getConversationSummary(userId: number, sessionId: string): Promise<ConversationSummary | null> {
    const [summary] = await this.db.select().from(conversationSummaries)
      .where(and(eq(conversationSummaries.userId, userId), eq(conversationSummaries.sessionId, sessionId)));
    return summary || null;
  }

  async updateConversationSummary(id: number, data: Partial<InsertConversationSummary>): Promise<ConversationSummary> {
    const [summary] = await this.db.update(conversationSummaries).set(data)
      .where(eq(conversationSummaries.id, id)).returning();
    return summary;
  }

  async createSemanticMemory(data: InsertSemanticMemory): Promise<SemanticMemory> {
    const [memory] = await this.db.insert(semanticMemories).values(data).returning();
    return memory;
  }

  async getRecentSemanticMemories(userId: number, limit: number = 10): Promise<SemanticMemory[]> {
    return await this.db.select().from(semanticMemories)
      .where(and(eq(semanticMemories.userId, userId), eq(semanticMemories.isActiveMemory, true)))
      .orderBy(desc(semanticMemories.createdAt))
      .limit(limit);
  }

  async searchSemanticMemories(userId: number, searchTerms: string[], limit: number = 5): Promise<SemanticMemory[]> {
    if (searchTerms.length === 0) return [];
    
    // Simple array overlap search - in production would use vector similarity
    return await this.db.select().from(semanticMemories)
      .where(and(
        eq(semanticMemories.userId, userId),
        eq(semanticMemories.isActiveMemory, true)
      ))
      .orderBy(desc(semanticMemories.accessCount), desc(semanticMemories.createdAt))
      .limit(limit);
  }

  async updateMemoryAccessCount(memoryId: number): Promise<void> {
    await this.db.update(semanticMemories)
      .set({ 
        accessCount: sql`${semanticMemories.accessCount} + 1`,
        lastAccessedAt: new Date()
      })
      .where(eq(semanticMemories.id, memoryId));
  }

  async createMemoryConnection(data: InsertMemoryConnection): Promise<MemoryConnection> {
    const [connection] = await this.db.insert(memoryConnections).values(data).returning();
    return connection;
  }

  async getMemoryConnections(memoryId: number): Promise<MemoryConnection[]> {
    return await this.db.select().from(memoryConnections)
      .where(eq(memoryConnections.fromMemoryId, memoryId))
      .orderBy(desc(memoryConnections.strength));
  }

  async getAllUserMemoryConnections(userId: number): Promise<MemoryConnection[]> {
    return await this.db.select().from(memoryConnections)
      .where(eq(memoryConnections.userId, userId))
      .orderBy(desc(memoryConnections.createdAt));
  }

  async createMemoryInsight(data: InsertMemoryInsight): Promise<MemoryInsight> {
    const [insight] = await this.db.insert(memoryInsights).values(data).returning();
    return insight;
  }

  async getMemoryInsights(userId: number): Promise<MemoryInsight[]> {
    return await this.db.select().from(memoryInsights)
      .where(eq(memoryInsights.userId, userId))
      .orderBy(desc(memoryInsights.generatedAt));
  }

  // Therapist Portal System Implementation
  async createTherapist(data: InsertTherapist): Promise<Therapist> {
    const [therapist] = await this.db.insert(therapists).values(data).returning();
    return therapist;
  }

  async getTherapistById(id: number): Promise<Therapist | null> {
    const [therapist] = await this.db.select().from(therapists).where(eq(therapists.id, id));
    return therapist || null;
  }

  async getTherapistByEmail(email: string): Promise<Therapist | null> {
    const [therapist] = await this.db.select().from(therapists).where(eq(therapists.email, email));
    return therapist || null;
  }

  async updateTherapist(id: number, data: Partial<InsertTherapist>): Promise<Therapist> {
    const [therapist] = await this.db.update(therapists).set(data).where(eq(therapists.id, id)).returning();
    return therapist;
  }

  async createClientTherapistRelationship(data: InsertClientTherapistRelationship): Promise<ClientTherapistRelationship> {
    const [relationship] = await this.db.insert(clientTherapistRelationships).values(data).returning();
    return relationship;
  }

  async getClientTherapistRelationships(therapistId: number): Promise<ClientTherapistRelationship[]> {
    return await this.db.select().from(clientTherapistRelationships)
      .where(eq(clientTherapistRelationships.therapistId, therapistId));
  }

  async getTherapistForClient(clientUserId: number): Promise<ClientTherapistRelationship | null> {
    const [relationship] = await this.db.select().from(clientTherapistRelationships)
      .where(and(
        eq(clientTherapistRelationships.clientUserId, clientUserId),
        eq(clientTherapistRelationships.status, 'active')
      ));
    return relationship || null;
  }

  async updateRelationshipStatus(id: number, status: string): Promise<ClientTherapistRelationship> {
    const [relationship] = await this.db.update(clientTherapistRelationships)
      .set({ status, activatedAt: status === 'active' ? new Date() : null })
      .where(eq(clientTherapistRelationships.id, id))
      .returning();
    return relationship;
  }

  async getClientPrivacySettings(clientUserId: number, therapistId: number): Promise<ClientPrivacySettings | null> {
    const [settings] = await this.db.select().from(clientPrivacySettings)
      .where(and(
        eq(clientPrivacySettings.clientUserId, clientUserId),
        eq(clientPrivacySettings.therapistId, therapistId)
      ));
    return settings || null;
  }

  async updateClientPrivacySettings(data: InsertClientPrivacySettings): Promise<ClientPrivacySettings> {
    // Upsert privacy settings
    const [settings] = await this.db
      .insert(clientPrivacySettings)
      .values({ ...data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [clientPrivacySettings.clientUserId, clientPrivacySettings.therapistId],
        set: { ...data, updatedAt: new Date() }
      })
      .returning();
    return settings;
  }

  async createTherapistSessionNote(data: InsertTherapistSessionNotes): Promise<TherapistSessionNotes> {
    const [note] = await this.db.insert(therapistSessionNotes).values(data).returning();
    return note;
  }

  async getTherapistSessionNotes(therapistId: number, clientUserId?: number): Promise<TherapistSessionNotes[]> {
    const whereConditions = [eq(therapistSessionNotes.therapistId, therapistId)];
    
    if (clientUserId) {
      whereConditions.push(eq(therapistSessionNotes.clientUserId, clientUserId));
    }
    
    return await this.db.select().from(therapistSessionNotes)
      .where(and(...whereConditions))
      .orderBy(desc(therapistSessionNotes.sessionDate));
  }

  async createRiskAlert(data: InsertRiskAlert): Promise<RiskAlert> {
    const [alert] = await this.db.insert(riskAlerts).values(data).returning();
    return alert;
  }

  async getRiskAlerts(therapistId: number, clientUserId?: number, acknowledged?: boolean): Promise<RiskAlert[]> {
    const whereConditions = [eq(riskAlerts.therapistId, therapistId)];
    
    if (clientUserId) {
      whereConditions.push(eq(riskAlerts.clientUserId, clientUserId));
    }
    
    if (acknowledged !== undefined) {
      whereConditions.push(eq(riskAlerts.acknowledged, acknowledged));
    }
    
    return await this.db.select().from(riskAlerts)
      .where(and(...whereConditions))
      .orderBy(desc(riskAlerts.createdAt));
  }

  async acknowledgeRiskAlert(id: number): Promise<RiskAlert> {
    const [alert] = await this.db.update(riskAlerts)
      .set({ acknowledged: true, acknowledgedAt: new Date() })
      .where(eq(riskAlerts.id, id))
      .returning();
    return alert;
  }

  async getClientDashboardData(therapistId: number, clientUserId: number): Promise<any> {
    // Get privacy settings first
    const privacySettings = await this.getClientPrivacySettings(clientUserId, therapistId);
    
    const dashboardData: any = {
      clientId: clientUserId,
      privacySettings,
      allowedData: {}
    };

    if (privacySettings?.shareMoodData) {
      // Get recent mood data
      const recentMoods = await this.db.select().from(moodEntries)
        .where(eq(moodEntries.userId, clientUserId))
        .orderBy(desc(moodEntries.createdAt))
        .limit(30);
      dashboardData.allowedData.moodData = recentMoods;
    }

    if (privacySettings?.shareJournalData) {
      // Get recent journal entries (excluding private ones)
      const recentJournals = await this.db.select().from(journalEntries)
        .where(and(
          eq(journalEntries.userId, clientUserId),
          eq(journalEntries.isPrivate, false)
        ))
        .orderBy(desc(journalEntries.createdAt))
        .limit(10);
      dashboardData.allowedData.journalData = recentJournals;
    }

    if (privacySettings?.shareCrisisAlerts) {
      // Get recent risk alerts
      const alerts = await this.getRiskAlerts(therapistId, clientUserId);
      dashboardData.allowedData.riskAlerts = alerts;
    }

    if (privacySettings?.shareSessionSummaries) {
      // Get session notes
      const sessionNotes = await this.getTherapistSessionNotes(therapistId, clientUserId);
      dashboardData.allowedData.sessionNotes = sessionNotes;
    }

    return dashboardData;
  }

  async generateRiskAlerts(clientUserId: number): Promise<void> {
    // Get therapist relationship
    const relationship = await this.getTherapistForClient(clientUserId);
    if (!relationship) return;

    // Check for mood spikes (3+ negative moods in 7 days)
    const recentMoods = await this.db.select().from(moodEntries)
      .where(eq(moodEntries.userId, clientUserId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(10);

    const negativeMoods = recentMoods.filter(mood => 
      ['sad', 'anxious', 'angry', 'depressed'].includes(mood.mood.toLowerCase())
    );

    if (negativeMoods.length >= 3) {
      await this.createRiskAlert({
        clientUserId,
        therapistId: relationship.therapistId,
        alertType: 'mood_spike',
        severity: 'medium',
        description: `Client has experienced ${negativeMoods.length} negative mood entries in recent activity`,
        triggerData: { moodCount: negativeMoods.length, moods: negativeMoods.slice(0, 3) }
      });
    }

    // Check for journal patterns indicating distress
    const recentJournals = await this.db.select().from(journalEntries)
      .where(eq(journalEntries.userId, clientUserId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(5);

    const distressKeywords = ['suicide', 'kill myself', 'end it all', 'hopeless', 'worthless', 'can\'t go on'];
    const concerningJournals = recentJournals.filter(journal => 
      distressKeywords.some(keyword => journal.content.toLowerCase().includes(keyword))
    );

    if (concerningJournals.length > 0) {
      await this.createRiskAlert({
        clientUserId,
        therapistId: relationship.therapistId,
        alertType: 'journal_pattern',
        severity: 'high',
        description: 'Concerning language patterns detected in recent journal entries',
        triggerData: { journalCount: concerningJournals.length }
      });
    }
  }

  // Data clearing methods for fresh user starts
  async clearUserMessages(userId: number): Promise<void> {
    await this.db.delete(messages).where(eq(messages.userId, userId));
  }

  async clearUserJournalEntries(userId: number): Promise<void> {
    await this.db.delete(journalEntries).where(eq(journalEntries.userId, userId));
  }

  async clearUserMoodEntries(userId: number): Promise<void> {
    await this.db.delete(moodEntries).where(eq(moodEntries.userId, userId));
  }

  async clearUserMemories(userId: number): Promise<void> {
    await this.db.delete(userMemories).where(eq(userMemories.userId, userId));
    await this.db.delete(userFacts).where(eq(userFacts.userId, userId));
    await this.db.delete(semanticMemories).where(eq(semanticMemories.userId, userId));
  }

  async clearUserGoals(userId: number): Promise<void> {
    await this.db.delete(therapeuticGoals).where(eq(therapeuticGoals.userId, userId));
  }

  async clearUserAchievements(userId: number): Promise<void> {
    await this.db.delete(userAchievements).where(eq(userAchievements.userId, userId));
    await this.db.delete(pointsTransactions).where(eq(pointsTransactions.userId, userId));
    await this.db.delete(userPurchases).where(eq(userPurchases.userId, userId));
  }

  async clearUserAnalytics(userId: number): Promise<void> {
    await this.db.delete(analyticsMetrics).where(eq(analyticsMetrics.userId, userId));
    await this.db.delete(emotionalPatterns).where(eq(emotionalPatterns.userId, userId));
    await this.db.delete(moodForecasts).where(eq(moodForecasts.userId, userId));
    await this.db.delete(emotionalContexts).where(eq(emotionalContexts.userId, userId));
    await this.db.delete(predictiveInsights).where(eq(predictiveInsights.userId, userId));
    await this.db.delete(crisisDetectionLogs).where(eq(crisisDetectionLogs.userId, userId));
  }

  // Alias methods for API compatibility
  async deleteUserMessages(userId: number): Promise<void> {
    return this.clearUserMessages(userId);
  }

  async deleteUserJournalEntries(userId: number): Promise<void> {
    return this.clearUserJournalEntries(userId);
  }

  async deleteUserMoodEntries(userId: number): Promise<void> {
    return this.clearUserMoodEntries(userId);
  }

  async deleteUserGoals(userId: number): Promise<void> {
    return this.clearUserGoals(userId);
  }

  async deleteUserAchievements(userId: number): Promise<void> {
    return this.clearUserAchievements(userId);
  }

  // CRITICAL: Missing clear methods for challenge progress - RESET BUG FIX
  async clearUserChallengeProgress(userId: number): Promise<void> {
    await this.db.delete(userChallengeProgress).where(eq(userChallengeProgress.userId, userId));
  }

  async clearUserWellnessPoints(userId: number): Promise<void> {
    await this.db.delete(userWellnessPoints).where(eq(userWellnessPoints.userId, userId));
  }

  async clearUserStreaks(userId: number): Promise<void> {
    await this.db.delete(userStreaks).where(eq(userStreaks.userId, userId));
    await this.db.delete(wellnessStreaks).where(eq(wellnessStreaks.userId, userId));
  }

  async clearUserCommunityParticipation(userId: number): Promise<void> {
    await this.db.delete(forumPosts).where(eq(forumPosts.userId, userId));
    // Skip forum replies and peer check-ins if tables don't exist
  }

  // Streak Tracking System Implementation
  async createUserStreak(data: InsertUserStreak): Promise<UserStreak> {
    const [streak] = await this.db.insert(userStreaks).values(data).returning();
    return streak;
  }

  async updateUserStreak(userId: number, streakType: string, updates: Partial<InsertUserStreak>): Promise<void> {
    await this.db
      .update(userStreaks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(userStreaks.userId, userId), eq(userStreaks.streakType, streakType)));
  }

  async getUserStreak(userId: number, streakType: string): Promise<UserStreak | null> {
    const [streak] = await this.db
      .select()
      .from(userStreaks)
      .where(and(eq(userStreaks.userId, userId), eq(userStreaks.streakType, streakType)));
    return streak || null;
  }

  async recordDailyActivity(data: InsertDailyActivity): Promise<DailyActivity> {
    const [activity] = await this.db.insert(dailyActivities).values(data).returning();
    return activity;
  }

  async getDailyActivities(userId: number, days: number = 30): Promise<DailyActivity[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return await this.db
      .select()
      .from(dailyActivities)
      .where(and(
        eq(dailyActivities.userId, userId),
        lt(dailyActivities.activityDate, daysAgo)
      ))
      .orderBy(desc(dailyActivities.activityDate));
  }

  async hasActivityToday(userId: number, activityType: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [activity] = await this.db
      .select()
      .from(dailyActivities)
      .where(and(
        eq(dailyActivities.userId, userId),
        eq(dailyActivities.activityType, activityType),
        lt(dailyActivities.activityDate, today),
        lt(dailyActivities.activityDate, tomorrow)
      ));

    return !!activity;
  }

  async calculateStreak(userId: number, streakType: string): Promise<number> {
    const activities = await this.getDailyActivities(userId, 365); // Get up to a year of activities
    const activityType = streakType.replace('_streak', ''); // Convert 'daily_active_streak' to 'daily_active'
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count consecutive days from today backwards
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasActivity = activities.some(activity => {
        const activityDate = new Date(activity.activityDate);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === checkDate.getTime() && 
               activity.activityType === activityType;
      });
      
      if (hasActivity) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return currentStreak;
  }

  async updateStreakOnActivity(userId: number, activityType: string): Promise<void> {
    // Record the activity
    await this.recordDailyActivity({
      userId,
      activityType,
      activityDate: new Date(),
      activityCount: 1
    });

    // Calculate new streak
    const streakType = `${activityType}_streak`;
    const newStreak = await this.calculateStreak(userId, streakType);
    
    // Get or create user streak record
    let userStreak = await this.getUserStreak(userId, streakType);
    
    if (!userStreak) {
      // Create new streak record
      userStreak = await this.createUserStreak({
        userId,
        streakType,
        currentStreak: newStreak,
        longestStreak: newStreak,
        lastActivityDate: new Date(),
        streakStartDate: new Date(),
        totalActiveDays: 1
      });
    } else {
      // Update existing streak record
      const updates: Partial<InsertUserStreak> = {
        currentStreak: newStreak,
        longestStreak: Math.max(userStreak.longestStreak || 0, newStreak),
        lastActivityDate: new Date(),
        totalActiveDays: (userStreak.totalActiveDays || 0) + 1
      };
      
      await this.updateUserStreak(userId, streakType, updates);
    }
  }

  // Ambient Sound System Implementation
  async createAmbientSoundPreferences(data: any): Promise<any> {
    // Store preferences in memory for now (would normally be stored in database)
    const preferences = {
      id: Date.now(),
      userId: data.userId,
      favoriteCategories: data.favoriteCategories || [],
      preferredVolume: data.preferredVolume || 0.5,
      adaptiveMode: data.adaptiveMode !== false,
      customSoundSettings: data.customSoundSettings || {},
      lastUpdated: data.lastUpdated || new Date()
    };
    
    // In a full implementation, this would use a proper database table
    return preferences;
  }

  async getAmbientSoundPreferences(userId: number): Promise<any> {
    // Return default preferences for now
    return {
      favoriteCategories: ['nature'],
      preferredVolume: 0.5,
      adaptiveMode: true,
      customSoundSettings: {}
    };
  }

  async logAmbientSoundUsage(data: any): Promise<any> {
    // Log usage data (would normally be stored in database)
    const usage = {
      id: Date.now(),
      userId: data.userId,
      soundId: data.soundId,
      duration: data.duration || 0,
      mood: data.mood || 'neutral',
      category: data.category || 'general',
      timestamp: data.timestamp || new Date()
    };
    
    // In a full implementation, this would use a proper database table
    return usage;
  }

  // VR/AR Therapeutic Experiences methods implementation
  async getVrEnvironments(category?: string): Promise<VrEnvironment[]> {
    let query = this.db.select().from(vrEnvironments).where(eq(vrEnvironments.isActive, true));
    
    if (category) {
      query = this.db.select().from(vrEnvironments).where(
        and(
          eq(vrEnvironments.isActive, true),
          eq(vrEnvironments.environmentType, category)
        )
      );
    }
    
    return await query.orderBy(vrEnvironments.name);
  }

  async getVrEnvironment(id: number): Promise<VrEnvironment | null> {
    const [environment] = await this.db.select().from(vrEnvironments).where(eq(vrEnvironments.id, id));
    return environment || null;
  }

  async createVrEnvironment(environment: InsertVrEnvironment): Promise<VrEnvironment> {
    const [newEnvironment] = await this.db.insert(vrEnvironments).values(environment).returning();
    return newEnvironment;
  }

  async updateVrEnvironment(id: number, updates: Partial<InsertVrEnvironment>): Promise<VrEnvironment> {
    const [updatedEnvironment] = await this.db.update(vrEnvironments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vrEnvironments.id, id))
      .returning();
    return updatedEnvironment;
  }

  async getUserVrSessions(userId: number, limit?: number): Promise<VrSession[]> {
    if (limit) {
      return await this.db.select().from(vrSessions)
        .where(eq(vrSessions.userId, userId))
        .orderBy(desc(vrSessions.startTime))
        .limit(limit);
    } else {
      return await this.db.select().from(vrSessions)
        .where(eq(vrSessions.userId, userId))
        .orderBy(desc(vrSessions.startTime));
    }
  }

  async getVrSession(id: number): Promise<VrSession | null> {
    const [session] = await this.db.select().from(vrSessions).where(eq(vrSessions.id, id));
    return session || null;
  }

  async createVrSession(session: InsertVrSession): Promise<VrSession> {
    const [newSession] = await this.db.insert(vrSessions).values(session).returning();
    return newSession;
  }

  async updateVrSession(id: number, updates: Partial<InsertVrSession>): Promise<VrSession> {
    const [updatedSession] = await this.db.update(vrSessions)
      .set(updates)
      .where(eq(vrSessions.id, id))
      .returning();
    return updatedSession;
  }

  async getUserVrProgress(userId: number, environmentId?: number): Promise<VrProgressTracking[]> {
    let query = this.db.select().from(vrProgressTracking).where(eq(vrProgressTracking.userId, userId));
    
    if (environmentId) {
      query = this.db.select().from(vrProgressTracking).where(
        and(
          eq(vrProgressTracking.userId, userId),
          eq(vrProgressTracking.environmentId, environmentId)
        )
      );
    }
    
    return await query.orderBy(desc(vrProgressTracking.updatedAt));
  }

  async getVrProgress(userId: number, environmentId: number): Promise<VrProgressTracking | null> {
    const [progress] = await this.db.select().from(vrProgressTracking)
      .where(and(
        eq(vrProgressTracking.userId, userId),
        eq(vrProgressTracking.environmentId, environmentId)
      ));
    return progress || null;
  }

  async createVrProgress(progress: InsertVrProgressTracking): Promise<VrProgressTracking> {
    const [newProgress] = await this.db.insert(vrProgressTracking).values(progress).returning();
    return newProgress;
  }

  async updateVrProgress(userId: number, environmentId: number, updates: Partial<InsertVrProgressTracking>): Promise<VrProgressTracking> {
    const [updatedProgress] = await this.db.update(vrProgressTracking)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(vrProgressTracking.userId, userId),
        eq(vrProgressTracking.environmentId, environmentId)
      ))
      .returning();
    return updatedProgress;
  }

  async getUserVrTherapeuticPlans(userId: number): Promise<VrTherapeuticPlan[]> {
    return await this.db.select().from(vrTherapeuticPlans)
      .where(eq(vrTherapeuticPlans.userId, userId))
      .orderBy(desc(vrTherapeuticPlans.updatedAt));
  }

  async getVrTherapeuticPlan(id: number): Promise<VrTherapeuticPlan | null> {
    const [plan] = await this.db.select().from(vrTherapeuticPlans).where(eq(vrTherapeuticPlans.id, id));
    return plan || null;
  }

  async createVrTherapeuticPlan(plan: InsertVrTherapeuticPlan): Promise<VrTherapeuticPlan> {
    const [newPlan] = await this.db.insert(vrTherapeuticPlans).values(plan).returning();
    return newPlan;
  }

  async updateVrTherapeuticPlan(id: number, updates: Partial<InsertVrTherapeuticPlan>): Promise<VrTherapeuticPlan> {
    const [updatedPlan] = await this.db.update(vrTherapeuticPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vrTherapeuticPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async getUserVrAccessibilityProfile(userId: number): Promise<VrAccessibilityProfile | null> {
    const [profile] = await this.db.select().from(vrAccessibilityProfiles)
      .where(eq(vrAccessibilityProfiles.userId, userId));
    return profile || null;
  }

  async createVrAccessibilityProfile(profile: InsertVrAccessibilityProfile): Promise<VrAccessibilityProfile> {
    const [newProfile] = await this.db.insert(vrAccessibilityProfiles).values(profile).returning();
    return newProfile;
  }

  async updateVrAccessibilityProfile(userId: number, updates: Partial<InsertVrAccessibilityProfile>): Promise<VrAccessibilityProfile> {
    const [updatedProfile] = await this.db.update(vrAccessibilityProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vrAccessibilityProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }
}

export const storage = new DbStorage();