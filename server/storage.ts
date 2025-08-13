// MEMORY SYSTEM FIXED - Using stable storage system with all semantic memory methods
// This uses the stable old storage system that has all required methods implemented

// Import and use the working storage system with semantic memory methods
import { DatabaseStorage, type IStorage } from './storage-old.js';

// Create instance of working storage with all memory methods
export const storage = new DatabaseStorage();
export type { IStorage };

// Legacy export for complete backward compatibility
export const DbStorage = DatabaseStorage;