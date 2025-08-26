import { db } from "../db.js";
import { 
  vrEnvironments, vrSessions, longitudinalTrends, riskAssessments, crisisDetectionLogs,
  type LongitudinalTrend, type InsertLongitudinalTrend,
  type RiskAssessment, type InsertRiskAssessment,
  type CrisisDetectionLog, type InsertCrisisDetectionLog,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IHealthStorage {
  createRiskAssessment(data: InsertRiskAssessment): Promise<RiskAssessment>;
  getRiskAssessments(userId: number, limit?: number): Promise<RiskAssessment[]>;
  getLatestRiskAssessment(userId: number): Promise<RiskAssessment | null>;
  createCrisisDetectionLog(data: InsertCrisisDetectionLog): Promise<CrisisDetectionLog>;
  getCrisisDetectionLogs(userId: number, limit?: number): Promise<CrisisDetectionLog[]>;
  createLongitudinalTrend(data: InsertLongitudinalTrend): Promise<LongitudinalTrend>;
  getLongitudinalTrends(userId: number, trendType?: string, timeframe?: string): Promise<LongitudinalTrend[]>;
  calculateUserWellnessMetrics(userId: number): Promise<any>;
  calculateEmotionalVolatility(userId: number, days?: number): Promise<number>;
  calculateTherapeuticEngagement(userId: number, days?: number): Promise<number>;
  generateWellnessInsights(userId: number): Promise<string>;
  getHealthCorrelations(userId: number): Promise<any[]>;
  createHealthCorrelation(data: any): Promise<any>;
  getHealthMetrics(userId: number, period?: string, limit?: number): Promise<any[]>;
}

export class HealthStorage implements IHealthStorage {
  async createRiskAssessment(data: InsertRiskAssessment): Promise<RiskAssessment> {
    const result = await db.insert(riskAssessments).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create risk assessment');
    }
    
    return result[0];
  }

  async getRiskAssessments(userId: number, limit: number = 10): Promise<RiskAssessment[]> {
    return await db.select().from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.createdAt))
      .limit(limit);
  }

  async getLatestRiskAssessment(userId: number): Promise<RiskAssessment | null> {
    const result = await db.select().from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.createdAt))
      .limit(1);
    return result[0] || null;
  }

  async createCrisisDetectionLog(data: InsertCrisisDetectionLog): Promise<CrisisDetectionLog> {
    const result = await db.insert(crisisDetectionLogs).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create crisis detection log');
    }
    
    return result[0];
  }

  async getCrisisDetectionLogs(userId: number, limit: number = 20): Promise<CrisisDetectionLog[]> {
    return await db.select().from(crisisDetectionLogs)
      .where(eq(crisisDetectionLogs.userId, userId))
      .orderBy(desc(crisisDetectionLogs.createdAt))
      .limit(limit);
  }

  async createLongitudinalTrend(data: InsertLongitudinalTrend): Promise<LongitudinalTrend> {
    const result = await db.insert(longitudinalTrends).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create longitudinal trend');
    }
    
    return result[0];
  }

  async getLongitudinalTrends(userId: number, trendType?: string, timeframe?: string): Promise<LongitudinalTrend[]> {
    const conditions = [eq(longitudinalTrends.userId, userId)];
    
    if (trendType) {
      conditions.push(eq(longitudinalTrends.trendType, trendType));
    }
    
    return await db.select().from(longitudinalTrends)
      .where(and(...conditions))
      .orderBy(desc(longitudinalTrends.createdAt));
  }

  async calculateUserWellnessMetrics(userId: number): Promise<any> {
    return { wellnessScore: 75, trend: 'improving' };
  }

  async calculateEmotionalVolatility(userId: number, days: number = 30): Promise<number> {
    return 0.3; // Placeholder
  }

  async calculateTherapeuticEngagement(userId: number, days: number = 30): Promise<number> {
    return 0.8; // Placeholder
  }

  async generateWellnessInsights(userId: number): Promise<string> {
    return 'Your wellness journey is progressing well.';
  }

  async getHealthCorrelations(userId: number): Promise<any[]> {
    return [];
  }

  async createHealthCorrelation(data: any): Promise<any> {
    return data;
  }

  async getHealthMetrics(userId: number, period?: string, limit?: number): Promise<any[]> {
    return [];
  }
}