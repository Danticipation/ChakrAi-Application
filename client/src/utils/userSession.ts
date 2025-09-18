// DEPRECATED - Use unifiedUserSession.ts instead
export * from './unifiedUserSession';

// Legacy exports for compatibility
export { getAuthHeaders as getDeviceHeaders } from './unifiedUserSession';
export { getCurrentUserId } from './unifiedUserSession';

// Dummy functions for compatibility
export const validateUserSession = () => true;
export const generateNewUserId = async () => Math.floor(Math.random() * 999000) + 1000;
export const emergencyDataReset = async () => ({ success: true });
export const debugUserSession = () => console.log('Debug session');
export const generateDeviceFingerprint = () => 'unified-device';
export const isIncognitoMode = () => false;
export const resetUserSession = async () => Math.floor(Math.random() * 999000) + 1000;
export const safeReset = async () => Math.floor(Math.random() * 999000) + 1000;
export const nuklearReset = async () => ({ success: true });

