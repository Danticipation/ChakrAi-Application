// Phase 2: Extract business logic from routes - Journal Controller
import { Request, Response } from 'express';
import { storage } from '../storage.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { ResponseService } from '../services/responseService.js';
import { PaginationHelper } from '../utils/pagination.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { validateJournalEntry, handleValidationErrors } from '../middleware/security.js';

export class JournalController {
  
  // Get journal entries with pagination
  static getEntries = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params['userId'] || '');
    const pagination = PaginationHelper.parseParams(req);
    
    // Get total count for pagination (simplified for now)
    const entries = await storage.getJournalEntries(userId);
    const totalEntries = entries.length;
    
    // Apply pagination manually (can be optimized with database-level pagination)
    const startIndex = PaginationHelper.getOffset(pagination.page, pagination.limit);
    const paginatedEntries = entries.slice(startIndex, startIndex + pagination.limit);
    
    ResponseService.sendPaginated(res, paginatedEntries, pagination, totalEntries);
  });

  // Create journal entry
  static createEntry = [
    validateJournalEntry,
    handleValidationErrors,
    asyncHandler(async (req: Request, res: Response) => {
      const userId = parseInt(req.params['userId'] || '');
      const entryData = {
        ...req.body,
        userId
      };
      
      const entry = await storage.createJournalEntry(entryData);
      ResponseService.sendSuccess(res, entry, 'Journal entry created successfully', 201);
    })
  ];

  // Analyze patterns in journal entries
  static analyzePatterns = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params['userId'] || '');
    const timeframeDays = parseInt(req.query['timeframeDays'] as string) || 30;
    
    // Simplified for current storage interface
    const entries = await storage.getJournalEntries(userId);
    const analytics = await storage.getJournalAnalytics(userId);
    
    // Filter by timeframe manually (can be optimized)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);
    const filteredEntries = entries.filter(entry => new Date(entry.createdAt) >= cutoffDate);
    
    const triggerPatterns = await AnalyticsService.extractTriggerPatterns(filteredEntries);
    const temporalPatterns = AnalyticsService.identifyTemporalPatterns(filteredEntries);
    
    // Extract dominant emotions for coping strategies
    const dominantEmotions = filteredEntries
      .flatMap(entry => entry.emotionalTags || [])
      .reduce((acc: Record<string, number>, emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {});
    
    const topEmotions = Object.entries(dominantEmotions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);
    
    const averageValence = analytics.reduce((sum: number, a: any) => sum + (a.sentimentScore || 0), 0) / analytics.length;
    const copingStrategies = AnalyticsService.generateCopingStrategies(topEmotions, averageValence);
    
    const analysis = {
      triggerPatterns,
      temporalPatterns,
      copingStrategies,
      dominantEmotions: topEmotions,
      averageValence,
      totalEntries: filteredEntries.length,
      timeframeDays
    };
    
    ResponseService.sendSuccess(res, analysis);
  });

  // Get journal analytics
  static getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params['userId'] || '');
    const analytics = await (storage as any).getJournalAnalytics(userId);
    
    ResponseService.sendSuccess(res, analytics);
  });

  // Update journal entry
  static updateEntry = [
    validateJournalEntry,
    handleValidationErrors,
    asyncHandler(async (req: Request, res: Response) => {
      const entryId = parseInt(req.params['id'] || '');
      const userId = parseInt(req.params['userId'] || '');
      
      // Verify the entry exists and belongs to this user
      const existingEntry = await storage.getJournalEntry(entryId);
      if (!existingEntry) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }
      
      if (existingEntry.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this entry' });
      }
      
      // Update the journal entry
      const updatedEntry = await (storage as any).updateJournalEntry(entryId, req.body);
      return ResponseService.sendSuccess(res, updatedEntry, 'Journal entry updated successfully');
    })
  ];

  // Delete journal entry
  static deleteEntry = asyncHandler(async (req: Request, res: Response) => {
    const entryId = parseInt(req.params['id'] || '');
    const userId = parseInt(req.params['userId'] || '');
    
    // Verify the entry exists and belongs to this user
    const entry = await storage.getJournalEntry(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    if (entry.userId !== userId) {
      return res.status(403).json({ 
        error: 'Unauthorized: Cannot delete another user\'s entry'
      });
    }
    
    // Delete the journal entry
    await storage.deleteJournalEntry(entryId);
    
    return ResponseService.sendSuccess(res, { success: true }, 'Journal entry deleted successfully');
  });
}
