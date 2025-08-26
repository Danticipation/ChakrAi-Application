import { db } from "../db.js";
import { 
  therapeuticGoals, therapists, clientTherapistRelationships, riskAlerts,
  type TherapeuticGoal, type InsertTherapeuticGoal,
  type Therapist, type InsertTherapist,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface ITherapeuticStorage {
  createTherapeuticGoal(data: InsertTherapeuticGoal): Promise<TherapeuticGoal>;
  getTherapeuticGoals(userId: number): Promise<TherapeuticGoal[]>;
  updateGoalProgress(goalId: number, currentValue: number): Promise<TherapeuticGoal>;
  clearUserGoals(userId: number): Promise<void>;
}

export class TherapeuticStorage implements ITherapeuticStorage {
  async createTherapeuticGoal(data: InsertTherapeuticGoal): Promise<TherapeuticGoal> {
    const result = await db.insert(therapeuticGoals).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create therapeutic goal');
    }
    
    return result[0];
  }

  async getTherapeuticGoals(userId: number): Promise<TherapeuticGoal[]> {
    return await db.select().from(therapeuticGoals)
      .where(eq(therapeuticGoals.userId, userId))
      .orderBy(desc(therapeuticGoals.createdAt));
  }

  async updateGoalProgress(goalId: number, currentValue: number): Promise<TherapeuticGoal> {
    const result = await db.update(therapeuticGoals)
      .set({ currentValue })
      .where(eq(therapeuticGoals.id, goalId))
      .returning();
    
    if (!result[0]) {
      throw new Error('Failed to update goal progress');
    }
    
    return result[0];
  }

  async clearUserGoals(userId: number): Promise<void> {
    await db.delete(therapeuticGoals).where(eq(therapeuticGoals.userId, userId));
  }
}