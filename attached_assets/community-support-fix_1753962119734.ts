// Fix for CommunitySupport.tsx - Replace the problematic sections

// 1. REMOVE the useEffect that's causing the error around line 130
// Delete this entire useEffect block:
/*
useEffect(() => {
  console.log('=== SELECTED FORUM CHANGED ===');
  console.log('New selected forum:', selectedForum);
  if (selectedForum) {
    console.log('Forum details:', forums?.find(f => f.id === selectedForum));
  }
}, [selectedForum, forums]);
*/

// 2. UPDATE the data fetching queries to handle undefined properly
// Replace your existing forums query with this:

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

// 3. UPDATE the joinForumMutation to be safer
const joinForumMutation = useMutation({
  mutationFn: async (forumId: number) => {
    console.log('=== JOIN FORUM MUTATION ===');
    console.log('Forum ID:', forumId);
    
    const userId = currentUser?.id || 1;
    console.log('User ID:', userId);
    
    const response = await fetch(`/api/forums/${forumId}/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ userId }),
    });
    
    console.log('Join response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Join error:', errorData);
      throw new Error(errorData.message || 'Failed to join forum');
    }
    
    const result = await response.json();
    console.log('Join success:', result);
    return { ...result, forumId };
  },
  onSuccess: (data) => {
    console.log('=== JOIN SUCCESS HANDLER ===');
    console.log('Setting selected forum to:', data.forumId);
    
    // Set the selected forum
    setSelectedForum(data.forumId);
    
    // Clear errors
    setError(null);
    
    // Show success toast
    toast({
      title: "Forum Joined Successfully!",
      description: "You can now view and create posts in this forum.",
      duration: 3000,
    });
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['/api/community/forums'] });
    queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
  },
  onError: (error) => {
    console.error('=== JOIN ERROR HANDLER ===');
    console.error('Error:', error);
    
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

// 4. UPDATE the forum rendering section to be safer
// In your renderForumsTab function, replace the forum grid section with this:

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
              'Join Discussion →'
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

{/* Selected Forum Display */}
{selectedForum && (
  <div className="bg-white rounded-xl p-6 border border-gray-200 mt-6">
    <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-sm">
      <strong>DEBUG:</strong> Selected Forum: {selectedForum} | 
      Available Forums: {forums.length} | 
      Posts: {posts.length}
    </div>
    
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => {
            console.log('Back to forums clicked');
            setSelectedForum(null);
          }}
          className="text-blue-500 hover:text-blue-600"
        >
          ← Back to Forums
        </button>
        <h3 className="text-lg font-semibold text-gray-800">
          {forums.find((f) => f.id === selectedForum)?.name || `Forum ${selectedForum}`}
        </h3>
      </div>
      <button 
        onClick={() => setShowNewPost(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Post
      </button>
    </div>

    {/* Posts for selected forum */}
    <div className="space-y-4">
      {posts.filter((p) => p.forum_id === selectedForum).length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Posts Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Be the first to start a conversation in this forum.
          </p>
          <button
            onClick={() => setShowNewPost(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
          >
            Create First Post
          </button>
        </div>
      ) : (
        posts.filter((p) => p.forum_id === selectedForum).map((post) => (
          <div key={post.id} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">{post.title}</h4>
            <p className="text-gray-600 mb-3">{post.content}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>By {post.author_name}</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {post.heart_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {post.reply_count || 0}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}