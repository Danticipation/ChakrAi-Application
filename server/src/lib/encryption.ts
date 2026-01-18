import CryptoJS from 'crypto-js';

/**
 * HIPAA COMPLIANCE: Encryption at Rest
 * 
 * This module provides AES-256 encryption for Protected Health Information (PHI).
 * All sensitive data must be encrypted before storing in the database.
 * 
 * CRITICAL: The ENCRYPTION_KEY must be:
 * - At least 32 characters (256 bits)
 * - Stored securely in environment variables
 * - NEVER committed to version control
 * - Rotated periodically (every 90 days recommended)
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required for HIPAA compliance');
}

if (ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters for AES-256 encryption');
}

/**
 * Encrypt sensitive data before storing in database
 * @param plaintext - The data to encrypt (PHI)
 * @returns Encrypted string (safe to store in database)
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;
  
  try {
    const encrypted = CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('🚨 ENCRYPTION FAILED:', error);
    throw new Error('Failed to encrypt data - HIPAA compliance compromised');
  }
}

/**
 * Decrypt data when reading from database
 * @param ciphertext - The encrypted data from database
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null;
  
  // Check if data is encrypted (starts with U2FsdGVk which is base64 for "Salted__")
  // If not encrypted, return as-is (backward compatibility for pre-encryption data)
  if (!ciphertext.startsWith('U2FsdGVk')) {
    console.warn('⚠️ Data appears to be unencrypted (legacy data), returning as-is');
    return ciphertext;
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Decryption returned empty string - possible wrong key or corrupted data');
    }
    
    return decrypted;
  } catch (error) {
    console.error('🚨 DECRYPTION FAILED:', error);
    throw new Error('Failed to decrypt data - possible key mismatch');
  }
}

/**
 * Encrypt multiple fields in an object
 * @param data - Object with fields to encrypt
 * @param fields - Array of field names to encrypt
 * @returns Object with encrypted fields
 */
export function encryptFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T {
  const encrypted = { ...data };
  
  for (const field of fields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field] as string) as any;
    }
  }
  
  return encrypted;
}

/**
 * Decrypt multiple fields in an object
 * @param data - Object with encrypted fields
 * @param fields - Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export function decryptFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T {
  const decrypted = { ...data };
  
  for (const field of fields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field] as string) as any;
    }
  }
  
  return decrypted;
}

/**
 * Test encryption/decryption to verify key is working
 */
export function testEncryption(): boolean {
  try {
    const testData = 'HIPAA_ENCRYPTION_TEST_' + Date.now();
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    
    if (decrypted !== testData) {
      console.error('🚨 ENCRYPTION TEST FAILED: Decrypted data does not match original');
      return false;
    }
    
    console.log('✅ Encryption test passed - AES-256 working correctly');
    return true;
  } catch (error) {
    console.error('🚨 ENCRYPTION TEST FAILED:', error);
    return false;
  }
}

// List of PHI fields that must ALWAYS be encrypted
export const PHI_FIELDS = {
  journal_entries: ['content', 'title'],
  mood_entries: ['notes'],
  messages: ['text', 'content'],
  therapist_session_notes: ['notes', 'recommendations'],
  user_memories: ['memory'],
  user_facts: ['fact'],
  conversation_summaries: ['summary'],
  semantic_memories: ['content'],
} as const;
