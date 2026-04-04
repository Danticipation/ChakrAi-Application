# Data Reset & Clearing Features

## Overview
This document describes the data clearing and reset functionality added to Chakrai for testing and user management purposes.

## Features Implemented

### 1. Clear Journal Entries
- **Endpoint:** `DELETE /api/journals/all`
- **Function:** Deletes all journal entries for the authenticated user
- **Use Case:** Testing journal features without old data interference

### 2. Clear Chat History
- **Endpoint:** `DELETE /api/chats/history`
- **Function:** Deletes all chat messages for the authenticated user
- **Use Case:** Starting fresh conversations for testing

### 3. Factory Reset
- **Endpoint:** `DELETE /api/users/factory-reset`
- **Function:** Complete data wipe for a user, including:
  - All journal entries
  - All chat messages
  - All mood entries
  - All semantic memories and connections
  - All memory insights
  - All learning milestones
  - All progress metrics
  - All adaptive learning insights
  - All wellness journey events
  - Resets monthly usage counter
- **Use Case:** Complete fresh start for testing or user request

## Implementation Details

### Storage Methods
Added to `server/storage/storage-minimal.ts`:
- `clearUserJournalEntries(userId: number): Promise<void>`
- `clearUserChatHistory(userId: number): Promise<void>`
- `clearUserMoodEntries(userId: number): Promise<void>`
- `clearUserMemories(userId: number): Promise<void>`
- `factoryResetUser(userId: number): Promise<void>`

### Route Handlers
- Journal clearing: `server/routes/journals.ts`
- Chat clearing: `server/routes/chats.ts`
- Factory reset: `server/routes/users.ts`

## Testing

Use the provided test script `test-data-reset.js`:

```bash
# View usage instructions
node test-data-reset.js

# Run all tests
node test-data-reset.js test

# Clear specific data
node test-data-reset.js clear-journal
node test-data-reset.js clear-chat
node test-data-reset.js factory-reset
```

**Important:** Update `TEST_USER_ID` and `AUTH_TOKEN` in the script before running.

## Security Considerations

1. **Authentication Required:** All endpoints require valid authentication
2. **User Isolation:** Users can only clear their own data
3. **No Accidental Deletion:** Factory reset requires explicit confirmation
4. **Audit Trail:** All deletions are logged for debugging

## Frontend Integration

To add these features to the UI:

### Settings Page Example
```jsx
// In Settings component
const handleClearJournals = async () => {
  if (confirm('Are you sure you want to delete all journal entries?')) {
    const response = await fetch('/api/journals/all', { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      alert('Journal entries cleared!');
    }
  }
};

const handleFactoryReset = async () => {
  const confirmation = prompt('Type "DELETE ALL" to confirm factory reset:');
  if (confirmation === 'DELETE ALL') {
    const response = await fetch('/api/users/factory-reset', { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      alert('All data cleared. Logging out...');
      // Redirect to login
    }
  }
};
```

### UI Suggestions
1. Place data management options in Settings → Privacy or Settings → Data
2. Use modal confirmations for destructive actions
3. Add loading states during deletion
4. Clear local storage/cache after successful reset
5. Consider adding a "grace period" for undo (soft delete)

## Testing Workflow

For development testing:
1. Create test data (journals, chats, etc.)
2. Test feature with existing data
3. Clear specific data type
4. Test feature with clean state
5. Repeat as needed

For complete reset:
1. Use factory reset to start completely fresh
2. Useful when switching between major test scenarios
3. Ensures no data contamination between tests

## Future Enhancements

Consider adding:
1. **Selective clearing:** Delete data within date ranges
2. **Export before delete:** Backup user data before clearing
3. **Soft delete:** Mark as deleted but retain for recovery period
4. **Batch operations:** Clear multiple data types in one request
5. **Admin override:** Allow admins to reset user data (with audit)

## Notes

- All clearing operations are permanent and cannot be undone
- Consider implementing database backups before allowing production use
- Monitor usage patterns to detect potential abuse
- Add rate limiting to prevent rapid repeated deletions
