# Supabase Community Features Setup Guide

## Overview
This guide sets up a hybrid architecture where:
- **Current PostgreSQL Database**: Handles user accounts, journal entries, mood tracking, and core app functionality
- **Supabase**: Handles community features (forums, posts, replies, peer check-ins) with real-time capabilities

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Choose a project name (e.g., "chakrai-community")
4. Select a region close to your users
5. Set a strong database password

## Step 2: Get Supabase Credentials

After project creation, get these values from Settings > API:

```bash
# Add these to your Replit Secrets
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Run Database Schema

1. In Supabase Dashboard, go to SQL Editor
2. Copy and run the entire contents of `supabase-schema.sql`
3. This creates all necessary tables, indexes, and security policies

## Step 4: Configure Environment Variables

Add these secrets to your Replit project:

### Required Secrets:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key for frontend
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for backend

### Test Configuration:
```bash
# Test if Supabase is configured correctly
curl -X GET "https://your-project.supabase.co/rest/v1/forums" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

## Step 5: Database Architecture

### Current PostgreSQL (Unchanged):
- `users` - User accounts and authentication
- `user_profiles` - User profile data
- `journal_entries` - Personal journal entries
- `mood_entries` - Mood tracking data
- `therapeutic_goals` - Personal goals
- `user_achievements` - Gamification data
- All other existing therapeutic features

### New Supabase Tables:
- `forums` - Community forum categories
- `forum_posts` - User posts in forums
- `forum_replies` - Replies to forum posts
- `peer_checkins` - Peer support requests
- `content_moderation` - Content flagging system

## Step 6: Features Enabled

### Anonymous Forums:
- ✅ Safe, moderated discussion spaces
- ✅ Anonymous posting with generated usernames
- ✅ Crisis language detection
- ✅ Content flagging and moderation
- ✅ Real-time updates

### Peer Support:
- ✅ Peer-to-peer check-in requests
- ✅ Anonymous pairing system
- ✅ Crisis support connections
- ✅ Scheduled wellness check-ins

### Content Safety:
- ✅ Automatic crisis detection
- ✅ Content moderation workflows
- ✅ Row Level Security (RLS)
- ✅ Real-time monitoring

## Step 7: API Endpoints

The following endpoints are now available:

### Forums:
- `GET /api/community/forums` - List forums
- `POST /api/community/forums` - Create forum (admin)

### Posts:
- `GET /api/community/forums/:id/posts` - Get forum posts
- `POST /api/community/forums/:id/posts` - Create post
- `GET /api/community/posts/:id/replies` - Get replies
- `POST /api/community/posts/:id/replies` - Create reply

### Support:
- `POST /api/community/support` - Add heart/support
- `POST /api/community/flag-content` - Flag content

### Peer Check-ins:
- `GET /api/community/peer-checkins/:userId` - User's check-ins
- `GET /api/community/peer-checkins/available` - Available partners
- `POST /api/community/peer-checkins` - Request check-in

## Step 8: Real-time Features

Supabase provides real-time subscriptions for:
- New forum posts
- New replies
- Peer check-in matches
- Content moderation alerts

## Step 9: Testing

1. Restart your Replit project after adding secrets
2. Navigate to Community section in your app
3. Test forum creation, posting, and replying
4. Verify real-time updates work
5. Test crisis detection and content flagging

## Security Considerations

1. **Row Level Security**: Enabled on all tables
2. **Anonymous Protection**: User IDs are not exposed in community features
3. **Content Moderation**: Automatic flagging for harmful content
4. **Crisis Detection**: Immediate intervention for crisis language
5. **Rate Limiting**: Consider implementing API rate limits

## Monitoring

Monitor community health through:
- Supabase Dashboard for database metrics
- Content moderation queue
- Crisis detection alerts
- User engagement analytics

## Scaling Considerations

- Supabase handles up to 500MB free tier
- Real-time connections: up to 200 concurrent
- Consider upgrading for production use
- Implement caching for heavy traffic

## Troubleshooting

### Common Issues:
1. **403 Errors**: Check RLS policies and API keys
2. **Connection Issues**: Verify environment variables
3. **Real-time Not Working**: Check Supabase real-time settings
4. **Anonymous Posts Failing**: Verify anonymous_name generation

### Debug Mode:
Enable debug logging by setting `DEBUG=true` in environment variables.