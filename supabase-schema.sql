-- Supabase Database Schema for Community Features
-- Run this in your Supabase SQL editor to create the necessary tables

-- Enable Row Level Security (RLS)
-- Forums table
CREATE TABLE IF NOT EXISTS forums (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_moderated BOOLEAN DEFAULT true,
  anonymous_posts_allowed BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id BIGSERIAL PRIMARY KEY,
  forum_id BIGINT REFERENCES forums(id) ON DELETE CASCADE,
  author_id BIGINT NULL, -- NULL for anonymous posts
  anonymous_name TEXT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  support_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id BIGINT NULL, -- NULL for anonymous replies
  anonymous_name TEXT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  support_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer check-ins table
CREATE TABLE IF NOT EXISTS peer_checkins (
  id BIGSERIAL PRIMARY KEY,
  requester_id BIGINT NOT NULL,
  partner_id BIGINT NULL,
  status TEXT CHECK (status IN ('pending', 'matched', 'completed', 'cancelled')) DEFAULT 'pending',
  check_in_type TEXT CHECK (check_in_type IN ('daily', 'crisis', 'motivation', 'accountability')) NOT NULL,
  preferred_time TEXT,
  duration INTEGER DEFAULT 30, -- minutes
  is_anonymous BOOLEAN DEFAULT false,
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content moderation table
CREATE TABLE IF NOT EXISTS content_moderation (
  id BIGSERIAL PRIMARY KEY,
  content_type TEXT CHECK (content_type IN ('post', 'reply')) NOT NULL,
  content_id BIGINT NOT NULL,
  reported_by BIGINT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_forum_id ON forum_posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);
CREATE INDEX IF NOT EXISTS idx_peer_checkins_status ON peer_checkins(status);
CREATE INDEX IF NOT EXISTS idx_peer_checkins_requester ON peer_checkins(requester_id);

-- Create triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forums_updated_at BEFORE UPDATE ON forums 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_peer_checkins_updated_at BEFORE UPDATE ON peer_checkins 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default forums
INSERT INTO forums (name, description, category, is_moderated, anonymous_posts_allowed) VALUES
('General Support', 'A safe space for general mental health discussions and mutual support', 'general', true, true),
('Anxiety & Stress', 'Share experiences and coping strategies for anxiety and stress management', 'anxiety', true, true),
('Depression Support', 'Connect with others who understand depression and share supportive resources', 'depression', true, true),
('Crisis Support', 'Immediate peer support for those in crisis - monitored 24/7', 'crisis', true, true),
('Mindfulness & Meditation', 'Discuss mindfulness practices, meditation techniques, and inner peace', 'mindfulness', true, true),
('Recovery Journey', 'Share stories of recovery, setbacks, and progress in mental health', 'recovery', true, true)
ON CONFLICT DO NOTHING;

-- Functions for atomic operations

-- Function to increment support count
CREATE OR REPLACE FUNCTION increment_support_count(table_name TEXT, row_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF table_name = 'forum_posts' THEN
    UPDATE forum_posts SET support_count = support_count + 1 WHERE id = row_id;
  ELSIF table_name = 'forum_replies' THEN
    UPDATE forum_replies SET support_count = support_count + 1 WHERE id = row_id;
  ELSE
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment reply count
CREATE OR REPLACE FUNCTION increment_reply_count(post_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE forum_posts SET reply_count = reply_count + 1 WHERE id = post_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for privacy
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your authentication system)
-- Allow all authenticated users to read forums
CREATE POLICY "Forums are viewable by authenticated users" ON forums
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to read posts (excluding flagged content)
CREATE POLICY "Posts are viewable by authenticated users" ON forum_posts
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT is_flagged);

-- Allow authenticated users to create posts
CREATE POLICY "Authenticated users can create posts" ON forum_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to read replies (excluding flagged content)
CREATE POLICY "Replies are viewable by authenticated users" ON forum_replies
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT is_flagged);

-- Allow authenticated users to create replies
CREATE POLICY "Authenticated users can create replies" ON forum_replies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Peer check-ins policies
CREATE POLICY "Users can view their own check-ins" ON peer_checkins
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create check-ins" ON peer_checkins
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Content moderation policies (restrict to moderators in production)
CREATE POLICY "Moderators can view all moderation requests" ON content_moderation
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can report content" ON content_moderation
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');