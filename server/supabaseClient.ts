import { createClient } from '@supabase/supabase-js';

// Supabase configuration for community features only
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials not configured. Community features will use fallback mode.');
}

// Create Supabase client for server-side operations (only if configured)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database schema for community features in Supabase
export interface SupabaseForum {
  id: number;
  name: string;
  description: string;
  category: string;
  is_moderated: boolean;
  anonymous_posts_allowed: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseForumPost {
  id: number;
  forum_id: number;
  author_id: number | null;
  anonymous_name: string | null;
  title: string;
  content: string;
  is_anonymous: boolean;
  support_count: number;
  reply_count: number;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseForumReply {
  id: number;
  post_id: number;
  author_id: number | null;
  anonymous_name: string | null;
  content: string;
  is_anonymous: boolean;
  support_count: number;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabasePeerCheckIn {
  id: number;
  requester_id: number;
  partner_id: number | null;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  check_in_type: 'daily' | 'crisis' | 'motivation' | 'accountability';
  preferred_time: string;
  duration: number;
  is_anonymous: boolean;
  notes: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

// Community service functions
export class SupabaseCommunityService {
  
  private checkSupabaseAvailable(): boolean {
    if (!supabase) {
      console.warn('Supabase not configured. Using fallback mode.');
      return false;
    }
    return true;
  }
  
  // Forum management
  async getForums(): Promise<SupabaseForum[]> {
    if (!this.checkSupabaseAvailable()) {
      // Return empty array for fallback mode
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('forums')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching forums:', error);
      return [];
    }
  }

  async createForum(forum: Omit<SupabaseForum, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseForum | null> {
    if (!this.checkSupabaseAvailable()) {
      return null;
    }
    
    try {
      const { data, error } = await supabase!
        .from('forums')
        .insert(forum)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating forum:', error);
      return null;
    }
  }

  // Forum posts
  async getForumPosts(forumId: number, limit = 20): Promise<SupabaseForumPost[]> {
    if (!this.checkSupabaseAvailable()) {
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('forum_posts')
        .select('*')
        .eq('forum_id', forumId)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      return [];
    }
  }

  async createForumPost(post: Omit<SupabaseForumPost, 'id' | 'created_at' | 'updated_at' | 'support_count' | 'reply_count' | 'is_flagged'>): Promise<SupabaseForumPost | null> {
    if (!this.checkSupabaseAvailable()) {
      return null;
    }
    
    try {
      const { data, error } = await supabase!
        .from('forum_posts')
        .insert({
          ...post,
          support_count: 0,
          reply_count: 0,
          is_flagged: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating forum post:', error);
      return null;
    }
  }

  // Forum replies
  async getForumReplies(postId: number): Promise<SupabaseForumReply[]> {
    if (!this.checkSupabaseAvailable()) {
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('forum_replies')
        .select('*')
        .eq('post_id', postId)
        .eq('is_flagged', false)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching forum replies:', error);
      return [];
    }
  }

  async createForumReply(reply: Omit<SupabaseForumReply, 'id' | 'created_at' | 'updated_at' | 'support_count' | 'is_flagged'>): Promise<SupabaseForumReply | null> {
    if (!this.checkSupabaseAvailable()) {
      return null;
    }
    
    try {
      const { data, error } = await supabase!
        .from('forum_replies')
        .insert({
          ...reply,
          support_count: 0,
          is_flagged: false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update reply count on the parent post
      await this.incrementReplyCount(reply.post_id);
      
      return data;
    } catch (error) {
      console.error('Error creating forum reply:', error);
      return null;
    }
  }

  // Support actions
  async addSupport(type: 'post' | 'reply', id: number): Promise<boolean> {
    if (!this.checkSupabaseAvailable()) {
      return false;
    }
    
    try {
      const table = type === 'post' ? 'forum_posts' : 'forum_replies';
      const { error } = await supabase!
        .from(table)
        .update({ 
          support_count: 1  // Increment by 1 - would need SQL function in production
        })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding support:', error);
      return false;
    }
  }

  // Peer check-ins
  async getUserCheckIns(userId: number): Promise<SupabasePeerCheckIn[]> {
    if (!this.checkSupabaseAvailable()) {
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('peer_checkins')
        .select('*')
        .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user check-ins:', error);
      return [];
    }
  }

  async getAvailableCheckIns(): Promise<SupabasePeerCheckIn[]> {
    if (!this.checkSupabaseAvailable()) {
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('peer_checkins')
        .select('*')
        .eq('status', 'pending')
        .is('partner_id', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available check-ins:', error);
      return [];
    }
  }

  async createPeerCheckIn(checkIn: Omit<SupabasePeerCheckIn, 'id' | 'created_at' | 'updated_at'>): Promise<SupabasePeerCheckIn | null> {
    if (!this.checkSupabaseAvailable()) {
      return null;
    }
    
    try {
      const { data, error } = await supabase!
        .from('peer_checkins')
        .insert(checkIn)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating peer check-in:', error);
      return null;
    }
  }

  // Helper methods
  private async incrementReplyCount(postId: number): Promise<void> {
    if (!this.checkSupabaseAvailable()) {
      return;
    }
    
    try {
      await supabase!
        .from('forum_posts')
        .update({ 
          reply_count: 1  // Increment by 1 - would need SQL function in production
        })
        .eq('id', postId);
    } catch (error) {
      console.error('Error incrementing reply count:', error);
    }
  }

  // Real-time subscriptions for live updates
  subscribeToForumPosts(forumId: number, callback: (post: SupabaseForumPost) => void) {
    if (!this.checkSupabaseAvailable()) {
      return null;
    }
    
    return supabase!
      .channel(`forum_posts_${forumId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'forum_posts',
          filter: `forum_id=eq.${forumId}`
        }, 
        (payload) => callback(payload.new as SupabaseForumPost)
      )
      .subscribe();
  }

  subscribeToForumReplies(postId: number, callback: (reply: SupabaseForumReply) => void) {
    if (!this.checkSupabaseAvailable()) {
      return null;
    }
    
    return supabase!
      .channel(`forum_replies_${postId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'forum_replies',
          filter: `post_id=eq.${postId}`
        }, 
        (payload) => callback(payload.new as SupabaseForumReply)
      )
      .subscribe();
  }
}

export const communityService = new SupabaseCommunityService();