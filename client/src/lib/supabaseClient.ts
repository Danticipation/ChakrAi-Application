import { createClient } from '@supabase/supabase-js';

// Supabase configuration for frontend community features
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Community features will use API fallback mode.');
}

// Create Supabase client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Helper function to check if Supabase is available
export const isSupabaseAvailable = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Real-time hooks for community features
export const useRealtimeForumPosts = (forumId: number, onNewPost: (post: any) => void) => {
  if (!isSupabaseAvailable()) return null;
  
  return supabase
    .channel(`forum_posts_${forumId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'forum_posts',
        filter: `forum_id=eq.${forumId}`
      }, 
      (payload) => onNewPost(payload.new)
    )
    .subscribe();
};

export const useRealtimeForumReplies = (postId: number, onNewReply: (reply: any) => void) => {
  if (!isSupabaseAvailable()) return null;
  
  return supabase
    .channel(`forum_replies_${postId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'forum_replies',
        filter: `post_id=eq.${postId}`
      }, 
      (payload) => onNewReply(payload.new)
    )
    .subscribe();
};

// Anonymous user management for community features
export const generateAnonymousName = (): string => {
  const adjectives = [
    'Kind', 'Gentle', 'Caring', 'Warm', 'Bright', 'Peaceful', 'Strong', 
    'Brave', 'Hopeful', 'Wise', 'Thoughtful', 'Compassionate', 'Resilient'
  ];
  
  const nouns = [
    'Heart', 'Soul', 'Spirit', 'Light', 'Star', 'Dawn', 'River', 
    'Mountain', 'Garden', 'Ocean', 'Butterfly', 'Phoenix', 'Rainbow'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
};

// Crisis detection for community posts
export const detectCrisisLanguage = (text: string): boolean => {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'hopeless', 'worthless', 
    'can\'t go on', 'hurt myself', 'self harm', 'want to die', 'no point',
    'give up', 'nothing left', 'done with life', 'better off dead'
  ];
  
  const lowerText = text.toLowerCase();
  return crisisKeywords.some(keyword => lowerText.includes(keyword));
};

// Content moderation helpers
export const flagContent = async (type: 'post' | 'reply', id: number, reason: string, details?: string) => {
  try {
    const response = await fetch('/api/community/flag-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        contentId: id,
        reason,
        details
      })
    });
    
    if (!response.ok) throw new Error('Failed to flag content');
    return await response.json();
  } catch (error) {
    console.error('Error flagging content:', error);
    throw error;
  }
};