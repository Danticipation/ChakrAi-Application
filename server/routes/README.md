# Modular Routes Architecture

This directory contains the modularized route structure for Chakrai's backend API. The previous monolithic `routes.js` file (924 lines) has been broken down into logical, maintainable modules.

## Structure

```
server/routes/
├── index.js           # Main router that combines all modules
├── chat.js           # Chat, conversation, and voice transcription endpoints
├── user.js           # User management, profiles, and data operations
├── mood.js           # Mood tracking and analytics
├── memory.js         # Semantic memory and conversation continuity
├── content.js        # Content generation (affirmations, horoscopes, summaries)
├── analytics.js      # User analytics, stats, and personality reflection
├── admin.js          # Admin dashboard and system management
├── community.js      # Community features and Supabase integration
├── voice.js          # Voice synthesis (TTS) and enhanced transcription
└── README.md         # This documentation file
```

## Route Modules

### 1. Chat Routes (`chat.js`)
- `POST /api/chat` - Main chat endpoint with AI integration
- `GET /api/chat/history/:userId?` - Conversation history
- `POST /api/transcribe` - Voice transcription with OpenAI Whisper
- Crisis detection and semantic memory integration

### 2. User Routes (`user.js`) 
- `POST /api/clear-user-data` - Clear all user data
- `GET /api/user/current` - Get current user info
- `GET /api/user/profile/:userId?` - User profile management
- `POST /api/user-profile` - Create/update user profile
- `DELETE /api/users/:userId/*` - Delete specific user data

### 3. Mood Routes (`mood.js`)
- `POST /api/mood` - Track mood entries
- `GET /api/mood/history/:userId` - Mood history
- `GET /api/mood/analytics/:userId` - Mood analytics and trends

### 4. Memory Routes (`memory.js`)
- `GET /api/memory/dashboard` - Memory dashboard data
- `GET /api/memory/conversation-continuity` - Cross-session context data

### 5. Content Routes (`content.js`)
- `GET /api/daily-affirmation` - Generate daily affirmations
- `GET /api/weekly-summary` - Weekly wellness summaries
- `GET /api/horoscope/:sign` - Therapeutic horoscope content

### 6. Analytics Routes (`analytics.js`)
- `GET /api/stats/:userId?` - User statistics
- `GET /api/bot-stats/:userId` - Bot interaction stats
- `GET /api/personality-reflection/:userId?` - Personality analysis
- `GET /api/analytics/engagement/:userId` - User engagement metrics

### 7. Admin Routes (`admin.js`)
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/health` - System health checks
- `GET /api/admin/users` - User management
- `GET /api/admin/analytics` - System-wide analytics

### 8. Community Routes (`community.js`)
- `GET /api/community/forums` - Forum listings
- `GET /api/community/forums/:forumId/posts` - Forum posts
- `POST /api/community/forums/:forumId/posts` - Create posts
- `POST /api/community/posts/:postId/replies` - Create replies
- `GET /api/community/checkins` - Peer check-ins
- `POST /api/community/checkins` - Create check-ins

### 9. Voice Routes (`voice.js`)
- `POST /api/voice/text-to-speech` - ElevenLabs TTS with voice mapping
- `POST /api/voice/transcribe-enhanced` - Enhanced transcription with audio quality analysis
- `GET /api/voice/voices` - Available voice options and descriptions

## Benefits of Modular Structure

### 1. Maintainability
- Each route module focuses on a single domain
- Easier to locate and modify specific functionality
- Reduced file size makes code review more manageable

### 2. Scalability
- New features can be added to appropriate modules
- Team members can work on different modules simultaneously
- Clear separation of concerns

### 3. Testing
- Each module can be tested independently
- Easier to mock dependencies for unit tests
- Better test organization

### 4. Code Organization
- Related functionality is grouped together
- Consistent import structure across modules
- Easier onboarding for new developers

## Migration Notes

The original `routes.js` file (924 lines) has been replaced with this modular structure. The main `routes.js` now simply imports and exports the modular routes system for backward compatibility.

### Legacy Support
All existing endpoints continue to work exactly as before. The modular structure maintains complete backward compatibility while providing the foundation for future development.

### Adding New Routes
To add new routes:
1. Identify the appropriate module (or create a new one)
2. Add the route to the module using Express router syntax
3. Update the main `index.js` file if creating a new module
4. Update this documentation

## Example Usage

```javascript
// Adding a new chat-related endpoint
// File: server/routes/chat.js

router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { message } = req.body;
    // Implementation here
    res.json({ sentiment: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});
```

## Dependencies

Each module imports only the dependencies it needs:
- `express` - Core routing functionality
- `../storage.js` - Database operations
- `../openaiRetry.js` - OpenAI API integration
- `../userSession.js` - User session management
- `../semanticMemory.js` - Memory and context operations
- `../conversationContinuity.js` - Cross-session continuity

This modular approach reduces coupling and makes the codebase more maintainable.