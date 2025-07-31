// Fix for Create Post functionality in CommunitySupport.tsx

// 1. First, let's add debug logging to the "Create First Post" button click
// Replace your existing "Create First Post" button with this:

<button
  onClick={() => {
    console.log('🚀 Create First Post clicked!');
    console.log('Current showNewPost state:', showNewPost);
    console.log('Setting showNewPost to true...');
    setShowNewPost(true);
    console.log('showNewPost should now be:', true);
  }}
  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
>
  Create First Post
</button>

// 2. Also update the "New Post" button in the header:
<button 
  onClick={() => {
    console.log('📝 New Post button clicked!');
    console.log('Current showNewPost state:', showNewPost);
    setShowNewPost(true);
  }}
  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
>
  <Plus className="w-4 h-4" />
  New Post
</button>

// 3. Add debug info to show the showNewPost state in your debug section:
// Update your debug section to include showNewPost state:

<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
  <h4 className="font-bold text-yellow-800 mb-2">🐛 DEBUG INFO:</h4>
  <div className="text-sm space-y-1">
    <div><strong>Selected Forum:</strong> {selectedForum || 'None'}</div>
    <div><strong>Forums Available:</strong> {forums?.length || 'None'}</div>
    <div><strong>Posts Available:</strong> {posts?.length || 'None'}</div>
    <div><strong>Show New Post:</strong> {showNewPost ? 'YES - FORM SHOULD SHOW' : 'NO - FORM HIDDEN'}</div>
    <div><strong>Forums Data:</strong> {JSON.stringify(forums?.map(f => ({id: f.id, name: f.name})) || 'None')}</div>
  </div>
  <div className="flex gap-2 mt-2">
    <button 
      onClick={() => {
        console.log('Manual forum selection test');
        setSelectedForum(1);
      }}
      className="bg-yellow-600 text-white px-3 py-1 rounded text-xs"
    >
      Test: Force Select Forum 1
    </button>
    <button 
      onClick={() => {
        console.log('Manual show new post test');
        setShowNewPost(true);
      }}
      className="bg-green-600 text-white px-3 py-1 rounded text-xs"
    >
      Test: Force Show New Post
    </button>
  </div>
</div>

// 4. Make sure your New Post Form is visible and properly positioned
// Add this right after the forum header (before the posts section):

{/* New Post Form - ADD THIS SECTION */}
{showNewPost && (
  <div className="mb-6 p-6 border-2 border-blue-500 bg-blue-50 rounded-lg">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-lg font-semibold text-blue-900">✏️ Create New Post</h4>
      <button
        onClick={() => {
          console.log('❌ Cancel new post clicked');
          setShowNewPost(false);
          setNewPostTitle('');
          setNewPostContent('');
        }}
        className="text-blue-600 hover:text-blue-800"
      >
        ✕ Cancel
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
            console.log('📤 Submit post clicked!');
            console.log('Title:', newPostTitle);
            console.log('Content:', newPostContent);
            console.log('Forum ID:', selectedForum);
            
            if (!newPostTitle.trim()) {
              console.log('❌ Title is empty');
              toast({
                title: "Title Required",
                description: "Please enter a title for your post",
                variant: "destructive",
              });
              return;
            }
            
            if (!newPostContent.trim()) {
              console.log('❌ Content is empty');
              toast({
                title: "Content Required", 
                description: "Please enter some content for your post",
                variant: "destructive",
              });
              return;
            }
            
            console.log('✅ Validation passed, calling mutation...');
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

// 5. Update your createPostMutation to include better debugging:
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