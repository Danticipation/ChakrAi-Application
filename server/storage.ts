// Backward compatibility wrapper for the modular storage system
// This file maintains the original storage.ts interface while delegating to modular storage

// Import the modular storage system
export { storage, type IStorage } from './storage/index.js';

// Legacy export for complete backward compatibility
import { storage as modularStorage } from './storage/index.js';
export const DbStorage = class {
  constructor() {
    // Return the modular storage instance for any legacy code that instantiates DbStorage directly
    return modularStorage;
  }
};

// Re-export everything from the modular storage for seamless transition
export * from './storage/index.js';