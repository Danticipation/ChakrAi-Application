// MODULAR MEMORY SYSTEM - Comprehensive therapeutic memory architecture
// Uses modular memory services for robust conversation continuity and therapeutic insights

// Import the modular memory system
import { MemoryManager } from './memory/MemoryManager.js';
import { MinimalStorage, type IStorage } from './storage-minimal.js';

// Create instances of both systems
export const storage = new MinimalStorage(); // Basic storage operations
export const memorySystem = new MemoryManager(); // Advanced memory operations

// Export types
export type { IStorage };

// Legacy export for backward compatibility
export const DbStorage = MinimalStorage;

// Enhanced storage interface that combines basic storage with memory system
export class EnhancedStorage extends MinimalStorage {
  public memory = memorySystem;
  
  // Override methods to integrate with memory system
  override async createMessage(data: any): Promise<any> {
    const message = await super.createMessage?.(data) || data;
    
    // Process message through memory system if it's a user message
    if (data.isFromUser && data.content && data.userId) {
      try {
        await this.memory.processMessage(data.userId, data.content, {
          emotionalState: data.emotionalState,
          therapeuticGoals: data.therapeuticGoals,
          currentTopics: data.currentTopics
        });
      } catch (error) {
        console.error('Error processing message through memory system:', error);
      }
    }
    
    return message;
  }
  
  // Get comprehensive context for AI responses
  async getConversationContext(userId: number, currentMessage?: string): Promise<any> {
    try {
      return await this.memory.getComprehensiveContext(userId, currentMessage);
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return { recentMemories: [], relevantInsights: [], sessionContext: null, emotionalContext: {} };
    }
  }
}

// Export enhanced storage as the default
export const enhancedStorage = new EnhancedStorage();