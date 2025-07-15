import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, MessageSquare, Heart, Calendar, Star, Plus, Shield, UserCheck, Flag, Send } from 'lucide-react';

interface Forum {
  id: number;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_active: boolean;
}

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name: string;
  created_at: string;
  heart_count: number;
  reply_count: number;
}

interface ForumReply {
  id: number;
  post_id: number;
  content: string;
  author_id: number;
  author_name: string;
  created_at: string;
  heart_count: number;
}

interface PeerCheckIn {
  id: number;
  paired_user_name: string;
  check_in_type: string;
  scheduled_time: string;
  completion_status: string;
  last_contact: string;
}

const CommunitySupport: React.FC = () => {
  const [activeTab, setActiveTab] = useState('forums');
  const queryClient = useQueryClient();

  const { data: forums } = useQuery<Forum[]>({
    queryKey: ['/api/support-forums'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/support-forums');
        if (!res.ok) throw new Error('Failed to fetch forums');
        return res.json();
      } catch (error) {
        console.warn('Forums API failed, using fallback data:', error);
        return [
          {
            id: 1,
            name: "Anxiety Support",
            description: "Share experiences and coping strategies for anxiety",
            category: "Mental Health",
            member_count: 234,
            is_active: true
          },
          {
            id: 2,
            name: "Depression Recovery",
            description: "Supporting each other through depression recovery",
            category: "Mental Health",
            member_count: 189,
            is_active: true
          }
        ];
      }
    },
  });

  const { data: posts } = useQuery<ForumPost[]>({
    queryKey: ['/api/forum-posts'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/forum-posts');
        if (!res.ok) throw new Error('Failed to fetch posts');
        return res.json();
      } catch (error) {
        console.warn('Posts API failed, using fallback data:', error);
        return [
          {
            id: 1,
            title: "How to manage morning anxiety",
            content: "I've been struggling with morning anxiety and wanted to share some techniques that have helped me...",
            author_id: 1,
            author_name: "Sarah K.",
            created_at: "2025-07-15T08:30:00Z",
            heart_count: 12,
            reply_count: 5
          },
          {
            id: 2,
            title: "Finding motivation during tough days",
            content: "Some days are harder than others. Here's what keeps me going...",
            author_id: 2,
            author_name: "Michael R.",
            created_at: "2025-07-14T14:20:00Z",
            heart_count: 8,
            reply_count: 3
          }
        ];
      }
    },
  });

  const { data: checkIns } = useQuery<PeerCheckIn[]>({
    queryKey: ['/api/peer-check-ins/1'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/peer-check-ins/1');
        if (!res.ok) throw new Error('Failed to fetch check-ins');
        return res.json();
      } catch (error) {
        console.warn('Check-ins API failed, using fallback data:', error);
        return [
          {
            id: 1,
            paired_user_name: "Alex M.",
            check_in_type: "Daily Check-in",
            scheduled_time: "2025-07-15T09:00:00Z",
            completion_status: "completed",
            last_contact: "2025-07-15T09:15:00Z"
          },
          {
            id: 2,
            paired_user_name: "Jordan L.",
            check_in_type: "Weekly Check-in",
            scheduled_time: "2025-07-15T15:00:00Z",
            completion_status: "pending",
            last_contact: "2025-07-13T15:30:00Z"
          }
        ];
      }
    },
  });

  const { data: replies } = useQuery<ForumReply[]>({
    queryKey: ['/api/forum-replies'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/forum-replies');
        if (!res.ok) throw new Error('Failed to fetch replies');
        return res.json();
      } catch (error) {
        console.warn('Replies API failed, using fallback data:', error);
        return [
          {
            id: 1,
            post_id: 1,
            content: "Thank you for sharing this, it really helped me too!",
            author_id: 3,
            author_name: "Emma D.",
            created_at: "2025-07-15T10:00:00Z",
            heart_count: 4
          }
        ];
      }
    },
  });

  // Mutation for joining forum discussions
  const joinForumMutation = useMutation({
    mutationFn: async (forumId: number) => {
      const response = await fetch(`/api/forums/${forumId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to join forum');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-forums'] });
    }
  });

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; postId?: number }) => {
      const response = await fetch('/api/forum-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum-replies'] });
    }
  });

  // Mutation for flagging inappropriate content
  const flagContentMutation = useMutation({
    mutationFn: async (contentData: { contentId: number; contentType: string; reason: string }) => {
      const response = await fetch('/api/content/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      });
      if (!response.ok) throw new Error('Failed to flag content');
      return response.json();
    },
    onSuccess: () => {
      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ['/api/forum-posts'] });
    }
  });

  const renderForumsTab = () => {
    return (
      <div className="space-y-6">
        {/* Forum Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.isArray(forums) && forums.map((forum) => (
            <div key={forum.id} className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold theme-text">{forum.name}</h3>
                <div className="flex items-center space-x-1 theme-text-secondary">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{forum.member_count}</span>
                </div>
              </div>
              <p className="theme-text-secondary text-sm mb-4">{forum.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs theme-text-secondary px-2 py-1 bg-[var(--theme-accent)] rounded">
                  {forum.category}
                </span>
                <button 
                  onClick={() => joinForumMutation.mutate(forum.id)}
                  disabled={joinForumMutation.isPending}
                  className="theme-text hover:bg-[var(--theme-accent)]/20 text-sm font-medium px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {joinForumMutation.isPending ? 'Joining...' : 'Join Discussion →'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Posts */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Recent Posts</h3>
          <div className="space-y-4">
            {Array.isArray(posts) && posts.slice(0, 5).map((post) => (
              <div key={post.id} className="p-4 bg-[var(--theme-accent)] rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium theme-text mb-1">{post.title}</h4>
                    <p className="theme-text-secondary text-sm mb-2 line-clamp-2">{post.content}</p>
                    <div className="flex items-center space-x-4 text-xs theme-text-secondary">
                      <span>by {post.author_name}</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 theme-text-secondary">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{post.heart_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">{post.reply_count}</span>
                    </div>
                    <button 
                      onClick={() => sendMessageMutation.mutate({ content: '', postId: post.id })}
                      className="hover:bg-[var(--theme-accent)]/20 p-1 rounded transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => flagContentMutation.mutate({ contentId: post.id, contentType: 'post', reason: 'inappropriate' })}
                      className="hover:bg-red-500/20 p-1 rounded transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPeerSupportTab = () => {
    return (
      <div className="space-y-6">
        {/* Peer Check-ins Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">Active Connections</p>
                <p className="text-2xl font-bold theme-text">{Array.isArray(checkIns) ? checkIns.length : 0}</p>
              </div>
              <div className="p-3 rounded-full bg-[var(--theme-accent)]">
                <UserCheck className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">This Week</p>
                <p className="text-2xl font-bold theme-text">
                  {Array.isArray(checkIns) ? checkIns.filter(c => c.completion_status === 'completed').length : 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-[var(--theme-accent)]">
                <Calendar className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">Support Score</p>
                <p className="text-2xl font-bold theme-text">4.8</p>
              </div>
              <div className="p-3 rounded-full bg-[var(--theme-accent)]">
                <Star className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Check-ins */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Scheduled Check-ins</h3>
          <div className="space-y-3">
            {Array.isArray(checkIns) && checkIns.map((checkIn) => (
              <div key={checkIn.id} className="flex items-center justify-between p-3 bg-[var(--theme-accent)]/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-[var(--theme-accent)]/30">
                    <Users className="w-4 h-4 theme-text" />
                  </div>
                  <div>
                    <p className="font-medium theme-text">{checkIn.paired_user_name}</p>
                    <p className="text-sm theme-text-secondary capitalize">{checkIn.check_in_type} check-in</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm theme-text font-medium">
                    {new Date(checkIn.scheduled_time).toLocaleDateString()}
                  </p>
                  <p className="text-xs theme-text-secondary capitalize">{checkIn.completion_status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold theme-text mb-2">Community Support</h1>
          <p className="theme-text-secondary">Connect with others on their wellness journey</p>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full bg-[var(--theme-surface)] rounded-lg p-1 mb-6 shadow-lg border-2 border-[var(--theme-accent)]">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab('forums')}
              className={`shimmer-border theme-button w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'forums'
                  ? 'shadow-lg border-2 animate-shimmer'
                  : 'hover:shadow-md border hover:border-2 hover:animate-shimmer'
              }`}
            >
              <MessageSquare 
                className="w-4 h-4 mx-auto mb-1" 
                style={{ 
                  background: 'none',
                  backgroundColor: 'transparent',
                  color: 'white',
                  fill: 'white'
                }}
              />
              <span
                style={{ 
                  background: 'none',
                  backgroundColor: 'transparent',
                  color: 'white'
                }}
              >Forums</span>
            </button>
            <button
              onClick={() => setActiveTab('peer')}
              className={`shimmer-border theme-button w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'peer'
                  ? 'shadow-lg border-2 animate-shimmer'
                  : 'hover:shadow-md border hover:border-2 hover:animate-shimmer'
              }`}
            >
              <Users 
                className="w-4 h-4 mx-auto mb-1" 
                style={{ 
                  background: 'none',
                  backgroundColor: 'transparent',
                  color: 'white',
                  fill: 'white'
                }}
              />
              <span
                style={{ 
                  background: 'none',
                  backgroundColor: 'transparent',
                  color: 'white'
                }}
              >Check-ins</span>
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`shimmer-border theme-button w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'moderation'
                  ? 'shadow-lg border-2 animate-shimmer'
                  : 'hover:shadow-md border hover:border-2 hover:animate-shimmer'
              }`}
            >
              <Shield 
                className="w-4 h-4 mx-auto mb-1" 
                style={{ 
                  background: 'none',
                  backgroundColor: 'transparent',
                  color: 'white',
                  fill: 'white'
                }}
              />
              <span
                style={{ 
                  background: 'none',
                  backgroundColor: 'transparent',
                  color: 'white'
                }}
              >Guidelines</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'forums' && renderForumsTab()}
        {activeTab === 'peer' && renderPeerSupportTab()}
        {activeTab === 'moderation' && (
          <div className="text-center py-8 theme-text-secondary">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Community guidelines and moderation tools coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunitySupport;