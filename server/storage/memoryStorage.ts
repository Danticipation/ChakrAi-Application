import { db } from "../db.js";
import { 
  userMemories, userFacts, conversationSummaries, semanticMemories, 
  memoryConnections, memoryInsights, conversationSessions, conversationThreads, sessionContinuity,
  type UserMemory, type InsertUserMemory,
  type UserFact, type InsertUserFact,
  type ConversationSummary, type InsertConversationSummary,
  type SemanticMemory, type InsertSemanticMemory,
  type MemoryConnection, type InsertMemoryConnection,
  type MemoryInsight, type InsertMemoryInsight,
  type ConversationSession, type InsertConversationSession,
  type ConversationThread, type InsertConversationThread,
  type SessionContinuity, type InsertSessionContinuity,
} from "../../shared/schema.ts";
import { eq, desc } from "drizzle-orm";

export interface IMemoryStorage {
  getUserMemoriesByUserId(userId: number): Promise<UserMemory[]>;
  createUserMemory(data: InsertUserMemory): Promise<UserMemory>;
  getUserFactsByUserId(userId: number): Promise<UserFact[]>;
  createUserFact(data: InsertUserFact): Promise<UserFact>;
  getUserMemories(userId: number): Promise<UserMemory[]>;
  getUserFacts(userId: number): Promise<UserFact[]>;
  clearUserMemories(userId: number): Promise<void>;
}

export class MemoryStorage implements IMemoryStorage {
  async getUserMemoriesByUserId(userId: number): Promise<UserMemory[]> {
    return await db.select().from(userMemories)
      .where(eq(userMemories.userId, userId))
      .orderBy(desc(userMemories.createdAt));
  }

  async createUserMemory(data: InsertUserMemory): Promise<UserMemory> {
    const result = await db.insert(userMemories).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create user memory');
    }
    
    return result[0];
  }

  async getUserFactsByUserId(userId: number): Promise<UserFact[]> {
    return await db.select().from(userFacts)
      .where(eq(userFacts.userId, userId))
      .orderBy(desc(userFacts.createdAt));
  }

  async createUserFact(data: InsertUserFact): Promise<UserFact> {
    const result = await db.insert(userFacts).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create user fact');
    }
    
    return result[0];
  }

  async getUserMemories(userId: number): Promise<UserMemory[]> {
    return this.getUserMemoriesByUserId(userId);
  }

  async getUserFacts(userId: number): Promise<UserFact[]> {
    return this.getUserFactsByUserId(userId);
  }

  async clearUserMemories(userId: number): Promise<void> {
    await db.delete(userMemories).where(eq(userMemories.userId, userId));
    await db.delete(userFacts).where(eq(userFacts.userId, userId));
  }
}
