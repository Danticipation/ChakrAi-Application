// MODULAR MEMORY SYSTEM - Robust therapeutic conversation memory
// Designed for scalability, maintainability, and comprehensive memory retention

export { MemoryManager } from './MemoryManager.js';
export { SemanticMemoryService } from './SemanticMemoryService.js';
export { ConversationContinuityService } from './ConversationContinuityService.js';
export { MemoryConnectionService } from './MemoryConnectionService.js';
export { MemoryRetrievalService } from './MemoryRetrievalService.js';
export { MemoryAnalyticsService } from './MemoryAnalyticsService.js';

// Core interfaces
export type {
  IMemoryManager,
  ISemanticMemoryService,
  IConversationContinuityService,
  IMemoryConnectionService,
  IMemoryRetrievalService,
  IMemoryAnalyticsService,
  MemoryContext,
  ConversationSession,
  SemanticMemory,
  MemoryInsight
} from './types.js';