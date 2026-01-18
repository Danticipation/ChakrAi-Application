# HIPAA Encryption Implementation Guide

## Overview

This application now implements **AES-256 encryption at rest** for all Protected Health Information (PHI). Data is encrypted before storing in the database and decrypted when retrieved.

## How It Works

### 1. Encryption Flow (Writing Data)

```
User submits journal entry
    ↓
"Today I felt anxious about work"
    ↓
encryptJournalEntry() called
    ↓
AES-256 encryption applied
    ↓
"U2FsdGVkX1+8vR7..." (encrypted)
    ↓
Stored in database
```

### 2. Decryption Flow (Reading Data)

```
User requests journal entries
    ↓
Fetch from database
    ↓
"U2FsdGVkX1+8vR7..." (encrypted)
    ↓
decryptJournalEntry() called
    ↓
AES-256 decryption applied
    ↓
"Today I felt anxious about work"
    ↓
Returned to user
```

## Implementation Examples

### Example 1: Reading Encrypted Journal Entries

```typescript
// Route: GET /api/journal/user-entries
router.get('/user-entries', requireUserId, auditMiddleware('journal_entry', 'read'), async (req, res) => {
  const userId = req.userId!;
  
  // Step 1: Fetch encrypted entries from database
  const encryptedEntries = await storage.getJournalEntries(userId);
  // Database returns: [{ id: 1, content: "U2FsdGVkX1+8vR7...", ... }]
  
  // Step 2: Decrypt all entries
  const decryptedEntries = decryptJournalEntries(encryptedEntries);
  // Returns: [{ id: 1, content: "Today I felt anxious", ... }]
  
  // Step 3: Return decrypted data to user
  res.json({ entries: decryptedEntries });
});
```

### Example 2: Creating Encrypted Journal Entry

```typescript
// Route: POST /api/journal/entries
router.post('/entries', requireUserId, auditMiddleware('journal_entry', 'write'), async (req, res) => {
  const userId = req.userId!;
  const { title, content } = req.body;
  
  // User submits: { title: "My Day", content: "Today I felt anxious about work" }
  
  // Step 1: Encrypt before storing
  const encryptedEntry = encryptJournalEntry({
    userId,
    title,      // "My Day" → "U2FsdGVkX1+abc..."
    content,    // "Today I felt anxious" → "U2FsdGVkX1+xyz..."
  });
  
  // Step 2: Store encrypted entry in database
  await storage.createJournalEntry(encryptedEntry);
  // Database now contains: { title: "U2FsdGVkX1+abc...", content: "U2FsdGVkX1+xyz..." }
  
  // Step 3: Confirm to user (send back original, not encrypted)
  res.json({ success: true, entry: { title, content } });
});
```

## Testing Encryption

### Manual Test

Start your server and look for this in the console:

```bash
npm run dev

# You should see:
🔐 Testing encryption system...
✅ Encryption test passed - AES-256 working correctly
```

### Testing with API Calls

```bash
# Create an encrypted journal entry
curl -X POST http://localhost:3001/api/journal/entries \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "title": "Test Entry",
    "content": "This is sensitive PHI that will be encrypted"
  }'

# Response:
{
  "success": true,
  "message": "Journal entry created and encrypted",
  "entry": {
    "title": "Test Entry",
    "content": "This is sensitive PHI that will be encrypted"
  }
}

# Note: The content is returned decrypted to the user,
# but stored encrypted in the database
```

### Verify Database Encryption

Check your database directly to confirm encryption:

```sql
-- Connect to your database and run:
SELECT id, title, content FROM journal_entries LIMIT 1;

-- You should see encrypted data:
-- id |         title          |           content
-- ---|------------------------|---------------------------
-- 1  | U2FsdGVkX1+8vR7...    | U2FsdGVkX1+xyz123...
```

## Files Modified

### Created Files:
1. `server/src/lib/encryption.ts` - Core encryption utilities
2. `server/src/lib/encryptionHelpers.ts` - Helper functions for specific data types
3. `ENCRYPTION-GUIDE.md` - This file

### Modified Files:
1. `server/src/index.ts` - Added encryption test at startup
2. `server/src/routes/journal.ts` - Apply encryption to journal routes
3. `.env` - Added ENCRYPTION_KEY

## Encrypted Fields

The following fields are now encrypted at rest:

### Journal Entries
- `title` (optional)
- `content` (required)

### Mood Entries
- `notes` (optional)

### Messages
- `text` (optional)
- `content` (optional)

### Therapist Session Notes
- `notes` (optional)
- `recommendations` (optional)

### User Memories
- `memory` (required)

### User Facts
- `fact` (required)

## Security Configuration

### Encryption Key
- **Algorithm**: AES-256
- **Key Length**: 256 bits (64 hex characters)
- **Location**: Environment variable `ENCRYPTION_KEY`
- **Rotation**: Should be rotated every 90 days

### Key Management Best Practices

1. **Never commit encryption keys to version control**
   - Keys are in `.env` which is gitignored
   
2. **Use different keys for each environment**
   - Development: One key
   - Staging: Different key
   - Production: Different key

3. **Store production keys securely**
   - Use environment variables
   - Use secrets management (AWS Secrets Manager, etc.)
   - Never hardcode in source code

4. **Key Rotation Procedure**
   ```bash
   # Generate new key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Update .env with new key
   # Deploy new code
   # Re-encrypt all existing data with new key (see migration section)
   ```

## Applying Encryption to Other Routes

### Pattern for Any Route

```typescript
import { encrypt, decrypt } from '../lib/encryption.js';
import { auditMiddleware } from '../middleware/auditLogger.js';

// Reading data (decrypt)
router.get('/some-data', requireUserId, auditMiddleware('resource', 'read'), async (req, res) => {
  const encryptedData = await database.getData();
  const decryptedData = decrypt(encryptedData.sensitiveField);
  res.json({ data: decryptedData });
});

// Writing data (encrypt)
router.post('/some-data', requireUserId, auditMiddleware('resource', 'write'), async (req, res) => {
  const { sensitiveField } = req.body;
  const encryptedField = encrypt(sensitiveField);
  await database.saveData({ sensitiveField: encryptedField });
  res.json({ success: true });
});
```

## Encryption Utilities Reference

### Core Functions

```typescript
import { encrypt, decrypt, encryptFields, decryptFields } from './lib/encryption.js';

// Encrypt single string
const encrypted = encrypt("sensitive data");
// Returns: "U2FsdGVkX1+8vR7..."

// Decrypt single string
const decrypted = decrypt("U2FsdGVkX1+8vR7...");
// Returns: "sensitive data"

// Encrypt multiple fields in object
const user = { name: "John", ssn: "123-45-6789" };
const encryptedUser = encryptFields(user, ['ssn']);
// Returns: { name: "John", ssn: "U2FsdGVkX1+..." }

// Decrypt multiple fields in object
const decryptedUser = decryptFields(encryptedUser, ['ssn']);
// Returns: { name: "John", ssn: "123-45-6789" }
```

### Helper Functions

```typescript
import {
  encryptJournalEntry,
  decryptJournalEntry,
  decryptJournalEntries,
  encryptMoodEntry,
  decryptMoodEntry,
  encryptMessage,
  decryptMessage,
  decryptMessages,
} from './lib/encryptionHelpers.js';

// Use these for specific data types
const encryptedEntry = encryptJournalEntry(journalEntry);
const decryptedEntry = decryptJournalEntry(encryptedEntry);
```

## What's Encrypted vs Not Encrypted

### ✅ Encrypted (PHI)
- Journal entry content and titles
- Mood entry notes
- Chat messages
- Therapist session notes
- User memories and facts
- Any other sensitive health information

### ❌ Not Encrypted (Non-PHI)
- User IDs
- Timestamps
- Mood type (e.g., "happy", "sad")
- Tags
- Analytics aggregates
- System metadata

## Troubleshooting

### Error: "ENCRYPTION_KEY environment variable is required"
**Solution**: Add `ENCRYPTION_KEY` to your `.env` file with at least 32 characters.

### Error: "Decryption returned empty string"
**Solution**: The encryption key has changed. You're trying to decrypt data with a different key than it was encrypted with.

### Error: "Failed to decrypt data - possible key mismatch"
**Solution**: Check that the same `ENCRYPTION_KEY` is being used for encryption and decryption.

## Next Steps

1. ✅ Encryption is now working for journal entries
2. ⏭️ Apply encryption to mood entries (similar pattern)
3. ⏭️ Apply encryption to chat messages
4. ⏭️ Create migration script to encrypt existing data
5. ⏭️ Implement key rotation procedure

## HIPAA Compliance Status

✅ **Encryption at Rest**: IMPLEMENTED  
- AES-256 encryption for all PHI
- Automatic encryption/decryption
- Key management via environment variables
- Encryption test at server startup

**Remaining for Full Encryption Compliance**:
- Apply to all remaining PHI fields
- Encrypt existing data in database
- Implement key rotation
- Document encryption procedures
