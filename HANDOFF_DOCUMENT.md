# Chakrai App - Authentication & Journal Fix Handoff Document

## Initial Problem
User reported journal entries failing to save with `401 Unauthorized` errors in the EnhancedJournalInterface component.

## Root Cause Analysis

### Discovery Process
1. **Multiple server files existed** - Found both `server/index.ts` (port 5001) and `server/src/index.ts` (port 3001)
2. **Actual running server** - `server/src/index.ts` on port 3001 (via `tsx watch src/index.ts`)
3. **Authentication mismatch** - Server required JWT Bearer tokens, but client was sending wrong headers
4. **Missing routes** - Journal routes existed but weren't mounted in the running server
5. **Environment variables** - `.env` files in wrong locations, missing keys

## What Was Fixed

### 1. Authentication System (`client/src/utils/unifiedUserSession.ts`)
**Changes:**
- Updated `getAuthHeaders()` to send `Authorization: Bearer <token>` instead of custom headers
- Updated `getAuthenticatedUserId()` to automatically create anonymous users via `/api/auth/anonymous`
- Added compatibility for multiple token storage keys: `authToken`, `token`, `auth_token`
- Tokens now stored in all formats for compatibility with existing AuthContext

### 2. Server Auth Routes (`server/src/routes/auth.ts`)
**Added:**
- `/api/auth/anonymous` endpoint - Creates anonymous users without login
- Generates JWT tokens for anonymous users
- Uses proper `storage.createUser()` method

### 3. Journal Routes (`server/src/routes/journal.ts`)
**Added:**
- `POST /` - Create journal entries
- Fixed `GET /user-entries` - Now returns array directly instead of wrapped object
- Made OpenAI client lazy-loaded to prevent startup crashes without API key

**Fixed:**
- Changed `res.json({ entries: [...] })` to `res.json(entries)` - client expects array

### 4. Server Configuration (`server/src/index.ts`)
**Added:**
- `import 'dotenv/config'` at top to load environment variables
- Imported and mounted journal routes: `app.use('/api/journal', journal)`

### 5. Environment Variables (`server/.env`)
**Updated with:**
```
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
UID_SIGNING_KEYS=k2:your_key_2,k1:your_key_1
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

## Current Status

### Working
- Anonymous user creation via `/api/auth/anonymous`
- JWT token generation and storage
- Authentication headers properly sent on all requests
- Server logs show: "Creating anonymous user" and "Anonymous user created"
- Journal routes mounted and responding

### Last Issue Fixed
**Error:** `recentEntries.filter is not a function`
**Cause:** Server was returning `{ entries: [], lastUpdated: '...' }` but client expected array
**Fix:** Changed journal route to return `entries` array directly

### Ready to Test
After the last fix (returning array directly), user should:
1. Refresh browser page
2. Clear localStorage if needed: `localStorage.clear()`
3. Try saving a journal entry

## Key Files Modified

1. `client/src/utils/unifiedUserSession.ts` - JWT authentication
2. `server/src/routes/auth.ts` - Anonymous user endpoint
3. `server/src/routes/journal.ts` - Journal CRUD operations
4. `server/src/index.ts` - Dotenv and route mounting
5. `server/.env` - Environment variables
6. `vite.config.ts` - Proxy config (verified correct: port 3001)

## Important Notes

- **Server runs on port 3001** via `tsx watch src/index.ts`
- **Vite dev server on port 5173** proxies `/api/*` to port 3001
- **User has login component** (`AuthModal.tsx`) but also needs anonymous access
- **API keys were safe** in `.env.production` - we copied them to `server/.env`
- **JWT_SECRET changed** - old tokens invalidated (expected behavior)

## If Issues Persist

1. **Check server console** - Should see "Creating anonymous user" logs
2. **Check browser console** - Look for network requests to `/api/auth/anonymous`
3. **Verify localStorage** - Should have `auth_token`, `token`, `authToken` with JWT
4. **Test manually:**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## Next Steps (If Needed)

1. Test journal entry creation end-to-end
2. Verify entries display in "My Entries" tab
3. Test with actual user login via AuthModal
4. Verify token refresh/expiration handling

## Architecture Understanding

**Auth Flow:**
1. User opens app → `unifiedUserSession.getAuthenticatedUserId()` called
2. No token found → calls `/api/auth/anonymous`
3. Server creates user, returns JWT token
4. Token stored in localStorage (3 keys for compatibility)
5. All subsequent API calls include `Authorization: Bearer <token>`
6. `unifiedAuthMiddleware` validates token and sets `req.userId`

**User Preference:** Step-by-step instructions, no long plans upfront.
