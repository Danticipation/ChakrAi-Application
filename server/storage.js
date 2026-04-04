// Simple storage wrapper to export the minimal storage implementation
// This file ensures the routes can properly import the storage module

// Import the minimal storage implementation
import { MinimalStorage } from './storage/storage-minimal.js';

// Create and export an instance
export const storage = new MinimalStorage();

// Export the class for direct usage
export { MinimalStorage } from './storage/storage-minimal.js';
