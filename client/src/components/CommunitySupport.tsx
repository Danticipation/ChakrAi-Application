import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, MessageSquare, Heart, Calendar, Star, Plus, Shield, UserCheck, Flag, Send, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  forum_id: number;
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

interface User {
  id: number;
  name: string;
  isAuthenticated: boolean;
}

interface CommunitySupportProps {
  currentUser?: User;
}

// Utility Components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="text-center py-8">
    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
    <p className="text-gray-600 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 mx-auto hover:bg-blue-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    )}
  </div>
);

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description,
  actionLabel,
  onAction
}: { 
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="text-center py-12">
    <Icon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
    <h3 className="text-lg font-semibold text-gray-600 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-md mx-auto mb-4">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

const CommunitySupport: React.FC<CommunitySupportProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('forums');
  const [selectedForum, setSelectedForum] = useState<number | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyingToPost, setReplyingToPost] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [flaggingContent, setFlaggingContent] = useState<{id: number, type: string} | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagDetails, setFlagDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();



  // Authentication check
  if (!currentUser?.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access community support features</p>
        </div>
      </div>
    );
  }

  // Flag reasons specific to mental health communities
  const flagReasons = useMemo(() => [
    { value: 'harmful_advice', label: 'Potentially harmful medical/mental health advice' },
    { value: 'crisis_content', label: 'Crisis situation requiring immediate attention' },
    { value: 'spam', label: 'Spam or promotional content' },
    { value: 'harassment', label: 'Harassment or inappropriate behavior' },
    { value: 'misinformation', label: 'Medical misinformation' },
    { value: 'other', label: 'Other (please specify)' }
  ], []);

  // Data fetching with proper error handling and safe defaults
  const { data: forums = [], isLoading: forumsLoading, error: forumsError, refetch: refetchForums } = useQuery({
    queryKey: ['/api/community/forums'],
    queryFn: async () => {
      console.log('Fetching forums...');
      const res = await fetch('/api/community/forums', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      if (!res.ok) {
        console.error('Forums fetch failed:', res.status);
        throw new Error('Failed to fetch forums');
      }
      const data = await res.json();
      console.log('Forums fetched:', data);
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: posts = [], isLoading: postsLoading, error: postsError, refetch: refetchPosts } = useQuery<ForumPost[]>({
    queryKey: ['/api/community/posts'],
    queryFn: async () => {
      console.log('Fetching posts...');
      const res = await fetch('/api/community/posts');
      if (!res.ok) {
        console.error('Posts fetch failed:', res.status);
        throw new Error('Failed to fetch posts');
      }
      const data = await res.json();
      console.log('Posts fetched:', data);
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: checkIns, isLoading: checkInsLoading, error: checkInsError, refetch: refetchCheckIns } = useQuery<PeerCheckIn[]>({
    queryKey: ['/api/peer-check-ins', currentUser.id],
    queryFn: async () => {
      const res = await fetch(`/api/peer-check-ins/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      if (!res.ok) throw new Error('Failed to fetch check-ins');
      return res.json();
    },
  });

  const { data: replies, isLoading: repliesLoading, error: repliesError, refetch: refetchReplies } = useQuery<ForumReply[]>({
    queryKey: ['/api/forum-replies'],
    queryFn: async () => {
      const res = await fetch('/api/forum-replies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      if (!res.ok) throw new Error('Failed to fetch replies');
      return res.json();
    },
  });

  // Enhanced mutations with proper error handling
  const joinForumMutation = useMutation({
    mutationFn: async (forumId: number) => {
      console.log('=== MUTATION STARTED ===');
      console.log('Forum ID:', forumId);
      console.log('Current User:', currentUser);
      
      if (!currentUser || !currentUser.id) {
        console.log('ERROR: No current user');
        throw new Error('User authentication required');
      }
      
      console.log('Making request to:', `/api/forums/${forumId}/join`);
      console.log('Request body:', { userId: currentUser.id });
      
      const response = await fetch(`/api/forums/${forumId}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to join forum');
      }
      
      const result = await response.json();
      console.log('Success response:', result);
      return { ...result, forumId }; // Include forumId in the result
    },
    onSuccess: (data) => {
      console.log('=== JOIN SUCCESS ===');
      console.log('Joined forum ID:', data.forumId);
      
      // Set the selected forum to show its content
      setSelectedForum(data.forumId);
      
      // Clear any previous errors
      setError(null);
      
      // Show success message
      toast({
        title: "Forum Joined Successfully!",
        description: "You can now view and create posts in this forum.",
        duration: 3000,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/community/forums'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      
      console.log('Selected forum set to:', data.forumId);
    },
    onError: (error) => {
      const errorMessage = `Failed to join forum: ${error.message}`;
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Create post mutation with enhanced debugging
  const createPostMutation = useMutation({
    mutationFn: async (postData: { title: string; content: string; forumId: number }) => {
      console.log('=== CREATE POST MUTATION ===');
      console.log('Post data:', postData);
      
      if (!postData.title.trim() || !postData.content.trim()) {
        throw new Error('Title and content are required');
      }
      
      const requestBody = {
        title: postData.title,
        content: postData.content,
        forum_id: postData.forumId,
        author_id: currentUser?.id || 1,
        author_name: `Anonymous User ${currentUser?.id || 1}`,
        is_anonymous: true,
        anonymous_name: `User${Math.floor(Math.random() * 1000)}`
      };
      
      console.log('Request body:', requestBody);
      console.log('Making request to /api/community/posts');
      
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Create post response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Create post error:', errorData);
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      const result = await response.json();
      console.log('Create post success:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('=== CREATE POST SUCCESS ===');
      console.log('Created post:', data);
      
      setShowNewPost(false);
      setNewPostTitle('');
      setNewPostContent('');
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community/forums'] });
      
      toast({
        title: "Post Created Successfully!",
        description: "Your post has been shared with the community.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('=== CREATE POST ERROR ===');
      console.error('Error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Fixed message sending mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; postId: number }) => {
      if (!messageData.content.trim()) {
        throw new Error('Message content cannot be empty');
      }
      const response = await fetch('/api/forum-messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          ...messageData,
          authorId: currentUser.id,
          content: messageData.content.trim(),
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum-replies'] });
      setError(null);
      toast({
        title: "Success",
        description: "Reply posted successfully!",
        duration: 3000,
      });
    },
    onError: (error) => {
      const errorMessage = `Failed to send reply: ${error.message}`;
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Enhanced flagging mutation
  const flagContentMutation = useMutation({
    mutationFn: async (contentData: { contentId: number; contentType: string; reason: string; details?: string }) => {
      const response = await fetch('/api/content/flag', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          ...contentData,
          reportedBy: currentUser.id,
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to flag content');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum-posts'] });
      setError(null);
      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe. The content has been reported for review.",
        duration: 5000,
      });
    },
    onError: (error) => {
      const errorMessage = `Failed to report content: ${error.message}`;
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Helper functions
  const handleReplySubmit = useCallback((postId: number) => {
    if (replyContent.trim()) {
      sendMessageMutation.mutate({ 
        content: replyContent.trim(), 
        postId: postId 
      });
      setReplyContent('');
      setReplyingToPost(null);
    } else {
      toast({
        title: "Validation Error",
        description: "Please enter a reply before submitting",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [replyContent, sendMessageMutation, toast]);

  const handleFlagSubmit = useCallback(() => {
    if (flagReason && flaggingContent) {
      flagContentMutation.mutate({
        contentId: flaggingContent.id,
        contentType: flaggingContent.type,
        reason: flagReason,
        details: flagDetails
      });
      setFlaggingContent(null);
      setFlagReason('');
      setFlagDetails('');
    }
  }, [flagReason, flaggingContent, flagDetails, flagContentMutation]);

  // Reply Composer Component
  const ReplyComposer = ({ postId, onClose }: { postId: number; onClose: () => void }) => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
      <textarea
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Share your thoughts or offer support..."
        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:border-blue-300 focus:outline-none"
        rows={3}
        aria-label="Reply content"
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handleReplySubmit(postId)}
          disabled={!replyContent.trim() || sendMessageMutation.isPending}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          aria-label="Submit reply"
        >
          {sendMessageMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Reply'
          )}
        </button>
        <button
          onClick={onClose}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
          aria-label="Cancel reply"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Flag Modal Component
  const FlagModal = () => (
    flaggingContent ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Report Content</h3>
            <button
              onClick={() => {
                setFlaggingContent(null);
                setFlagReason('');
                setFlagDetails('');
              }}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Help us maintain a safe, supportive community by reporting content that violates our guidelines.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="flag-reason">
                Reason for reporting
              </label>
              <select 
                id="flag-reason"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-300 focus:outline-none"
                aria-label="Select reason for reporting"
              >
                <option value="">Select a reason...</option>
                {flagReasons.map(reason => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
            
            {flagReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="flag-details">
                  Additional details (optional)
                </label>
                <textarea
                  id="flag-details"
                  value={flagDetails}
                  onChange={(e) => setFlagDetails(e.target.value)}
                  placeholder="Please provide additional details..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-300 focus:outline-none resize-none"
                  rows={3}
                  aria-label="Additional details for report"
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setFlaggingContent(null);
                setFlagReason('');
                setFlagDetails('');
              }}
              className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              aria-label="Cancel report"
            >
              Cancel
            </button>
            <button
              onClick={handleFlagSubmit}
              disabled={!flagReason || flagContentMutation.isPending}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              aria-label="Submit report"
            >
              {flagContentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                'Report'
              )}
            </button>
          </div>
        </div>
      </div>
    ) : null
  );

  const renderForumsTab = () => {
    if (forumsLoading || postsLoading) return <LoadingSpinner />;
    
    if (forumsError) {
      return <ErrorMessage message="Unable to load forums. Please try again." onRetry={refetchForums} />;
    }
    
    if (postsError) {
      return <ErrorMessage message="Unable to load posts. Please try again." onRetry={refetchPosts} />;
    }

    return (
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-1"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}





        {/* Selected Forum Interface */}
        {selectedForum && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedForum(null)}
                  className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-2"
                >
                  â† Back to Forums
                </button>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {forums?.find(f => f.id === selectedForum)?.name || `Forum ${selectedForum}`}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {forums?.find(f => f.id === selectedForum)?.description}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  console.log('ðŸ“ New Post button clicked!');
                  console.log('Current showNewPost state:', showNewPost);
                  setShowNewPost(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                New Post
              </button>
            </div>

            {/* New Post Form - Enhanced with Debug */}
            {showNewPost && (
              <div className="mb-6 p-6 border-2 border-blue-500 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-blue-900">âœï¸ Create New Post</h4>
                  <button
                    onClick={() => {
                      console.log('âŒ Cancel new post clicked');
                      setShowNewPost(false);
                      setNewPostTitle('');
                      setNewPostContent('');
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    âœ• Cancel
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Post Title
                    </label>
                    <input
                      type="text"
                      placeholder="What would you like to discuss?"
                      value={newPostTitle}
                      onChange={(e) => {
                        console.log('Title changed:', e.target.value);
                        setNewPostTitle(e.target.value);
                      }}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Your Message
                    </label>
                    <textarea
                      placeholder="Share your thoughts, experiences, or ask for support..."
                      value={newPostContent}
                      onChange={(e) => {
                        console.log('Content changed:', e.target.value.substring(0, 50) + '...');
                        setNewPostContent(e.target.value);
                      }}
                      rows={4}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        console.log('ðŸ“¤ Submit post clicked!');
                        console.log('Title:', newPostTitle);
                        console.log('Content:', newPostContent);
                        console.log('Forum ID:', selectedForum);
                        
                        if (!newPostTitle.trim()) {
                          console.log('âŒ Title is empty');
                          toast({
                            title: "Title Required",
                            description: "Please enter a title for your post",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        if (!newPostContent.trim()) {
                          console.log('âŒ Content is empty');
                          toast({
                            title: "Content Required", 
                            description: "Please enter some content for your post",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        console.log('âœ… Validation passed, calling mutation...');
                        createPostMutation.mutate({ 
                          title: newPostTitle.trim(), 
                          content: newPostContent.trim(), 
                          forumId: selectedForum 
                        });
                      }}
                      disabled={createPostMutation.isPending || !newPostTitle.trim() || !newPostContent.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {createPostMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Create Post
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log('Cancel post creation');
                        setShowNewPost(false);
                        setNewPostTitle('');
                        setNewPostContent('');
                      }}
                      className="px-6 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Forum Posts */}
            <div className="space-y-4">
              {posts?.filter(p => p.forum_id === selectedForum).length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Posts Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Be the first to start a meaningful conversation in this forum. Your post could help someone who needs support.
                  </p>
                  <button
                    onClick={() => {
                      console.log('ðŸš€ Create First Post clicked!');
                      console.log('Current showNewPost state:', showNewPost);
                      console.log('Setting showNewPost to true...');
                      setShowNewPost(true);
                      console.log('showNewPost should now be:', true);
                    }}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Create First Post
                  </button>
                </div>
              ) : (
                posts?.filter(p => p.forum_id === selectedForum).map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">{post.title}</h4>
                    <p className="text-gray-600 mb-4 leading-relaxed">{post.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>By {post.author_name}</span>
                      <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          {post.heart_count || 0}
                        </span>
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          {post.reply_count || 0} replies
                        </span>
                        <button
                          onClick={() => setReplyingToPost(post.id)}
                          className="text-blue-500 hover:text-blue-600 font-medium"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                    
                    {/* Reply Form */}
                    {replyingToPost === post.id && (
                      <div className="border-t pt-4 mt-4">
                        <textarea
                          placeholder="Write a supportive reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => sendMessageMutation.mutate({ 
                              content: replyContent, 
                              postId: post.id 
                            })}
                            disabled={sendMessageMutation.isPending || !replyContent.trim()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {sendMessageMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Reply
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setReplyingToPost(null);
                              setReplyContent('');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}



        {/* Only show forum grid if no forum is selected */}
        {!selectedForum && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Choose a Forum</h2>
            
            {/* Forum Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forums && forums.length > 0 ? (
            forums.map((forum) => (
              <div key={forum.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{forum.name}</h3>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{forum.member_count || 0}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{forum.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    {forum.category}
                  </span>
                  <button 
                    onClick={() => {
                      console.log('Join Discussion clicked for forum:', forum.id, forum.name);
                      setSelectedForum(forum.id);
                      joinForumMutation.mutate(forum.id);
                    }}
                    disabled={joinForumMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {joinForumMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                      </div>
                    ) : (
                      'Join Discussion â†’'
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2">
              <EmptyState 
                icon={MessageSquare}
                title="No Forums Available"
                description="Forums are loading or not available at the moment. Please check back later."
              />
            </div>
          )}
            </div>
          </>
        )}

        {/* Recent Posts (Only show when no forum selected) */}
        {!selectedForum && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Posts</h3>
            <div className="space-y-4">
              {!posts || posts.length === 0 ? (
                <EmptyState 
                  icon={MessageSquare}
                  title="No Posts Yet"
                  description="Be the first to start a conversation and share your experience with the community."
                  actionLabel="Join a Forum"
                  onAction={() => {}}
                />
              ) : (
                posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">{post.title}</h4>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{post.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>by {post.author_name}</span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{post.heart_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm">{post.reply_count}</span>
                        </div>
                        <button 
                          onClick={() => setReplyingToPost(post.id)}
                          className="hover:bg-blue-500/20 p-1 rounded transition-colors"
                          aria-label="Reply to this post"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setFlaggingContent({ id: post.id, type: 'post' })}
                          className="hover:bg-red-500/20 p-1 rounded transition-colors"
                          aria-label="Report this post"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {replyingToPost === post.id && (
                      <ReplyComposer 
                        postId={post.id} 
                        onClose={() => setReplyingToPost(null)} 
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPeerSupportTab = () => {
    if (checkInsLoading) return <LoadingSpinner />;
    
    if (checkInsError) {
      return <ErrorMessage message="Unable to load peer check-ins. Please try again." onRetry={refetchCheckIns} />;
    }

    return (
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-1"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Peer Check-ins Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Connections</p>
                <p className="text-2xl font-bold text-gray-800">{checkIns ? checkIns.length : 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <UserCheck className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-2xl font-bold text-gray-800">
                  {checkIns ? checkIns.filter(c => c.completion_status === 'completed').length : 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Support Score</p>
                <p className="text-2xl font-bold text-gray-800">4.8</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Check-ins */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Scheduled Check-ins</h3>
          <div className="space-y-3">
            {!checkIns || checkIns.length === 0 ? (
              <EmptyState 
                icon={Users}
                title="No Check-ins Scheduled"
                description="Connect with peers for mutual support and accountability. Schedule your first check-in to get started."
                actionLabel="Find Peer Support"
                onAction={() => {
                  toast({
                    title: "Feature Coming Soon",
                    description: "Peer matching will be available soon!",
                    duration: 3000,
                  });
                }}
              />
            ) : (
              checkIns.map((checkIn) => (
                <div key={checkIn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-50">
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{checkIn.paired_user_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{checkIn.check_in_type} check-in</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-800 font-medium">
                      {new Date(checkIn.scheduled_time).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{checkIn.completion_status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Community Support</h1>
          <p className="text-gray-600">Connect with others on their wellness journey</p>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full bg-white rounded-lg p-1 mb-6 shadow-sm border border-gray-200" role="tablist">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab('forums')}
              role="tab"
              aria-selected={activeTab === 'forums'}
              aria-controls="forums-panel"
              className={`w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'forums'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-4 h-4 mx-auto mb-1" />
              <span>Forums</span>
            </button>
            <button
              onClick={() => setActiveTab('peer')}
              role="tab"
              aria-selected={activeTab === 'peer'}
              aria-controls="peer-panel"
              className={`w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'peer'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4 mx-auto mb-1" />
              <span>Peer Support</span>
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              role="tab"
              aria-selected={activeTab === 'moderation'}
              aria-controls="moderation-panel"
              className={`w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'moderation'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Shield className="w-4 h-4 mx-auto mb-1" />
              <span>Moderation</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'forums' && (
          <div role="tabpanel" id="forums-panel" aria-labelledby="forums-tab">
            {renderForumsTab()}
          </div>
        )}
        {activeTab === 'peer' && (
          <div role="tabpanel" id="peer-panel" aria-labelledby="peer-tab">
            {renderPeerSupportTab()}
          </div>
        )}
        {activeTab === 'moderation' && (
          <div role="tabpanel" id="moderation-panel" aria-labelledby="moderation-tab">
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Moderation Tools</h3>
              <p>Community guidelines and moderation tools will be available soon</p>
            </div>
          </div>
        )}

        {/* Modals */}
        <FlagModal />
      </div>
    </div>
  );
};

export default CommunitySupport;
