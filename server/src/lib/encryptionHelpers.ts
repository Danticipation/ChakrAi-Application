/**
 * HIPAA COMPLIANCE: Encrypted Journal Entry Helpers
 * 
 * These functions automatically encrypt journal entries before storing
 * and decrypt them when retrieving from the database.
 */

import { encrypt, decrypt, encryptFields, decryptFields } from './encryption.js';
import type { JournalEntry, InsertJournalEntry } from '../../../shared/schema.js';

/**
 * Encrypt a journal entry before storing in database
 */
export function encryptJournalEntry(entry: InsertJournalEntry): InsertJournalEntry {
  return {
    ...entry,
    title: entry.title ? encrypt(entry.title) : null,
    content: encrypt(entry.content)!, // content is required, so always encrypt
  };
}

/**
 * Decrypt a journal entry after retrieving from database
 * Returns null if decryption fails (wrong key or corrupted data)
 */
export function decryptJournalEntry(entry: JournalEntry): JournalEntry | null {
  try {
    return {
      ...entry,
      title: entry.title ? decrypt(entry.title) : null,
      content: decrypt(entry.content)!,
    };
  } catch (error) {
    // Entry was encrypted with a different key - skip it
    console.warn(`âš ï¸ Skipping journal entry ${entry.id} - encrypted with different key`);
    return null;
  }
}

/**
 * Decrypt multiple journal entries, filtering out entries that can't be decrypted
 */
export function decryptJournalEntries(entries: JournalEntry[]): JournalEntry[] {
  const decrypted: JournalEntry[] = [];
  
  for (const entry of entries) {
    const result = decryptJournalEntry(entry);
    if (result !== null) {
      decrypted.push(result);
    }
  }
  
  return decrypted;
}

/**
 * Encrypt a mood entry before storing
 */
export function encryptMoodEntry(entry: any): any {
  return {
    ...entry,
    notes: entry.notes ? encrypt(entry.notes) : null,
  };
}

/**
 * Decrypt a mood entry after retrieving
 */
export function decryptMoodEntry(entry: any): any {
  return {
    ...entry,
    notes: entry.notes ? decrypt(entry.notes) : null,
  };
}

/**
 * Encrypt a chat message before storing
 */
export function encryptMessage(message: any): any {
  return {
    ...message,
    text: message.text ? encrypt(message.text) : null,
    content: message.content ? encrypt(message.content) : null,
  };
}

/**
 * Decrypt a chat message after retrieving
 * Returns null if decryption fails
 */
export function decryptMessage(message: any): any | null {
  try {
    return {
      ...message,
      text: message.text ? decrypt(message.text) : null,
      content: message.content ? decrypt(message.content) : null,
    };
  } catch (error) {
    console.warn(`⚠️ Skipping message ${message.id} - encrypted with different key`);
    return null;
  }
}

/**
 * Decrypt multiple messages, filtering out undecryptable ones
 */
export function decryptMessages(messages: any[]): any[] {
  const decrypted: any[] = [];
  
  for (const message of messages) {
    const result = decryptMessage(message);
    if (result !== null) {
      decrypted.push(result);
    }
  }
  
  return decrypted;
}
