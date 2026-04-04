import { db } from "../db.js";
import { 
  users, userProfiles, authTokens, voluntaryQuestions, userFeedback,
  type User, type InsertUser,
  type UserProfile, type InsertUserProfile,
  type VoluntaryQuestion, type InsertVoluntaryQuestion,
  type UserFeedback, type InsertUserFeedback,
} from "../../shared/schema.ts";
import { eq, desc, and, lt, ne } from "drizzle-orm";

export interface IUserStorage {
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
}

export class UserStorage implements IUserStorage {
  async createUser(data: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...data,
      lastActiveAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create user');
    }
    
    return result[0];
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async getUserByDeviceFingerprint(fingerprint: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.deviceFingerprint, fingerprint)).limit(1);
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async createRegisteredUser(data: Partial<InsertUser> & { username: string }): Promise<User> {
    const userData: InsertUser = {
      username: data.username,
      email: data.email || null,
      passwordHash: data.passwordHash || null,
      displayName: data.displayName || data.username,
      isAnonymous: false,
      deviceFingerprint: data.deviceFingerprint || null,
      sessionId: data.sessionId || null,
      lastActiveAt: new Date(),
    };

    const result = await db.insert(users).values(userData).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create registered user');
    }
    
    return result[0];
  }

  async migrateAnonymousToRegistered(userId: number, data: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users)
      .set({
        ...data,
        isAnonymous: false,
        lastActiveAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!result[0]) {
      throw new Error('Failed to migrate anonymous user');
    }
    
    return result[0];
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users)
      .set({
        ...data,
        lastActiveAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error('Failed to update user');
    }
    
    return result[0];
  }

  async updateUserLastActive(id: number): Promise<void> {
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, id));
  }

  async deleteInactiveAnonymousUsers(beforeDate: Date): Promise<void> {
    await db.delete(users)
      .where(and(
        eq(users.isAnonymous, true),
        lt(users.lastActiveAt, beforeDate)
      ));
  }

  // Authentication tokens
  async createAuthToken(data: { userId: number; token: string; expiresAt: Date; deviceInfo?: string }): Promise<void> {
    await db.insert(authTokens).values({
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      deviceInfo: data.deviceInfo || null,
      createdAt: new Date(),
    });
  }

  async deleteAuthToken(token: string): Promise<void> {
    await db.delete(authTokens).where(eq(authTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db.delete(authTokens).where(lt(authTokens.expiresAt, new Date()));
  }

  // User Profiles
  async createUserProfile(data: InsertUserProfile): Promise<UserProfile> {
    const result = await db.insert(userProfiles).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create user profile');
    }
    
    return result[0];
  }

  async getUserProfile(userId: number): Promise<UserProfile | null> {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return result[0] || null;
  }

  async updateUserProfile(userId: number, data: Partial<InsertUserProfile>): Promise<UserProfile> {
    const result = await db.update(userProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();
    
    if (!result[0]) {
      throw new Error('Failed to update user profile');
    }
    
    return result[0];
  }

  // Voluntary Questions
  async createVoluntaryQuestionAnswer(data: InsertVoluntaryQuestion): Promise<VoluntaryQuestion> {
    const result = await db.insert(voluntaryQuestions).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create voluntary question answer');
    }
    
    return result[0];
  }

  async getVoluntaryQuestionAnswers(userId: number): Promise<VoluntaryQuestion[]> {
    return await db.select().from(voluntaryQuestions).where(eq(voluntaryQuestions.userId, userId));
  }

  async updateVoluntaryQuestionAnswer(userId: number, questionId: string, answer: string): Promise<VoluntaryQuestion> {
    const result = await db.update(voluntaryQuestions)
      .set({ 
        answer,
        updatedAt: new Date(),
      })
      .where(and(
        eq(voluntaryQuestions.userId, userId),
        eq(voluntaryQuestions.questionId, questionId)
      ))
      .returning();
    
    if (!result[0]) {
      throw new Error('Failed to update voluntary question answer');
    }
    
    return result[0];
  }

  // Feedback System
  async getUserFeedback(userId: number): Promise<UserFeedback[]> {
    return await db.select().from(userFeedback)
      .where(eq(userFeedback.userId, userId))
      .orderBy(desc(userFeedback.createdAt));
  }

  async createFeedback(data: InsertUserFeedback): Promise<UserFeedback> {
    const result = await db.insert(userFeedback).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create feedback');
    }
    
    return result[0];
  }
}
