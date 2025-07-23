import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Users, Heart, Flag, Clock, Shield, Send, Plus, UserCheck, Eye, EyeOff, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupportForum {
  id: number;
  name: string;
  description: string;
  category: string;
  isModerated: boolean;
  anonymousPostsAllowed: boolean;
  createdAt: string;
}

interface ForumPost {
  id: number;
  forumId: number;
  authorId: number | null;
  anonymousName: string | null;
  title: string;
  content: string;
  isAnonymous: boolean;
  supportCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ForumReply {
  id: number;
  postId: number;
  authorId: number | null;
  anonymousName: string | null;
  content: string;
  isAnonymous: boolean;
  supportCount: number;
  createdAt: string;
}

interface PeerCheckIn {
  id: number;
  requesterId: number;
  partnerId: number | null;
  status: string;
  checkInType: string;
  preferredTime: string;
  duration: number;
  isAnonymous: boolean;
  notes: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

interface CommunityPortalProps {
  userId: number;
}

export default function CommunityPortal({ userId }: CommunityPortalProps) {
  const [activeTab, setActiveTab] = useState<'forums' | 'checkins'>('forums');
  const [selectedForum, setSelectedForum] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showNewCheckIn, setShowNewCheckIn] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(true);
  const [userAnonymousName, setUserAnonymousName] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Crisis detection keywords
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'hopeless', 'worthless', 
    'can\'t go on', 'hurt myself', 'self harm', 'want to die', 'no point'
  ];

  const detectCrisisLanguage = useCallback((text: string): boolean => {
    const lowerText = text.toLowerCase();
    return crisisKeywords.some(keyword => lowerText.includes(keyword));
  }, [crisisKeywords]);

  // Fetch functions for React Query
  const fetchForums = async (): Promise<SupportForum[]> => {
    const response = await fetch('/api/community/forums');
    if (!response.ok) throw new Error('Failed to fetch forums');
    return response.json();
  };

  const fetchPosts = async (forumId: number): Promise<ForumPost[]> => {
    const response = await fetch(`/api/community/forums/${forumId}/posts`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  };

  const fetchReplies = async (postId: number): Promise<ForumReply[]> => {
    const response = await fetch(`/api/community/posts/${postId}/replies`);
    if (!response.ok) throw new Error('Failed to fetch replies');
    return response.json();
  };

  const fetchUserCheckIns = async (userId: number): Promise<PeerCheckIn[]> => {
    const response = await fetch(`/api/community/peer-checkins/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user check-ins');
    return response.json();
  };

  const fetchAvailableCheckIns = async (): Promise<PeerCheckIn[]> => {
    const response = await fetch('/api/community/peer-checkins/available');
    if (!response.ok) throw new Error('Failed to fetch available check-ins');
    return response.json();
  };

  // React Query data fetching with proper error handling
  const { data: forums = [], isLoading: forumsLoading, error: forumsError, refetch: refetchForums } = useQuery({
    queryKey: ['forums'],
    queryFn: fetchForums,
    retry: 2,
  });

  const { data: posts = [], isLoading: postsLoading, error: postsError, refetch: refetchPosts } = useQuery({
    queryKey: ['forum-posts', selectedForum],
    queryFn: () => fetchPosts(selectedForum!),
    enabled: !!selectedForum,
    retry: 2,
  });

  const { data: replies = [], isLoading: repliesLoading, error: repliesError } = useQuery({
    queryKey: ['post-replies', selectedPost],
    queryFn: () => fetchReplies(selectedPost!),
    enabled: !!selectedPost,
    retry: 2,
  });

  const { data: userCheckIns = [], isLoading: checkInsLoading, error: checkInsError, refetch: refetchUserCheckIns } = useQuery({
    queryKey: ['user-checkins', userId],
    queryFn: () => fetchUserCheckIns(userId),
    retry: 2,
  });

  const { data: availableCheckIns = [], isLoading: availableLoading, error: availableError, refetch: refetchAvailable } = useQuery({
    queryKey: ['available-checkins'],
    queryFn: fetchAvailableCheckIns,
    retry: 2,
  });

  const generateAnonymousName = useCallback(() => {
    if (userAnonymousName) return userAnonymousName; // Return existing name for consistency
    
    const adjectives = ['Kind', 'Brave', 'Gentle', 'Strong', 'Calm', 'Wise', 'Hopeful', 'Peaceful'];
    const nouns = ['Heart', 'Soul', 'Spirit', 'Friend', 'Helper', 'Listener', 'Supporter', 'Guardian'];
    const randomNum = Math.floor(Math.random() * 899) + 100; // Ensure 3 digits
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const newName = `${adj}${noun}${randomNum}`;
    
    setUserAnonymousName(newName); // Store for consistency
    return newName;
  }, [userAnonymousName]);

  // Mutations for creating posts and check-ins
  const createPostMutation = useMutation({
    mutationFn: async (postData: { title: string; content: string; isAnonymous: boolean; anonymousName?: string }) => {
      const response = await fetch(`/api/community/forums/${selectedForum}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', selectedForum] });
      setShowNewPost(false);
      toast({
        title: "Post Created",
        description: "Your post has been shared with the community",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const createCheckInMutation = useMutation({
    mutationFn: async (checkInData: {
      checkInType: string;
      preferredTime: string;
      duration: number;
      notes: string;
      isAnonymous: boolean;
    }) => {
      const response = await fetch('/api/community/peer-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkInData, requesterId: userId }),
      });
      if (!response.ok) throw new Error('Failed to create check-in request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-checkins', userId] });
      queryClient.invalidateQueries({ queryKey: ['available-checkins'] });
      setShowNewCheckIn(false);
      toast({
        title: "Check-in Requested",
        description: "Your peer check-in request has been posted",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create check-in request. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  // Utility Components
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-8" role="status" aria-label="Loading">
      <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );

  const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
      <p className="text-red-600 mb-2">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors min-h-[44px] flex items-center gap-2 mx-auto"
          aria-label="Retry loading content"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );

  const CrisisResources = () => (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4" role="alert">
      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        🚨 Need Immediate Help?
      </h4>
      <p className="text-red-700 text-sm mb-3">
        If you're having thoughts of self-harm, please reach out for professional help immediately.
      </p>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Crisis Text Line:</strong> Text HOME to 741741
        </div>
        <div>
          <strong>National Suicide Prevention Lifeline:</strong> 988
        </div>
        <div>
          <strong>Emergency:</strong> Call 911
        </div>
      </div>
    </div>
  );

  const ForumsList = () => {
    if (forumsLoading) return <LoadingSpinner />;
    if (forumsError) return <ErrorMessage message="Unable to load forums. Please try again." onRetry={refetchForums} />;
    if (!forums || forums.length === 0) {
      return (
        <div className="text-center py-8 text-gray-600">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No support forums available yet.</p>
        </div>
      );
    }

    return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Support Forums</h2>
          <p className="text-gray-600 mt-1">Anonymous, moderated spaces for peer support</p>
        </div>
      </div>

      <div className="grid gap-4">
        {(forums || []).map((forum: SupportForum) => (
          <div
            key={forum.id}
            onClick={() => setSelectedForum(forum.id)}
            className="bg-white rounded-2xl p-6 border border-blue-100 hover:border-blue-200 cursor-pointer transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-800">{forum.name}</h3>
                  {forum.isModerated && (
                    <Shield className="w-4 h-4 text-green-500" aria-label="Moderated Forum" />
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3">{forum.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                    {forum.category}
                  </span>
                  {forum.anonymousPostsAllowed && (
                    <span className="flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      Anonymous posting allowed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    );
  };

  const PostsList = () => {
    if (postsLoading) return <LoadingSpinner />;
    if (postsError) return <ErrorMessage message="Unable to load posts. Please try again." onRetry={refetchPosts} />;
    if (!posts || posts.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedForum(null)}
              className="text-blue-500 hover:text-blue-600 flex items-center gap-2 min-h-[44px]"
              aria-label="Back to forums"
            >
              ← Back to Forums
            </button>
            <button
              onClick={() => setShowNewPost(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-colors min-h-[44px]"
              aria-label="Create new post"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>
          <div className="text-center py-8 text-gray-600">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No posts in this forum yet. Be the first to start a conversation!</p>
          </div>
        </div>
      );
    }

    return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setSelectedForum(null)}
          className="text-blue-500 hover:text-blue-600 flex items-center gap-2 min-h-[44px]"
          aria-label="Back to forums"
        >
          ← Back to Forums
        </button>
        <button
          onClick={() => setShowNewPost(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-colors min-h-[44px]"
          aria-label="Create new post"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      <div className="space-y-4">
        {posts.map((post: ForumPost) => (
          <div
            key={post.id}
            onClick={() => setSelectedPost(post.id)}
            className="bg-white rounded-2xl p-6 border border-blue-100 hover:border-blue-200 cursor-pointer transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex-1">{post.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Heart className="w-4 h-4" />
                {post.supportCount}
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-2">
                {post.isAnonymous ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    {post.anonymousName || 'Anonymous'}
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    User
                  </>
                )}
              </span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    );
  };

  const PostView = () => (
    <div className="space-y-6">
      <button
        onClick={() => setSelectedPost(null)}
        className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
      >
        ← Back to Posts
      </button>

      {/* Post content would be rendered here */}
      <div className="bg-white rounded-2xl p-6 border border-blue-100">
        <p className="text-gray-600">Post content and replies will be displayed here</p>
      </div>
    </div>
  );

  const PeerCheckIns = () => {
    if (checkInsLoading || availableLoading) return <LoadingSpinner />;
    
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Peer Check-Ins</h2>
          <p className="text-gray-600 mt-1">Connect with others for mutual support</p>
        </div>
        <button
          onClick={() => setShowNewCheckIn(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-600 transition-colors min-h-[44px]"
          aria-label="Request new peer check-in"
        >
          <Plus className="w-4 h-4" />
          Request Check-In
        </button>
      </div>

      {/* Your Check-Ins */}
      <div className="bg-white rounded-2xl p-6 border border-green-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-green-500" />
          Your Check-Ins
        </h3>
        {checkInsError ? (
          <ErrorMessage message="Unable to load your check-ins. Please try again." onRetry={refetchUserCheckIns} />
        ) : (
        <div className="space-y-3">
          {userCheckIns.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No check-ins requested yet.</p>
            </div>
          ) : (
            userCheckIns.map((checkIn: PeerCheckIn) => (
            <div key={checkIn.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{checkIn.checkInType} Check-In</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  checkIn.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  checkIn.status === 'matched' ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {checkIn.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Duration: {checkIn.duration} minutes</div>
                <div>Preferred time: {checkIn.preferredTime}</div>
                {checkIn.notes && <div>Notes: {checkIn.notes}</div>}
              </div>
            </div>
            ))
          )}
        </div>
        )}
      </div>

      {/* Available Check-Ins */}
      <div className="bg-white rounded-2xl p-6 border border-blue-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Available Check-Ins
        </h3>
        {availableError ? (
          <ErrorMessage message="Unable to load available check-ins. Please try again." onRetry={refetchAvailable} />
        ) : (
        <div className="space-y-3">
          {availableCheckIns.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No check-ins available right now. Check back later!</p>
            </div>
          ) : (
            availableCheckIns.map((checkIn: PeerCheckIn) => (
            <div key={checkIn.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{checkIn.checkInType} Check-In</span>
                <button 
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors min-h-[36px]"
                  aria-label={`Join ${checkIn.checkInType} check-in`}
                >
                  Join
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Duration: {checkIn.duration} minutes</div>
                <div>Preferred time: {checkIn.preferredTime}</div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Posted {new Date(checkIn.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
        )}
      </div>
    </div>
    );
  };

  const NewPostModal = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [showCrisisAlert, setShowCrisisAlert] = useState(false);

    // Handle keyboard events and focus management
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowNewPost(false);
      };
      
      if (showNewPost) {
        document.addEventListener('keydown', handleEscape);
        // Focus first input when modal opens
        setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder="Post title..."]')?.focus(), 100);
      }
      
      return () => document.removeEventListener('keydown', handleEscape);
    }, [showNewPost]);

    const handlePostSubmit = () => {
      // Validate form
      if (!title.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter a title for your post",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      if (!content.trim()) {
        toast({
          title: "Validation Error", 
          description: "Please enter some content for your post",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Check for crisis language
      const fullText = `${title} ${content}`;
      const hasCrisisLanguage = detectCrisisLanguage(fullText);
      
      if (hasCrisisLanguage && !showCrisisAlert) {
        setShowCrisisAlert(true);
        return;
      }
      
      // Submit post
      createPostMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        isAnonymous: anonymousMode,
        anonymousName: anonymousMode ? generateAnonymousName() : undefined,
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setShowCrisisAlert(false);
    };

    return showNewPost ? (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-post-title"
      >
        <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {showCrisisAlert && <CrisisResources />}
          
          <h3 id="new-post-title" className="text-xl font-bold text-gray-800 mb-4">Create New Post</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <button
                onClick={() => setAnonymousMode(!anonymousMode)}
                aria-label={`Toggle anonymous mode. Currently ${anonymousMode ? 'anonymous' : 'identified'}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors min-h-[44px] ${
                  anonymousMode ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'
                }`}
              >
                {anonymousMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {anonymousMode ? 'Anonymous' : 'Identified'}
              </button>
              {anonymousMode && (
                <span className="text-sm text-gray-600">
                  You'll appear as: {generateAnonymousName()}
                </span>
              )}
            </div>

            <input
              type="text"
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Post title"
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-300 focus:outline-none min-h-[44px]"
            />
            
            <textarea
              placeholder="Share your thoughts or ask for support..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              aria-label="Post content"
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-300 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowNewPost(false);
                setTitle('');
                setContent('');
                setShowCrisisAlert(false);
              }}
              className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px]"
              aria-label="Cancel post creation"
            >
              Cancel
            </button>
            <button
              onClick={handlePostSubmit}
              disabled={createPostMutation.isPending}
              className="flex-1 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
              aria-label="Create post"
            >
              {createPostMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </div>
    ) : null;
  };

  const NewCheckInModal = () => {
    const [checkInType, setCheckInType] = useState('daily');
    const [preferredTime, setPreferredTime] = useState('flexible');
    const [duration, setDuration] = useState(15);
    const [notes, setNotes] = useState('');
    const [showCrisisAlert, setShowCrisisAlert] = useState(false);

    // Handle keyboard events and focus management
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowNewCheckIn(false);
      };
      
      if (showNewCheckIn) {
        document.addEventListener('keydown', handleEscape);
        // Focus first select when modal opens
        setTimeout(() => document.querySelector<HTMLSelectElement>('select')?.focus(), 100);
      }
      
      return () => document.removeEventListener('keydown', handleEscape);
    }, [showNewCheckIn]);

    const handleCheckInSubmit = () => {
      // Check for crisis language in notes
      const hasCrisisLanguage = detectCrisisLanguage(notes);
      
      if (hasCrisisLanguage && !showCrisisAlert) {
        setShowCrisisAlert(true);
        return;
      }
      
      // Submit check-in request
      createCheckInMutation.mutate({
        checkInType,
        preferredTime,
        duration,
        notes: notes.trim(),
        isAnonymous: anonymousMode,
      });
      
      // Reset form
      setCheckInType('daily');
      setPreferredTime('flexible');
      setDuration(15);
      setNotes('');
      setShowCrisisAlert(false);
    };

    return showNewCheckIn ? (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-checkin-title"
      >
        <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {showCrisisAlert && <CrisisResources />}
          
          <h3 id="new-checkin-title" className="text-xl font-bold text-gray-800 mb-4">Request Peer Check-In</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="checkin-type">Check-In Type</label>
              <select
                id="checkin-type"
                value={checkInType}
                onChange={(e) => setCheckInType(e.target.value)}
                aria-label="Select check-in type"
                className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-300 focus:outline-none min-h-[44px]"
              >
                <option value="daily">Daily Check-In</option>
                <option value="crisis">Crisis Support</option>
                <option value="motivation">Motivation Boost</option>
                <option value="accountability">Accountability Partner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="preferred-time">Preferred Time</label>
              <select
                id="preferred-time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                aria-label="Select preferred time"
                className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-300 focus:outline-none min-h-[44px]"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="duration">Duration (minutes)</label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                aria-label="Select duration"
                className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-300 focus:outline-none min-h-[44px]"
              >
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
              </select>
            </div>

            <textarea
              placeholder="Optional: Share context about what kind of support you're looking for..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              aria-label="Additional notes for check-in request"
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-300 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowNewCheckIn(false);
                setCheckInType('daily');
                setPreferredTime('flexible');
                setDuration(15);
                setNotes('');
                setShowCrisisAlert(false);
              }}
              className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px]"
              aria-label="Cancel check-in request"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckInSubmit}
              disabled={createCheckInMutation.isPending}
              className="flex-1 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
              aria-label="Submit check-in request"
            >
              {createCheckInMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                'Request Check-In'
              )}
            </button>
          </div>
        </div>
      </div>
    ) : null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6" role="tablist">
        <button
          onClick={() => setActiveTab('forums')}
          role="tab"
          aria-selected={activeTab === 'forums'}
          aria-controls="forums-panel"
          className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 min-h-[44px] ${
            activeTab === 'forums'
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Support Forums
          </div>
        </button>
        <button
          onClick={() => setActiveTab('checkins')}
          role="tab"
          aria-selected={activeTab === 'checkins'}
          aria-controls="checkins-panel"
          className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 min-h-[44px] ${
            activeTab === 'checkins'
              ? 'bg-white shadow-sm text-green-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            Peer Check-Ins
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'forums' && (
        <div role="tabpanel" id="forums-panel" aria-labelledby="forums-tab">
          {selectedPost ? (
            <PostView />
          ) : selectedForum ? (
            <PostsList />
          ) : (
            <ForumsList />
          )}
        </div>
      )}

      {activeTab === 'checkins' && (
        <div role="tabpanel" id="checkins-panel" aria-labelledby="checkins-tab">
          <PeerCheckIns />
        </div>
      )}

      {/* Modals */}
      <NewPostModal />
      <NewCheckInModal />
    </div>
  );
}