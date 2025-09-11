/**
 * DEPRECATED - DO NOT USE
 * This file has been replaced by unifiedAuth.js
 * Keeping for reference only - all imports should use unifiedAuth.js
 */

console.error('❌ SECURITY WARNING: singleAuth.js is deprecated and insecure');
console.error('❌ Use unifiedAuth.js instead for secure authentication');

// Re-export unified auth to prevent import errors
export { unifiedAuthMiddleware as singleAuthMiddleware } from './unifiedAuth.js';
export { getCurrentUserId as getSingleUserId } from './unifiedAuth.js';

// Prevent accidental use
export const setSingleUserId = () => {
  throw new Error('setSingleUserId is deprecated - use unifiedAuth.js');
};
