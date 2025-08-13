import { 
  users, bots, messages, learnedWords, milestones, userMemories, userFacts, moodEntries, emotionalPatterns,
  safetyCheckIns, crisisInterventions, journalEntries, journalAnalytics, journalExports,
  therapists, therapistSessions, therapistSharedInsights, collaborationSettings,
  userAchievements, wellnessStreaks, dailyActivities,
  supportForums, forumPosts, forumReplies, peerCheckIns, peerSessions, communityModerations,
  userPreferences, conversationPatterns, wellnessRecommendations, userFeedback, monthlyReports,
  wearableDevices, healthMetrics, healthCorrelations, syncLogs,
  vrEnvironments, vrSessions, vrProgressTracking, vrTherapeuticPlans, vrAccessibilityProfiles,

  moodForecasts, emotionalContexts, predictiveInsights, emotionalResponseAdaptations,

  type User, type InsertUser, type Bot, type InsertBot,
  type Message, type InsertMessage, type LearnedWord, type InsertLearnedWord,
  type Milestone, type InsertMilestone, type UserMemory, type InsertUserMemory,
  type UserFact, type InsertUserFact, type MoodEntry, type InsertMoodEntry,
  type EmotionalPattern, type InsertEmotionalPattern,
  type SafetyCheckIn, type InsertSafetyCheckIn,
  type CrisisIntervention, type InsertCrisisIntervention,
  type JournalEntry, type InsertJournalEntry,
  type JournalAnalytics, type InsertJournalAnalytics,
  type JournalExport, type InsertJournalExport,
  type Therapist, type InsertTherapist,
  type TherapistSession, type InsertTherapistSession,
  type TherapistSharedInsight, type InsertTherapistSharedInsight,
  type CollaborationSettings, type InsertCollaborationSettings,
  type UserAchievement, type InsertUserAchievement,
  type WellnessStreak, type InsertWellnessStreak,
  type DailyActivity, type InsertDailyActivity,
  type SupportForum, type InsertSupportForum,
  type ForumPost, type InsertForumPost,
  type ForumReply, type InsertForumReply,
  type PeerCheckIn, type InsertPeerCheckIn,
  type PeerSession, type InsertPeerSession,
  type CommunityModeration, type InsertCommunityModeration,
  type UserPreferences, type InsertUserPreferences,
  type ConversationPattern, type InsertConversationPattern,
  type WellnessRecommendation, type InsertWellnessRecommendation,

  type UserFeedback, type InsertUserFeedback,
  type MonthlyReport, type InsertMonthlyReport,
  type WearableDevice, type InsertWearableDevice,
  type HealthMetric, type InsertHealthMetric,
  type HealthCorrelation, type InsertHealthCorrelation,
  type SyncLog, type InsertSyncLog,
  type VrEnvironment, type InsertVrEnvironment,
  type VrSession, type InsertVrSession,
  type VrProgressTracking, type InsertVrProgressTracking,
  type VrTherapeuticPlan, type InsertVrTherapeuticPlan,
  type VrAccessibilityProfile, type InsertVrAccessibilityProfile,
  type UserWellnessPoints, type InsertUserWellnessPoints,
  type RewardsShop, type InsertRewardsShop,
  type UserRewards, type InsertUserRewards,
  type CommunityChallenge, type InsertCommunityChallenge,
  type ChallengeParticipant, type InsertChallengeParticipant,
  type ChallengeActivity, type InsertChallengeActivity,
  type EmotionalAchievement, type InsertEmotionalAchievement,
  type UserEmotionalAchievement, type InsertUserEmotionalAchievement,
  type PointsHistory, type InsertPointsHistory,
  type MoodForecast, type InsertMoodForecast,
  type EmotionalContext, type InsertEmotionalContext,
  type PredictiveInsight, type InsertPredictiveInsight,
  type EmotionalResponseAdaptation, type InsertEmotionalResponseAdaptation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Bot methods
  getBot(id: number): Promise<Bot | undefined>;
  getBotByUserId(userId: number): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: number, updates: Partial<Bot>): Promise<Bot | undefined>;

  // Message methods
  getMessages(botId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Learning methods
  getLearnedWords(botId: number): Promise<LearnedWord[]>;
  createOrUpdateWord(word: InsertLearnedWord): Promise<LearnedWord>;

  // Milestone methods
  getMilestones(botId: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;

  // Memory methods
  getUserMemories(userId: number): Promise<UserMemory[]>;
  createUserMemory(memory: InsertUserMemory): Promise<UserMemory>;
  clearUserMemories(userId: number): Promise<void>;
  getUserFacts(userId: number): Promise<UserFact[]>;
  createUserFact(fact: InsertUserFact): Promise<UserFact>;
  clearUserFacts(userId: number): Promise<void>;
  resetBotStats(userId: number): Promise<void>;

  // Mood tracking methods
  getMoodEntries(userId: number, limit?: number): Promise<MoodEntry[]>;
  createMoodEntry(mood: InsertMoodEntry): Promise<MoodEntry>;
  getEmotionalPattern(userId: number): Promise<EmotionalPattern | undefined>;
  updateEmotionalPattern(userId: number, pattern: InsertEmotionalPattern): Promise<EmotionalPattern>;

  // Crisis detection methods
  createSafetyCheckIn(checkIn: InsertSafetyCheckIn): Promise<SafetyCheckIn>;
  getSafetyCheckIns(userId: number, limit?: number): Promise<SafetyCheckIn[]>;
  updateSafetyCheckIn(id: number, updates: Partial<SafetyCheckIn>): Promise<SafetyCheckIn | undefined>;
  createCrisisIntervention(intervention: InsertCrisisIntervention): Promise<CrisisIntervention>;
  getPendingCheckIns(userId: number): Promise<SafetyCheckIn[]>;

  // Journaling methods
  getJournalEntries(userId: number, limit?: number, offset?: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<void>;
  getJournalAnalytics(entryId: number): Promise<JournalAnalytics | undefined>;
  createJournalAnalytics(analytics: InsertJournalAnalytics): Promise<JournalAnalytics>;
  getJournalAnalyticsByUser(userId: number, limit?: number): Promise<JournalAnalytics[]>;
  createJournalExport(exportData: InsertJournalExport): Promise<JournalExport>;
  getJournalExports(userId: number): Promise<JournalExport[]>;
  updateJournalExport(id: number, updates: Partial<JournalExport>): Promise<JournalExport | undefined>;

  // Therapist integration methods
  getTherapistsByUser(userId: number): Promise<Therapist[]>;
  createTherapist(therapist: InsertTherapist): Promise<Therapist>;
  getTherapistSessionsByUser(userId: number): Promise<TherapistSession[]>;
  createTherapistSession(session: InsertTherapistSession): Promise<TherapistSession>;
  updateTherapistSession(id: number, updates: Partial<TherapistSession>): Promise<TherapistSession | undefined>;
  getTherapistSharedInsightsByUser(userId: number): Promise<TherapistSharedInsight[]>;
  createTherapistSharedInsight(insight: InsertTherapistSharedInsight): Promise<TherapistSharedInsight>;
  getCollaborationSettings(userId: number): Promise<CollaborationSettings | undefined>;
  createCollaborationSettings(settings: InsertCollaborationSettings): Promise<CollaborationSettings>;
  updateCollaborationSettings(userId: number, updates: Partial<CollaborationSettings>): Promise<CollaborationSettings | undefined>;

  // Gamification methods
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  getWellnessStreak(userId: number, streakType: string): Promise<WellnessStreak | undefined>;
  createWellnessStreak(streak: InsertWellnessStreak): Promise<WellnessStreak>;
  updateWellnessStreak(id: number, updates: Partial<WellnessStreak>): Promise<WellnessStreak | undefined>;
  updateDailyActivity(userId: number, date: Date, activityType: string): Promise<void>;
  getDailyActivitiesHistory(userId: number, limit?: number): Promise<DailyActivity[]>;
  getDailyCheckinCount(userId: number): Promise<number>;
  getJournalEntryCount(userId: number): Promise<number>;
  getMoodEntryCount(userId: number): Promise<number>;
  getChatSessionCount(userId: number): Promise<number>;
  getGoalProgressCount(userId: number): Promise<number>;

  // Community and Peer Support methods
  getSupportForums(): Promise<SupportForum[]>;
  getSupportForum(id: number): Promise<SupportForum | undefined>;
  createSupportForum(forum: InsertSupportForum): Promise<SupportForum>;
  getForumPosts(forumId: number, limit?: number): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  updateForumPost(id: number, updates: Partial<ForumPost>): Promise<ForumPost | undefined>;
  getForumReplies(postId: number): Promise<ForumReply[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  updateForumReply(id: number, updates: Partial<ForumReply>): Promise<ForumReply | undefined>;
  getPeerCheckInRequests(status?: string): Promise<PeerCheckIn[]>;
  getUserPeerCheckIns(userId: number): Promise<PeerCheckIn[]>;
  createPeerCheckIn(checkIn: InsertPeerCheckIn): Promise<PeerCheckIn>;
  updatePeerCheckIn(id: number, updates: Partial<PeerCheckIn>): Promise<PeerCheckIn | undefined>;
  getPeerSessions(userId: number): Promise<PeerSession[]>;
  createPeerSession(session: InsertPeerSession): Promise<PeerSession>;
  updatePeerSession(id: number, updates: Partial<PeerSession>): Promise<PeerSession | undefined>;
  createCommunityModeration(moderation: InsertCommunityModeration): Promise<CommunityModeration>;

  // Adaptive Learning and Personalization methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  getLatestAdaptationInsights(userId: number): Promise<AdaptationInsight | undefined>;
  createAdaptationInsight(insight: InsertAdaptationInsight): Promise<AdaptationInsight>;
  getWellnessRecommendations(userId: number, limit?: number): Promise<WellnessRecommendation[]>;
  createWellnessRecommendation(recommendation: InsertWellnessRecommendation): Promise<WellnessRecommendation>;
  markRecommendationUsed(recommendationId: number): Promise<void>;
  rateRecommendation(recommendationId: number, rating: number): Promise<void>;
  createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  getConversationPatterns(userId: number): Promise<ConversationPattern[]>;
  createConversationPattern(pattern: InsertConversationPattern): Promise<ConversationPattern>;

  // CRITICAL SEMANTIC MEMORY METHODS - MEMORY SYSTEM FIX  
  getRecentSemanticMemories(userId: number, limit?: number): Promise<any[]>;
  createSemanticMemory(data: any): Promise<any>;
  searchSemanticMemories(userId: number, searchTerms: string[], limit?: number): Promise<any[]>;
  getMemoryConnections(memoryId: number): Promise<any[]>;
  createMemoryConnection(data: any): Promise<any>;
  updateMemoryAccessCount(memoryId: number): Promise<void>;
  getAllUserMemoryConnections(userId: number): Promise<any[]>;
  getConversationSessionHistory(userId: number, limit?: number): Promise<any[]>;
  getUnaddressedContinuity(userId: number): Promise<any[]>;
  getActiveConversationThreads(userId: number): Promise<any[]>;
  markContinuityAddressed(continuityId: number): Promise<void>;

  // Conversation Continuity methods
  getActiveConversationSession(userId: number): Promise<any>;
  createConversationSession(data: any): Promise<any>;
  updateConversationSession(id: number, data: any): Promise<any>;
  createConversationThread(data: any): Promise<any>;
  updateConversationThread(id: number, data: any): Promise<any>;
  createSessionContinuity(data: any): Promise<any>;
  getMonthlyReport(userId: number, reportMonth: string): Promise<MonthlyReport | undefined>;
  saveMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport>;
  getMonthlyReportById(reportId: number): Promise<MonthlyReport | undefined>;

  // Wearable Device Integration methods
  getWearableDevices(userId: number): Promise<WearableDevice[]>;
  createWearableDevice(device: InsertWearableDevice): Promise<WearableDevice>;
  updateWearableDevice(deviceId: number, updates: Partial<WearableDevice>): Promise<WearableDevice | undefined>;
  deleteWearableDevice(deviceId: number): Promise<void>;
  getHealthMetrics(userId: number, metricType?: string, limit?: number): Promise<HealthMetric[]>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  getHealthCorrelations(userId: number): Promise<HealthCorrelation[]>;
  createHealthCorrelation(correlation: InsertHealthCorrelation): Promise<HealthCorrelation>;
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;
  getRecentSyncLogs(deviceId: number, limit?: number): Promise<SyncLog[]>;

  // VR/AR Therapeutic Experiences methods
  getVrEnvironments(category?: string): Promise<VrEnvironment[]>;
  getVrEnvironment(id: number): Promise<VrEnvironment | undefined>;
  createVrEnvironment(environment: InsertVrEnvironment): Promise<VrEnvironment>;
  updateVrEnvironment(id: number, updates: Partial<InsertVrEnvironment>): Promise<VrEnvironment>;
  
  getUserVrSessions(userId: number, limit?: number): Promise<VrSession[]>;
  getVrSession(id: number): Promise<VrSession | undefined>;
  createVrSession(session: InsertVrSession): Promise<VrSession>;
  updateVrSession(id: number, updates: Partial<InsertVrSession>): Promise<VrSession>;
  
  getUserVrProgress(userId: number, environmentId?: number): Promise<VrProgressTracking[]>;
  getVrProgress(userId: number, environmentId: number): Promise<VrProgressTracking | undefined>;
  createVrProgress(progress: InsertVrProgressTracking): Promise<VrProgressTracking>;
  updateVrProgress(userId: number, environmentId: number, updates: Partial<InsertVrProgressTracking>): Promise<VrProgressTracking>;
  
  getUserVrTherapeuticPlans(userId: number): Promise<VrTherapeuticPlan[]>;
  getVrTherapeuticPlan(id: number): Promise<VrTherapeuticPlan | undefined>;
  createVrTherapeuticPlan(plan: InsertVrTherapeuticPlan): Promise<VrTherapeuticPlan>;
  updateVrTherapeuticPlan(id: number, updates: Partial<InsertVrTherapeuticPlan>): Promise<VrTherapeuticPlan>;
  
  getUserVrAccessibilityProfile(userId: number): Promise<VrAccessibilityProfile | undefined>;
  createVrAccessibilityProfile(profile: InsertVrAccessibilityProfile): Promise<VrAccessibilityProfile>;
  updateVrAccessibilityProfile(userId: number, updates: Partial<InsertVrAccessibilityProfile>): Promise<VrAccessibilityProfile>;

  // Advanced Emotional Intelligence methods
  getMoodForecasts(userId: number, limit?: number): Promise<MoodForecast[]>;
  createMoodForecast(forecast: InsertMoodForecast): Promise<MoodForecast>;
  updateMoodForecast(id: number, updates: Partial<MoodForecast>): Promise<MoodForecast | undefined>;
  getEmotionalContexts(userId: number, sessionId?: string, limit?: number): Promise<EmotionalContext[]>;
  createEmotionalContext(context: InsertEmotionalContext): Promise<EmotionalContext>;
  getPredictiveInsights(userId: number, isActive?: boolean): Promise<PredictiveInsight[]>;
  createPredictiveInsight(insight: InsertPredictiveInsight): Promise<PredictiveInsight>;
  updatePredictiveInsight(id: number, updates: Partial<PredictiveInsight>): Promise<PredictiveInsight | undefined>;
  getEmotionalResponseAdaptations(userId: number, limit?: number): Promise<EmotionalResponseAdaptation[]>;
  createEmotionalResponseAdaptation(adaptation: InsertEmotionalResponseAdaptation): Promise<EmotionalResponseAdaptation>;
  updateEmotionalResponseAdaptation(id: number, updates: Partial<EmotionalResponseAdaptation>): Promise<EmotionalResponseAdaptation | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getBot(id: number): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.id, id));
    return bot || undefined;
  }

  async getBotByUserId(userId: number): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.userId, userId));
    return bot || undefined;
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const [bot] = await db
      .insert(bots)
      .values({
        ...insertBot,
        name: insertBot.name || "Mirror",
        level: insertBot.level || 1,
        wordsLearned: insertBot.wordsLearned || 0,
        personalityTraits: insertBot.personalityTraits || {
          enthusiasm: 1,
          humor: 1,
          curiosity: 2
        }
      })
      .returning();
    return bot;
  }

  async updateBot(id: number, updates: Partial<Bot>): Promise<Bot | undefined> {
    const [bot] = await db
      .update(bots)
      .set(updates)
      .where(eq(bots.id, id))
      .returning();
    return bot || undefined;
  }

  async getMessages(botId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.botId, botId));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getLearnedWords(botId: number): Promise<LearnedWord[]> {
    return await db.select().from(learnedWords).where(eq(learnedWords.botId, botId));
  }

  async createOrUpdateWord(insertWord: InsertLearnedWord): Promise<LearnedWord> {
    const existingWords = await db
      .select()
      .from(learnedWords)
      .where(eq(learnedWords.word, insertWord.word.toLowerCase()));
    
    const existingWord = existingWords.find(w => w.botId === insertWord.botId);
    
    if (existingWord) {
      const [updatedWord] = await db
        .update(learnedWords)
        .set({ 
          frequency: existingWord.frequency + 1,
          context: insertWord.context || existingWord.context
        })
        .where(eq(learnedWords.id, existingWord.id))
        .returning();
      return updatedWord;
    } else {
      const [word] = await db
        .insert(learnedWords)
        .values({
          ...insertWord,
          frequency: insertWord.frequency || 1
        })
        .returning();
      return word;
    }
  }

  async getMilestones(botId: number): Promise<Milestone[]> {
    return await db.select().from(milestones).where(eq(milestones.botId, botId));
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db
      .insert(milestones)
      .values({
        ...insertMilestone,
        description: insertMilestone.description || null
      })
      .returning();
    return milestone;
  }

  async getUserMemories(userId: number): Promise<UserMemory[]> {
    return await db.select().from(userMemories).where(eq(userMemories.userId, userId));
  }

  async createUserMemory(insertMemory: InsertUserMemory): Promise<UserMemory> {
    const [memory] = await db
      .insert(userMemories)
      .values({
        userId: insertMemory.userId,
        memory: insertMemory.memory,
        category: insertMemory.category || 'conversation',
        importance: insertMemory.importance || 'medium'
      })
      .returning();
    return memory;
  }

  async getUserFacts(userId: number): Promise<UserFact[]> {
    return await db.select().from(userFacts).where(eq(userFacts.userId, userId));
  }

  async createUserFact(insertFact: InsertUserFact): Promise<UserFact> {
    const [fact] = await db
      .insert(userFacts)
      .values(insertFact)
      .returning();
    return fact;
  }

  async clearUserMemories(userId: number): Promise<void> {
    await db.delete(userMemories).where(eq(userMemories.userId, userId));
  }

  async clearUserFacts(userId: number): Promise<void> {
    await db.delete(userFacts).where(eq(userFacts.userId, userId));
  }

  async resetBotStats(userId: number): Promise<void> {
    // Reset bot to initial therapist state - knowledgeable but learning about user
    const [bot] = await db.select().from(bots).where(eq(bots.userId, userId));
    if (bot) {
      await db.update(bots)
        .set({
          level: 3,
          stage: 'Therapist',
          wordsLearned: 1000
        })
        .where(eq(bots.userId, userId));
    }
    
    // Clear learned words
    await db.delete(learnedWords).where(eq(learnedWords.botId, bot?.id || 0));
    
    // Clear milestones
    await db.delete(milestones).where(eq(milestones.botId, bot?.id || 0));
    
    // Clear messages
    await db.delete(messages).where(eq(messages.botId, bot?.id || 0));
  }

  // Mood tracking methods
  async getMoodEntries(userId: number, limitCount?: number): Promise<MoodEntry[]> {
    const query = db.select().from(moodEntries).where(eq(moodEntries.userId, userId)).orderBy(desc(moodEntries.createdAt));
    if (limitCount) {
      return await query.limit(limitCount);
    }
    return await query;
  }

  async createMoodEntry(insertMood: InsertMoodEntry): Promise<MoodEntry> {
    const [mood] = await db.insert(moodEntries).values(insertMood).returning();
    return mood;
  }

  async getEmotionalPattern(userId: number): Promise<EmotionalPattern | undefined> {
    const [pattern] = await db.select().from(emotionalPatterns)
      .where(eq(emotionalPatterns.userId, userId))
      .orderBy(desc(emotionalPatterns.updatedAt));
    return pattern || undefined;
  }

  async updateEmotionalPattern(userId: number, patternData: InsertEmotionalPattern): Promise<EmotionalPattern> {
    const existingPattern = await this.getEmotionalPattern(userId);
    
    if (existingPattern) {
      const [updated] = await db.update(emotionalPatterns)
        .set({ ...patternData, updatedAt: new Date() })
        .where(eq(emotionalPatterns.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(emotionalPatterns)
        .values({ ...patternData, userId })
        .returning();
      return created;
    }
  }

  // Crisis detection methods
  async createSafetyCheckIn(insertCheckIn: InsertSafetyCheckIn): Promise<SafetyCheckIn> {
    const [checkIn] = await db.insert(safetyCheckIns).values(insertCheckIn).returning();
    return checkIn;
  }

  async getSafetyCheckIns(userId: number, limitCount?: number): Promise<SafetyCheckIn[]> {
    const query = db.select().from(safetyCheckIns)
      .where(eq(safetyCheckIns.userId, userId))
      .orderBy(desc(safetyCheckIns.createdAt));
    
    if (limitCount) {
      return await query.limit(limitCount);
    }
    return await query;
  }

  async updateSafetyCheckIn(id: number, updates: Partial<SafetyCheckIn>): Promise<SafetyCheckIn | undefined> {
    const [updated] = await db.update(safetyCheckIns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(safetyCheckIns.id, id))
      .returning();
    return updated || undefined;
  }

  async createCrisisIntervention(insertIntervention: InsertCrisisIntervention): Promise<CrisisIntervention> {
    const [intervention] = await db.insert(crisisInterventions).values(insertIntervention).returning();
    return intervention;
  }

  async getPendingCheckIns(userId: number): Promise<SafetyCheckIn[]> {
    return await db.select().from(safetyCheckIns)
      .where(
        and(
          eq(safetyCheckIns.userId, userId),
          eq(safetyCheckIns.responseReceived, false),
          eq(safetyCheckIns.checkInRequired, true)
        )
      )
      .orderBy(desc(safetyCheckIns.createdAt));
  }

  // Journaling storage methods
  async getJournalEntries(userId: number, limitCount?: number, offset?: number): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(limitCount || 50)
      .offset(offset || 0);
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry || undefined;
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await db.insert(journalEntries).values(insertEntry).returning();
    return entry;
  }

  async updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const [updated] = await db.update(journalEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  async getJournalAnalytics(entryId: number): Promise<JournalAnalytics | undefined> {
    const [analytics] = await db.select().from(journalAnalytics)
      .where(eq(journalAnalytics.entryId, entryId));
    return analytics || undefined;
  }

  async createJournalAnalytics(insertAnalytics: InsertJournalAnalytics): Promise<JournalAnalytics> {
    const [analytics] = await db.insert(journalAnalytics).values(insertAnalytics).returning();
    return analytics;
  }

  async getJournalAnalyticsByUser(userId: number, limitCount?: number): Promise<JournalAnalytics[]> {
    return await db.select().from(journalAnalytics)
      .where(eq(journalAnalytics.userId, userId))
      .orderBy(desc(journalAnalytics.createdAt))
      .limit(limitCount || 50);
  }

  async createJournalExport(insertExport: InsertJournalExport): Promise<JournalExport> {
    const [exportData] = await db.insert(journalExports).values(insertExport).returning();
    return exportData;
  }

  async getJournalExports(userId: number): Promise<JournalExport[]> {
    return await db.select().from(journalExports)
      .where(eq(journalExports.userId, userId))
      .orderBy(desc(journalExports.createdAt));
  }

  async updateJournalExport(id: number, updates: Partial<JournalExport>): Promise<JournalExport | undefined> {
    const [updated] = await db.update(journalExports)
      .set(updates)
      .where(eq(journalExports.id, id))
      .returning();
    return updated || undefined;
  }

  // Therapist integration methods
  async getTherapistsByUser(userId: number): Promise<Therapist[]> {
    return await db.select().from(therapists)
      .where(eq(therapists.userId, userId))
      .orderBy(desc(therapists.createdAt));
  }

  async createTherapist(insertTherapist: InsertTherapist): Promise<Therapist> {
    const [therapist] = await db.insert(therapists).values(insertTherapist).returning();
    return therapist;
  }

  async getTherapistSessionsByUser(userId: number): Promise<TherapistSession[]> {
    return await db.select().from(therapistSessions)
      .where(eq(therapistSessions.userId, userId))
      .orderBy(desc(therapistSessions.scheduledAt));
  }

  async createTherapistSession(insertSession: InsertTherapistSession): Promise<TherapistSession> {
    const [session] = await db.insert(therapistSessions).values(insertSession).returning();
    return session;
  }

  async updateTherapistSession(id: number, updates: Partial<TherapistSession>): Promise<TherapistSession | undefined> {
    const [updated] = await db.update(therapistSessions)
      .set(updates)
      .where(eq(therapistSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async getTherapistSharedInsightsByUser(userId: number): Promise<TherapistSharedInsight[]> {
    return await db.select().from(therapistSharedInsights)
      .where(eq(therapistSharedInsights.userId, userId))
      .orderBy(desc(therapistSharedInsights.sharedAt));
  }

  async createTherapistSharedInsight(insertInsight: InsertTherapistSharedInsight): Promise<TherapistSharedInsight> {
    const [insight] = await db.insert(therapistSharedInsights).values(insertInsight).returning();
    return insight;
  }

  async getCollaborationSettings(userId: number): Promise<CollaborationSettings | undefined> {
    const [settings] = await db.select().from(collaborationSettings)
      .where(eq(collaborationSettings.userId, userId));
    return settings || undefined;
  }

  async createCollaborationSettings(insertSettings: InsertCollaborationSettings): Promise<CollaborationSettings> {
    const [settings] = await db.insert(collaborationSettings).values(insertSettings).returning();
    return settings;
  }

  async updateCollaborationSettings(userId: number, updates: Partial<CollaborationSettings>): Promise<CollaborationSettings | undefined> {
    const [updated] = await db.update(collaborationSettings)
      .set(updates)
      .where(eq(collaborationSettings.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Gamification methods
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
  }

  async createUserAchievement(insertAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [achievement] = await db.insert(userAchievements).values(insertAchievement).returning();
    return achievement;
  }

  async getWellnessStreak(userId: number, streakType: string): Promise<WellnessStreak | undefined> {
    const [streak] = await db.select().from(wellnessStreaks)
      .where(eq(wellnessStreaks.userId, userId))
      .where(eq(wellnessStreaks.streakType, streakType as any));
    return streak || undefined;
  }

  async createWellnessStreak(insertStreak: InsertWellnessStreak): Promise<WellnessStreak> {
    const [streak] = await db.insert(wellnessStreaks).values(insertStreak).returning();
    return streak;
  }

  async updateWellnessStreak(id: number, updates: Partial<WellnessStreak>): Promise<WellnessStreak | undefined> {
    const [updated] = await db.update(wellnessStreaks)
      .set(updates)
      .where(eq(wellnessStreaks.id, id))
      .returning();
    return updated || undefined;
  }

  async updateDailyActivity(userId: number, date: Date, activityType: string): Promise<void> {
    const dateString = date.toISOString().split('T')[0];
    const existingActivity = await db.select().from(dailyActivities)
      .where(eq(dailyActivities.userId, userId))
      .where(sql`DATE(activity_date) = ${dateString}`)
      .limit(1);

    const updates: any = { [activityType]: true };
    
    if (existingActivity.length > 0) {
      const activity = existingActivity[0];
      const totalActivities = [
        updates.checkedIn || activity.checkedIn,
        updates.journalEntry || activity.journalEntry,
        updates.moodTracked || activity.moodTracked,
        updates.chatSession || activity.chatSession,
        updates.goalProgress || activity.goalProgress
      ].filter(Boolean).length;

      await db.update(dailyActivities)
        .set({ ...updates, totalActivities })
        .where(eq(dailyActivities.id, activity.id));
    } else {
      await db.insert(dailyActivities).values({
        userId,
        activityDate: date,
        ...updates,
        totalActivities: 1
      });
    }
  }

  async getDailyActivitiesHistory(userId: number, limit = 30): Promise<DailyActivity[]> {
    return await db.select().from(dailyActivities)
      .where(eq(dailyActivities.userId, userId))
      .orderBy(desc(dailyActivities.activityDate))
      .limit(limit);
  }

  async getDailyCheckinCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(dailyActivities)
      .where(eq(dailyActivities.userId, userId))
      .where(eq(dailyActivities.checkedIn, true));
    return result[0]?.count || 0;
  }

  async getJournalEntryCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));
    return result[0]?.count || 0;
  }

  async getMoodEntryCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId));
    return result[0]?.count || 0;
  }

  async getChatSessionCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(dailyActivities)
      .where(eq(dailyActivities.userId, userId))
      .where(eq(dailyActivities.chatSession, true));
    return result[0]?.count || 0;
  }

  async getGoalProgressCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(dailyActivities)
      .where(eq(dailyActivities.userId, userId))
      .where(eq(dailyActivities.goalProgress, true));
    return result[0]?.count || 0;
  }

  // Community and Peer Support methods implementation
  async getSupportForums(): Promise<SupportForum[]> {
    return await db.select().from(supportForums).orderBy(desc(supportForums.createdAt));
  }

  async getSupportForum(id: number): Promise<SupportForum | undefined> {
    const [forum] = await db.select().from(supportForums).where(eq(supportForums.id, id));
    return forum || undefined;
  }

  async createSupportForum(forum: InsertSupportForum): Promise<SupportForum> {
    const [newForum] = await db.insert(supportForums).values(forum).returning();
    return newForum;
  }

  async getForumPosts(forumId: number, limit = 20): Promise<ForumPost[]> {
    return await db.select().from(forumPosts)
      .where(eq(forumPosts.forumId, forumId))
      .orderBy(desc(forumPosts.createdAt))
      .limit(limit);
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return post || undefined;
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    return newPost;
  }

  async updateForumPost(id: number, updates: Partial<ForumPost>): Promise<ForumPost | undefined> {
    const [updatedPost] = await db.update(forumPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(forumPosts.id, id))
      .returning();
    return updatedPost || undefined;
  }

  async getForumReplies(postId: number): Promise<ForumReply[]> {
    return await db.select().from(forumReplies)
      .where(eq(forumReplies.postId, postId))
      .orderBy(forumReplies.createdAt);
  }

  async createForumReply(reply: InsertForumReply): Promise<ForumReply> {
    const [newReply] = await db.insert(forumReplies).values(reply).returning();
    return newReply;
  }

  async updateForumReply(id: number, updates: Partial<ForumReply>): Promise<ForumReply | undefined> {
    const [updatedReply] = await db.update(forumReplies)
      .set(updates)
      .where(eq(forumReplies.id, id))
      .returning();
    return updatedReply || undefined;
  }

  async getPeerCheckInRequests(status?: string): Promise<PeerCheckIn[]> {
    const query = db.select().from(peerCheckIns);
    if (status) {
      return await query.where(eq(peerCheckIns.status, status)).orderBy(desc(peerCheckIns.createdAt));
    }
    return await query.orderBy(desc(peerCheckIns.createdAt));
  }

  async getUserPeerCheckIns(userId: number): Promise<PeerCheckIn[]> {
    return await db.select().from(peerCheckIns)
      .where(eq(peerCheckIns.requesterId, userId))
      .orderBy(desc(peerCheckIns.createdAt));
  }

  async createPeerCheckIn(checkIn: InsertPeerCheckIn): Promise<PeerCheckIn> {
    const [newCheckIn] = await db.insert(peerCheckIns).values(checkIn).returning();
    return newCheckIn;
  }

  async updatePeerCheckIn(id: number, updates: Partial<PeerCheckIn>): Promise<PeerCheckIn | undefined> {
    const [updatedCheckIn] = await db.update(peerCheckIns)
      .set(updates)
      .where(eq(peerCheckIns.id, id))
      .returning();
    return updatedCheckIn || undefined;
  }

  async getPeerSessions(userId: number): Promise<PeerSession[]> {
    return await db.select().from(peerSessions)
      .where(
        sql`${peerSessions.participant1Id} = ${userId} OR ${peerSessions.participant2Id} = ${userId}`
      )
      .orderBy(desc(peerSessions.createdAt));
  }

  async createPeerSession(session: InsertPeerSession): Promise<PeerSession> {
    const [newSession] = await db.insert(peerSessions).values(session).returning();
    return newSession;
  }

  async updatePeerSession(id: number, updates: Partial<PeerSession>): Promise<PeerSession | undefined> {
    const [updatedSession] = await db.update(peerSessions)
      .set(updates)
      .where(eq(peerSessions.id, id))
      .returning();
    return updatedSession || undefined;
  }

  async createCommunityModeration(moderation: InsertCommunityModeration): Promise<CommunityModeration> {
    const [newModeration] = await db.insert(communityModerations).values(moderation).returning();
    return newModeration;
  }

  // Adaptive Learning and Personalization implementations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db.insert(userPreferences).values(preferences).returning();
    return newPreferences;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const [updatedPreferences] = await db.update(userPreferences)
      .set(updates)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updatedPreferences || undefined;
  }

  async getLatestAdaptationInsights(userId: number): Promise<AdaptationInsight | undefined> {
    const [insight] = await db.select().from(adaptationInsights)
      .where(eq(adaptationInsights.userId, userId))
      .orderBy(desc(adaptationInsights.createdAt))
      .limit(1);
    return insight || undefined;
  }

  async createAdaptationInsight(insight: InsertAdaptationInsight): Promise<AdaptationInsight> {
    const [newInsight] = await db.insert(adaptationInsights).values(insight).returning();
    return newInsight;
  }

  async getWellnessRecommendations(userId: number, limit: number = 10): Promise<WellnessRecommendation[]> {
    return await db.select().from(wellnessRecommendations)
      .where(eq(wellnessRecommendations.userId, userId))
      .orderBy(desc(wellnessRecommendations.createdAt))
      .limit(limit);
  }

  async createWellnessRecommendation(recommendation: InsertWellnessRecommendation): Promise<WellnessRecommendation> {
    const [newRecommendation] = await db.insert(wellnessRecommendations).values(recommendation).returning();
    return newRecommendation;
  }

  async markRecommendationUsed(recommendationId: number): Promise<void> {
    await db.update(wellnessRecommendations)
      .set({ wasUsed: true })
      .where(eq(wellnessRecommendations.id, recommendationId));
  }

  async rateRecommendation(recommendationId: number, rating: number): Promise<void> {
    await db.update(wellnessRecommendations)
      .set({ userRating: rating })
      .where(eq(wellnessRecommendations.id, recommendationId));
  }

  // Enhanced Gamification Storage Methods

  // Wellness Points Management
  async getUserWellnessPoints(userId: number): Promise<UserWellnessPoints | undefined> {
    const [points] = await db.select().from(userWellnessPoints)
      .where(eq(userWellnessPoints.userId, userId))
      .limit(1);
    return points || undefined;
  }

  async createUserWellnessPoints(pointsData: InsertUserWellnessPoints): Promise<UserWellnessPoints> {
    const [newPoints] = await db.insert(userWellnessPoints).values(pointsData).returning();
    return newPoints;
  }

  async updateUserWellnessPoints(userId: number, updates: Partial<UserWellnessPoints>): Promise<UserWellnessPoints | undefined> {
    const [updatedPoints] = await db.update(userWellnessPoints)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userWellnessPoints.userId, userId))
      .returning();
    return updatedPoints || undefined;
  }

  // Rewards Shop Management
  async getRewardsShop(): Promise<RewardsShop[]> {
    return await db.select().from(rewardsShop)
      .where(eq(rewardsShop.isAvailable, true))
      .orderBy(rewardsShop.category, rewardsShop.pointsCost);
  }

  async getRewardById(rewardId: number): Promise<RewardsShop | undefined> {
    const [reward] = await db.select().from(rewardsShop)
      .where(eq(rewardsShop.id, rewardId))
      .limit(1);
    return reward || undefined;
  }

  async createReward(rewardData: InsertRewardsShop): Promise<RewardsShop> {
    const [newReward] = await db.insert(rewardsShop).values(rewardData).returning();
    return newReward;
  }

  async createUserReward(userRewardData: InsertUserRewards): Promise<UserRewards> {
    const [newUserReward] = await db.insert(userRewards).values(userRewardData).returning();
    return newUserReward;
  }

  async getUserRewards(userId: number): Promise<UserRewards[]> {
    return await db.select().from(userRewards)
      .where(eq(userRewards.userId, userId))
      .orderBy(desc(userRewards.purchasedAt));
  }

  async updateRewardPurchaseCount(rewardId: number): Promise<void> {
    await db.update(rewardsShop)
      .set({ 
        purchaseCount: sql`${rewardsShop.purchaseCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(rewardsShop.id, rewardId));
  }

  // Community Challenges Management
  async getActiveCommunityChallenge(currentDate: Date): Promise<CommunityChallenge[]> {
    return await db.select().from(communityChallengess)
      .where(
        and(
          eq(communityChallengess.isActive, true),
          lte(communityChallengess.startDate, currentDate),
          gte(communityChallengess.endDate, currentDate)
        )
      )
      .orderBy(desc(communityChallengess.isFeatured), communityChallengess.startDate);
  }

  async getCommunityChallenge(challengeId: number): Promise<CommunityChallenge | undefined> {
    const [challenge] = await db.select().from(communityChallengess)
      .where(eq(communityChallengess.id, challengeId))
      .limit(1);
    return challenge || undefined;
  }

  async createCommunityChallenge(challengeData: InsertCommunityChallenge): Promise<CommunityChallenge> {
    const [newChallenge] = await db.insert(communityChallengess).values(challengeData).returning();
    return newChallenge;
  }

  async getChallengeParticipant(challengeId: number, userId: number): Promise<ChallengeParticipant | undefined> {
    const [participant] = await db.select().from(challengeParticipants)
      .where(
        and(
          eq(challengeParticipants.challengeId, challengeId),
          eq(challengeParticipants.userId, userId)
        )
      )
      .limit(1);
    return participant || undefined;
  }

  async createChallengeParticipant(participantData: InsertChallengeParticipant): Promise<ChallengeParticipant> {
    const [newParticipant] = await db.insert(challengeParticipants).values(participantData).returning();
    return newParticipant;
  }

  async updateChallengeParticipantCount(challengeId: number, newCount: number): Promise<void> {
    await db.update(communityChallengess)
      .set({ 
        participantCount: newCount,
        updatedAt: new Date()
      })
      .where(eq(communityChallengess.id, challengeId));
  }

  async updateChallengeParticipantProgress(challengeId: number, userId: number, updates: Partial<ChallengeParticipant>): Promise<ChallengeParticipant | undefined> {
    const [updatedParticipant] = await db.update(challengeParticipants)
      .set(updates)
      .where(
        and(
          eq(challengeParticipants.challengeId, challengeId),
          eq(challengeParticipants.userId, userId)
        )
      )
      .returning();
    return updatedParticipant || undefined;
  }

  async createChallengeActivity(activityData: InsertChallengeActivity): Promise<ChallengeActivity> {
    const [newActivity] = await db.insert(challengeActivities).values(activityData).returning();
    return newActivity;
  }

  async getChallengeActivities(challengeId: number, userId: number): Promise<ChallengeActivity[]> {
    return await db.select().from(challengeActivities)
      .where(
        and(
          eq(challengeActivities.challengeId, challengeId),
          eq(challengeActivities.userId, userId)
        )
      )
      .orderBy(challengeActivities.activityDay);
  }

  // Emotional Achievements Management
  async getEmotionalAchievements(): Promise<EmotionalAchievement[]> {
    return await db.select().from(emotionalAchievements)
      .orderBy(emotionalAchievements.category, emotionalAchievements.difficultyLevel);
  }

  async getEmotionalAchievement(achievementId: string): Promise<EmotionalAchievement | undefined> {
    const [achievement] = await db.select().from(emotionalAchievements)
      .where(eq(emotionalAchievements.achievementId, achievementId))
      .limit(1);
    return achievement || undefined;
  }

  async createEmotionalAchievement(achievementData: InsertEmotionalAchievement): Promise<EmotionalAchievement> {
    const [newAchievement] = await db.insert(emotionalAchievements).values(achievementData).returning();
    return newAchievement;
  }

  async getUserEmotionalAchievements(userId: number, daysBack?: number): Promise<UserEmotionalAchievement[]> {
    let query = db.select().from(userEmotionalAchievements)
      .where(eq(userEmotionalAchievements.userId, userId));

    if (daysBack) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysBack);
      query = query.where(
        and(
          eq(userEmotionalAchievements.userId, userId),
          gte(userEmotionalAchievements.unlockedAt, dateThreshold)
        )
      );
    }

    return await query.orderBy(desc(userEmotionalAchievements.unlockedAt));
  }

  async getUserEmotionalAchievement(userId: number, achievementId: string): Promise<UserEmotionalAchievement | undefined> {
    const [userAchievement] = await db.select().from(userEmotionalAchievements)
      .where(
        and(
          eq(userEmotionalAchievements.userId, userId),
          eq(userEmotionalAchievements.achievementId, achievementId)
        )
      )
      .limit(1);
    return userAchievement || undefined;
  }

  async createUserEmotionalAchievement(achievementData: InsertUserEmotionalAchievement): Promise<UserEmotionalAchievement> {
    const [newUserAchievement] = await db.insert(userEmotionalAchievements).values(achievementData).returning();
    return newUserAchievement;
  }

  async markEmotionalAchievementViewed(userId: number, achievementId: string): Promise<void> {
    await db.update(userEmotionalAchievements)
      .set({ isViewed: true })
      .where(
        and(
          eq(userEmotionalAchievements.userId, userId),
          eq(userEmotionalAchievements.achievementId, achievementId)
        )
      );
  }

  // Points History Management
  async createPointsHistory(historyData: InsertPointsHistory): Promise<PointsHistory> {
    const [newHistory] = await db.insert(pointsHistory).values(historyData).returning();
    return newHistory;
  }

  async getPointsHistory(userId: number, limit: number = 50): Promise<PointsHistory[]> {
    return await db.select().from(pointsHistory)
      .where(eq(pointsHistory.userId, userId))
      .orderBy(desc(pointsHistory.createdAt))
      .limit(limit);
  }

  async createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback> {
    const [newFeedback] = await db.insert(userFeedback).values(feedback).returning();
    return newFeedback;
  }

  async getConversationPatterns(userId: number): Promise<ConversationPattern[]> {
    return await db.select().from(conversationPatterns)
      .where(eq(conversationPatterns.userId, userId))
      .orderBy(desc(conversationPatterns.lastUsed));
  }

  async createConversationPattern(pattern: InsertConversationPattern): Promise<ConversationPattern> {
    const [newPattern] = await db.insert(conversationPatterns).values(pattern).returning();
    return newPattern;
  }

  async getMonthlyReport(userId: number, reportMonth: string): Promise<MonthlyReport | undefined> {
    const [report] = await db.select().from(monthlyReports)
      .where(and(eq(monthlyReports.userId, userId), eq(monthlyReports.reportMonth, reportMonth)));
    return report || undefined;
  }

  async saveMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport> {
    const [newReport] = await db.insert(monthlyReports).values(report).returning();
    return newReport;
  }

  async getMonthlyReportById(reportId: number): Promise<MonthlyReport | undefined> {
    const [report] = await db.select().from(monthlyReports).where(eq(monthlyReports.id, reportId));
    return report || undefined;
  }

  // Wearable Device Integration methods
  async getWearableDevices(userId: number): Promise<WearableDevice[]> {
    return await db.select().from(wearableDevices).where(eq(wearableDevices.userId, userId));
  }

  async createWearableDevice(device: InsertWearableDevice): Promise<WearableDevice> {
    const [newDevice] = await db.insert(wearableDevices).values(device).returning();
    return newDevice;
  }

  async updateWearableDevice(deviceId: number, updates: Partial<WearableDevice>): Promise<WearableDevice | undefined> {
    const [updatedDevice] = await db
      .update(wearableDevices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(wearableDevices.id, deviceId))
      .returning();
    return updatedDevice || undefined;
  }

  async deleteWearableDevice(deviceId: number): Promise<void> {
    await db.delete(wearableDevices).where(eq(wearableDevices.id, deviceId));
  }

  async getHealthMetrics(userId: number, metricType?: string, limit: number = 100): Promise<HealthMetric[]> {
    let query = db.select().from(healthMetrics).where(eq(healthMetrics.userId, userId));
    
    if (metricType) {
      query = query.where(eq(healthMetrics.metricType, metricType));
    }
    
    return await query.orderBy(desc(healthMetrics.timestamp)).limit(limit);
  }

  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const [newMetric] = await db.insert(healthMetrics).values(metric).returning();
    return newMetric;
  }

  async getHealthCorrelations(userId: number): Promise<HealthCorrelation[]> {
    return await db.select().from(healthCorrelations)
      .where(eq(healthCorrelations.userId, userId))
      .orderBy(desc(healthCorrelations.analysisDate));
  }

  async createHealthCorrelation(correlation: InsertHealthCorrelation): Promise<HealthCorrelation> {
    const [newCorrelation] = await db.insert(healthCorrelations).values(correlation).returning();
    return newCorrelation;
  }

  async createSyncLog(log: InsertSyncLog): Promise<SyncLog> {
    const [newLog] = await db.insert(syncLogs).values(log).returning();
    return newLog;
  }

  async getRecentSyncLogs(deviceId: number, limit: number = 10): Promise<SyncLog[]> {
    return await db.select().from(syncLogs)
      .where(eq(syncLogs.deviceId, deviceId))
      .orderBy(desc(syncLogs.createdAt))
      .limit(limit);
  }

  // VR/AR Therapeutic Experiences implementation
  async getVrEnvironments(category?: string): Promise<VrEnvironment[]> {
    let query = db.select().from(vrEnvironments).where(eq(vrEnvironments.isActive, true));
    
    if (category) {
      query = query.where(eq(vrEnvironments.environmentType, category));
    }
    
    return await query.orderBy(vrEnvironments.name);
  }

  async getVrEnvironment(id: number): Promise<VrEnvironment | undefined> {
    const [environment] = await db.select().from(vrEnvironments).where(eq(vrEnvironments.id, id));
    return environment || undefined;
  }

  async createVrEnvironment(environment: InsertVrEnvironment): Promise<VrEnvironment> {
    const [newEnvironment] = await db.insert(vrEnvironments).values(environment).returning();
    return newEnvironment;
  }

  async updateVrEnvironment(id: number, updates: Partial<InsertVrEnvironment>): Promise<VrEnvironment> {
    const [updatedEnvironment] = await db.update(vrEnvironments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vrEnvironments.id, id))
      .returning();
    return updatedEnvironment;
  }

  async getUserVrSessions(userId: number, limit: number = 50): Promise<VrSession[]> {
    return await db.select().from(vrSessions)
      .where(eq(vrSessions.userId, userId))
      .orderBy(desc(vrSessions.createdAt))
      .limit(limit);
  }

  async getVrSession(id: number): Promise<VrSession | undefined> {
    const [session] = await db.select().from(vrSessions).where(eq(vrSessions.id, id));
    return session || undefined;
  }

  async createVrSession(session: InsertVrSession): Promise<VrSession> {
    const [newSession] = await db.insert(vrSessions).values(session).returning();
    return newSession;
  }

  async updateVrSession(id: number, updates: Partial<InsertVrSession>): Promise<VrSession> {
    const [updatedSession] = await db.update(vrSessions)
      .set(updates)
      .where(eq(vrSessions.id, id))
      .returning();
    return updatedSession;
  }

  async getUserVrProgress(userId: number, environmentId?: number): Promise<VrProgressTracking[]> {
    let query = db.select().from(vrProgressTracking).where(eq(vrProgressTracking.userId, userId));
    
    if (environmentId) {
      query = query.where(eq(vrProgressTracking.environmentId, environmentId));
    }
    
    return await query.orderBy(desc(vrProgressTracking.updatedAt));
  }

  async getVrProgress(userId: number, environmentId: number): Promise<VrProgressTracking | undefined> {
    const [progress] = await db.select().from(vrProgressTracking)
      .where(and(
        eq(vrProgressTracking.userId, userId),
        eq(vrProgressTracking.environmentId, environmentId)
      ));
    return progress || undefined;
  }

  async createVrProgress(progress: InsertVrProgressTracking): Promise<VrProgressTracking> {
    const [newProgress] = await db.insert(vrProgressTracking).values(progress).returning();
    return newProgress;
  }

  async updateVrProgress(userId: number, environmentId: number, updates: Partial<InsertVrProgressTracking>): Promise<VrProgressTracking> {
    const [updatedProgress] = await db.update(vrProgressTracking)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(vrProgressTracking.userId, userId),
        eq(vrProgressTracking.environmentId, environmentId)
      ))
      .returning();
    return updatedProgress;
  }

  async getUserVrTherapeuticPlans(userId: number): Promise<VrTherapeuticPlan[]> {
    return await db.select().from(vrTherapeuticPlans)
      .where(eq(vrTherapeuticPlans.userId, userId))
      .orderBy(desc(vrTherapeuticPlans.updatedAt));
  }

  async getVrTherapeuticPlan(id: number): Promise<VrTherapeuticPlan | undefined> {
    const [plan] = await db.select().from(vrTherapeuticPlans).where(eq(vrTherapeuticPlans.id, id));
    return plan || undefined;
  }

  async createVrTherapeuticPlan(plan: InsertVrTherapeuticPlan): Promise<VrTherapeuticPlan> {
    const [newPlan] = await db.insert(vrTherapeuticPlans).values(plan).returning();
    return newPlan;
  }

  async updateVrTherapeuticPlan(id: number, updates: Partial<InsertVrTherapeuticPlan>): Promise<VrTherapeuticPlan> {
    const [updatedPlan] = await db.update(vrTherapeuticPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vrTherapeuticPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async getUserVrAccessibilityProfile(userId: number): Promise<VrAccessibilityProfile | undefined> {
    const [profile] = await db.select().from(vrAccessibilityProfiles)
      .where(eq(vrAccessibilityProfiles.userId, userId));
    return profile || undefined;
  }

  async createVrAccessibilityProfile(profile: InsertVrAccessibilityProfile): Promise<VrAccessibilityProfile> {
    const [newProfile] = await db.insert(vrAccessibilityProfiles).values(profile).returning();
    return newProfile;
  }

  async updateVrAccessibilityProfile(userId: number, updates: Partial<InsertVrAccessibilityProfile>): Promise<VrAccessibilityProfile> {
    const [updatedProfile] = await db.update(vrAccessibilityProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vrAccessibilityProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Advanced Emotional Intelligence implementation methods
  async getMoodForecasts(userId: number, limit: number = 10): Promise<MoodForecast[]> {
    return await db.select().from(moodForecasts)
      .where(eq(moodForecasts.userId, userId))
      .orderBy(desc(moodForecasts.createdAt))
      .limit(limit);
  }

  async createMoodForecast(forecast: InsertMoodForecast): Promise<MoodForecast> {
    const [newForecast] = await db.insert(moodForecasts).values(forecast).returning();
    return newForecast;
  }

  async updateMoodForecast(id: number, updates: Partial<MoodForecast>): Promise<MoodForecast | undefined> {
    const [updatedForecast] = await db.update(moodForecasts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(moodForecasts.id, id))
      .returning();
    return updatedForecast || undefined;
  }

  async getEmotionalContexts(userId: number, sessionId?: string, limit: number = 20): Promise<EmotionalContext[]> {
    let query = db.select().from(emotionalContexts)
      .where(eq(emotionalContexts.userId, userId))
      .orderBy(desc(emotionalContexts.createdAt))
      .limit(limit);
    
    if (sessionId) {
      query = db.select().from(emotionalContexts)
        .where(and(eq(emotionalContexts.userId, userId), eq(emotionalContexts.sessionId, sessionId)))
        .orderBy(desc(emotionalContexts.createdAt))
        .limit(limit);
    }
    
    return await query;
  }

  async createEmotionalContext(context: InsertEmotionalContext): Promise<EmotionalContext> {
    const [newContext] = await db.insert(emotionalContexts).values(context).returning();
    return newContext;
  }

  async getPredictiveInsights(userId: number, isActive: boolean = true): Promise<PredictiveInsight[]> {
    return await db.select().from(predictiveInsights)
      .where(and(
        eq(predictiveInsights.userId, userId),
        eq(predictiveInsights.isActive, isActive)
      ))
      .orderBy(desc(predictiveInsights.createdAt));
  }

  async createPredictiveInsight(insight: InsertPredictiveInsight): Promise<PredictiveInsight> {
    const [newInsight] = await db.insert(predictiveInsights).values(insight).returning();
    return newInsight;
  }

  async updatePredictiveInsight(id: number, updates: Partial<PredictiveInsight>): Promise<PredictiveInsight | undefined> {
    const [updatedInsight] = await db.update(predictiveInsights)
      .set(updates)
      .where(eq(predictiveInsights.id, id))
      .returning();
    return updatedInsight || undefined;
  }

  async getEmotionalResponseAdaptations(userId: number, limit: number = 50): Promise<EmotionalResponseAdaptation[]> {
    return await db.select().from(emotionalResponseAdaptations)
      .where(eq(emotionalResponseAdaptations.userId, userId))
      .orderBy(desc(emotionalResponseAdaptations.createdAt))
      .limit(limit);
  }

  async createEmotionalResponseAdaptation(adaptation: InsertEmotionalResponseAdaptation): Promise<EmotionalResponseAdaptation> {
    const [newAdaptation] = await db.insert(emotionalResponseAdaptations).values(adaptation).returning();
    return newAdaptation;
  }

  async updateEmotionalResponseAdaptation(id: number, updates: Partial<EmotionalResponseAdaptation>): Promise<EmotionalResponseAdaptation | undefined> {
    const [updatedAdaptation] = await db.update(emotionalResponseAdaptations)
      .set(updates)
      .where(eq(emotionalResponseAdaptations.id, id))
      .returning();
    return updatedAdaptation || undefined;
  }

  // AI Performance Monitoring Methods
  async createAiPerformanceMetric(metric: InsertAiPerformanceMetric): Promise<AiPerformanceMetric> {
    const [newMetric] = await db.insert(aiPerformanceMetrics).values(metric).returning();
    return newMetric;
  }

  async getAiPerformanceMetrics(userId?: number, metricType?: string, timeframe?: { start: Date; end: Date }, limit: number = 100): Promise<AiPerformanceMetric[]> {
    let query = db.select().from(aiPerformanceMetrics)
      .orderBy(desc(aiPerformanceMetrics.timestamp))
      .limit(limit);

    if (userId) {
      query = query.where(eq(aiPerformanceMetrics.userId, userId));
    }
    if (metricType) {
      query = query.where(eq(aiPerformanceMetrics.metricType, metricType));
    }
    if (timeframe) {
      query = query.where(
        and(
          gte(aiPerformanceMetrics.timestamp, timeframe.start),
          lte(aiPerformanceMetrics.timestamp, timeframe.end)
        )
      );
    }

    return await query;
  }

  async createAiResponseAnalysis(analysis: InsertAiResponseAnalysis): Promise<AiResponseAnalysis> {
    const [newAnalysis] = await db.insert(aiResponseAnalysis).values(analysis).returning();
    return newAnalysis;
  }

  async getAiResponseAnalyses(userId?: number, flaggedOnly?: boolean, limit: number = 50): Promise<AiResponseAnalysis[]> {
    let query = db.select().from(aiResponseAnalysis)
      .orderBy(desc(aiResponseAnalysis.createdAt))
      .limit(limit);

    if (userId) {
      query = query.where(eq(aiResponseAnalysis.userId, userId));
    }
    if (flaggedOnly) {
      query = query.where(eq(aiResponseAnalysis.flaggedForReview, true));
    }

    return await query;
  }

  async updateAiResponseAnalysis(id: number, updates: Partial<AiResponseAnalysis>): Promise<AiResponseAnalysis | undefined> {
    const [updatedAnalysis] = await db.update(aiResponseAnalysis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiResponseAnalysis.id, id))
      .returning();
    return updatedAnalysis || undefined;
  }

  async createCrisisDetectionLog(log: InsertCrisisDetectionLog): Promise<CrisisDetectionLog> {
    const [newLog] = await db.insert(crisisDetectionLogs).values(log).returning();
    return newLog;
  }

  async getCrisisDetectionLogs(userId?: number, riskLevel?: string, reviewed?: boolean, limit: number = 100): Promise<CrisisDetectionLog[]> {
    let query = db.select().from(crisisDetectionLogs)
      .orderBy(desc(crisisDetectionLogs.detectedAt))
      .limit(limit);

    if (userId) {
      query = query.where(eq(crisisDetectionLogs.userId, userId));
    }
    if (riskLevel) {
      query = query.where(eq(crisisDetectionLogs.detectedRiskLevel, riskLevel));
    }
    if (reviewed !== undefined) {
      if (reviewed) {
        query = query.where(isNotNull(crisisDetectionLogs.reviewedAt));
      } else {
        query = query.where(isNull(crisisDetectionLogs.reviewedAt));
      }
    }

    return await query;
  }

  async updateCrisisDetectionLog(id: number, updates: Partial<CrisisDetectionLog>): Promise<CrisisDetectionLog | undefined> {
    const [updatedLog] = await db.update(crisisDetectionLogs)
      .set({ ...updates, reviewedAt: updates.reviewedBy ? new Date() : undefined })
      .where(eq(crisisDetectionLogs.id, id))
      .returning();
    return updatedLog || undefined;
  }

  async createTherapeuticEffectivenessTracking(tracking: InsertTherapeuticEffectivenessTracking): Promise<TherapeuticEffectivenessTracking> {
    const [newTracking] = await db.insert(therapeuticEffectivenessTracking).values(tracking).returning();
    return newTracking;
  }

  async getTherapeuticEffectivenessTracking(userId?: number, interventionType?: string, limit: number = 50): Promise<TherapeuticEffectivenessTracking[]> {
    let query = db.select().from(therapeuticEffectivenessTracking)
      .orderBy(desc(therapeuticEffectivenessTracking.measuredAt))
      .limit(limit);

    if (userId) {
      query = query.where(eq(therapeuticEffectivenessTracking.userId, userId));
    }
    if (interventionType) {
      query = query.where(eq(therapeuticEffectivenessTracking.interventionType, interventionType));
    }

    return await query;
  }

  async updateTherapeuticEffectivenessTracking(id: number, updates: Partial<TherapeuticEffectivenessTracking>): Promise<TherapeuticEffectivenessTracking | undefined> {
    const [updatedTracking] = await db.update(therapeuticEffectivenessTracking)
      .set(updates)
      .where(eq(therapeuticEffectivenessTracking.id, id))
      .returning();
    return updatedTracking || undefined;
  }

  async createSystemPerformanceDashboard(dashboard: InsertSystemPerformanceDashboard): Promise<SystemPerformanceDashboard> {
    const [newDashboard] = await db.insert(systemPerformanceDashboard).values(dashboard).returning();
    return newDashboard;
  }

  async getSystemPerformanceDashboard(metricPeriod?: string, limit: number = 30): Promise<SystemPerformanceDashboard[]> {
    let query = db.select().from(systemPerformanceDashboard)
      .orderBy(desc(systemPerformanceDashboard.periodStart))
      .limit(limit);

    if (metricPeriod) {
      query = query.where(eq(systemPerformanceDashboard.metricPeriod, metricPeriod));
    }

    return await query;
  }

  async getLatestSystemPerformance(metricPeriod: string = 'daily'): Promise<SystemPerformanceDashboard | undefined> {
    const [latest] = await db.select().from(systemPerformanceDashboard)
      .where(eq(systemPerformanceDashboard.metricPeriod, metricPeriod))
      .orderBy(desc(systemPerformanceDashboard.periodStart))
      .limit(1);
    return latest || undefined;
  }

  // AI Performance Analytics Methods
  async getAiPerformanceOverview(): Promise<{
    totalResponses: number;
    averageResponseQuality: number;
    averageTherapeuticEffectiveness: number;
    crisisDetectionAccuracy: number;
    falsePositiveRate: number;
    userSatisfactionAverage: number;
    averageResponseTime: number;
  }> {
    const responseQualityMetrics = await db.select({
      avg: avg(aiPerformanceMetrics.metricValue),
      count: count()
    }).from(aiPerformanceMetrics)
      .where(eq(aiPerformanceMetrics.metricType, 'response_quality'));

    const therapeuticEffectivenessMetrics = await db.select({
      avg: avg(aiPerformanceMetrics.metricValue)
    }).from(aiPerformanceMetrics)
      .where(eq(aiPerformanceMetrics.metricType, 'therapeutic_effectiveness'));

    const crisisDetectionMetrics = await db.select({
      avg: avg(aiPerformanceMetrics.metricValue)
    }).from(aiPerformanceMetrics)
      .where(eq(aiPerformanceMetrics.metricType, 'crisis_detection'));

    const userSatisfactionMetrics = await db.select({
      avg: avg(aiResponseAnalysis.userRating)
    }).from(aiResponseAnalysis)
      .where(isNotNull(aiResponseAnalysis.userRating));

    const responseTimeMetrics = await db.select({
      avg: avg(aiPerformanceMetrics.responseTime)
    }).from(aiPerformanceMetrics)
      .where(isNotNull(aiPerformanceMetrics.responseTime));

    const falsePositiveCount = await db.select({
      count: count()
    }).from(crisisDetectionLogs)
      .where(eq(crisisDetectionLogs.falsePositive, true));

    const totalCrisisDetections = await db.select({
      count: count()
    }).from(crisisDetectionLogs);

    return {
      totalResponses: responseQualityMetrics[0]?.count || 0,
      averageResponseQuality: Number(responseQualityMetrics[0]?.avg || 0),
      averageTherapeuticEffectiveness: Number(therapeuticEffectivenessMetrics[0]?.avg || 0),
      crisisDetectionAccuracy: Number(crisisDetectionMetrics[0]?.avg || 0),
      falsePositiveRate: totalCrisisDetections[0]?.count ? 
        (falsePositiveCount[0]?.count || 0) / totalCrisisDetections[0].count : 0,
      userSatisfactionAverage: Number(userSatisfactionMetrics[0]?.avg || 0),
      averageResponseTime: Number(responseTimeMetrics[0]?.avg || 0)
    };
  }

  // CRITICAL SEMANTIC MEMORY METHODS IMPLEMENTATION - MEMORY SYSTEM FIX
  async getRecentSemanticMemories(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const { semanticMemories } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const memories = await db.select()
        .from(semanticMemories)
        .where(eq(semanticMemories.userId, userId))
        .orderBy(desc(semanticMemories.createdAt))
        .limit(limit);
      
      console.log(`📚 Retrieved ${memories.length} semantic memories for user ${userId}`);
      return memories;
    } catch (error) {
      console.error('Error retrieving semantic memories:', error);
      return [];
    }
  }

  async createSemanticMemory(data: any): Promise<any> {
    try {
      const { semanticMemories } = await import('@shared/schema');
      
      const memoryData = {
        userId: data.userId,
        memoryType: data.memoryType || 'conversation',
        content: data.content,
        semanticTags: data.semanticTags || [],
        emotionalContext: data.emotionalContext,
        temporalContext: data.temporalContext,
        relatedTopics: data.relatedTopics || [],
        confidence: data.confidence || '0.85',
        accessCount: 0,
        sourceConversationId: data.sourceConversationId,
        isActiveMemory: true,
        createdAt: new Date()
      };
      
      const [memory] = await db.insert(semanticMemories).values(memoryData).returning();
      console.log(`💾 Created semantic memory: ${memory.id}`);
      return memory;
    } catch (error) {
      console.error('Error creating semantic memory:', error);
      throw error;
    }
  }

  async searchSemanticMemories(userId: number, searchTerms: string[], limit: number = 5): Promise<any[]> {
    try {
      const { semanticMemories } = await import('@shared/schema');
      const { eq, and, or, ilike, desc } = await import('drizzle-orm');
      
      if (!searchTerms || searchTerms.length === 0) {
        return [];
      }
      
      const searchConditions = searchTerms.map(term => 
        or(
          ilike(semanticMemories.content, `%${term}%`),
          ilike(semanticMemories.emotionalContext, `%${term}%`)
        )
      );
      
      const memories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true),
          or(...searchConditions)
        ))
        .orderBy(desc(semanticMemories.lastAccessedAt), desc(semanticMemories.createdAt))
        .limit(limit);
      
      console.log(`🔍 Found ${memories.length} semantic memories for search: ${searchTerms.join(', ')}`);
      return memories;
    } catch (error) {
      console.error('Error searching semantic memories:', error);
      return [];
    }
  }

  async getMemoryConnections(memoryId: number): Promise<any[]> {
    try {
      const { memoryConnections } = await import('@shared/schema');
      const { eq, or } = await import('drizzle-orm');
      
      const connections = await db.select()
        .from(memoryConnections)
        .where(or(
          eq(memoryConnections.fromMemoryId, memoryId),
          eq(memoryConnections.toMemoryId, memoryId)
        ));
      
      return connections;
    } catch (error) {
      console.error('Error getting memory connections:', error);
      return [];
    }
  }

  async createMemoryConnection(data: any): Promise<any> {
    try {
      const { memoryConnections } = await import('@shared/schema');
      
      const connectionData = {
        userId: data.userId,
        fromMemoryId: data.fromMemoryId,
        toMemoryId: data.toMemoryId,
        connectionType: data.connectionType || 'relates_to',
        strength: data.strength || '0.50',
        automaticConnection: data.automaticConnection !== false,
        createdAt: new Date()
      };
      
      const [connection] = await db.insert(memoryConnections).values(connectionData).returning();
      return connection;
    } catch (error) {
      console.error('Error creating memory connection:', error);
      throw error;
    }
  }

  async updateMemoryAccessCount(memoryId: number): Promise<void> {
    try {
      const { semanticMemories } = await import('@shared/schema');
      const { eq, sql } = await import('drizzle-orm');
      
      await db.update(semanticMemories)
        .set({
          accessCount: sql`${semanticMemories.accessCount} + 1`,
          lastAccessedAt: new Date()
        })
        .where(eq(semanticMemories.id, memoryId));
    } catch (error) {
      console.error('Error updating memory access count:', error);
    }
  }

  async getAllUserMemoryConnections(userId: number): Promise<any[]> {
    try {
      const { memoryConnections } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const connections = await db.select()
        .from(memoryConnections)
        .where(eq(memoryConnections.userId, userId));
      
      return connections;
    } catch (error) {
      console.error('Error getting user memory connections:', error);
      return [];
    }
  }

  // Basic implementations for conversation continuity
  async getConversationSessionHistory(userId: number, limit: number = 3): Promise<any[]> {
    return [];
  }

  async getUnaddressedContinuity(userId: number): Promise<any[]> {
    return [];
  }

  async getActiveConversationThreads(userId: number): Promise<any[]> {
    return [];
  }

  async markContinuityAddressed(continuityId: number): Promise<void> {
    // Placeholder
  }

  async getActiveConversationSession(userId: number): Promise<any> {
    return null;
  }

  async createConversationSession(data: any): Promise<any> {
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
      isActive: true,
      lastActivity: new Date(),
      createdAt: new Date()
    };
  }

  async updateConversationSession(id: number, data: any): Promise<any> {
    return { ...data, id, updatedAt: new Date() };
  }

  async createConversationThread(data: any): Promise<any> {
    return { ...data, id: Date.now(), createdAt: new Date() };
  }

  async updateConversationThread(id: number, data: any): Promise<any> {
    return { ...data, id, updatedAt: new Date() };
  }

  async createSessionContinuity(data: any): Promise<any> {
    return { ...data, id: Date.now(), createdAt: new Date() };
  }
}

export const storage = new DatabaseStorage();
