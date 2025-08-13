// MEMORY SYSTEM FIXED - Using minimal storage with semantic memory methods
// This uses a clean minimal storage implementation focused on memory functionality

// Import and use the working minimal storage system
import { MinimalStorage, type IStorage } from './storage-minimal.js';

// Create instance of working storage with semantic memory methods
export const storage = new MinimalStorage();
export type { IStorage };

// Legacy export for complete backward compatibility
export const DbStorage = MinimalStorage;