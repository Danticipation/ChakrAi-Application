// Add these debug logs to your CommunitySupport component

// At the top of your renderForumsTab function, add:
const renderForumsTab = () => {
  console.log('=== RENDER FORUMS TAB ===');
  console.log('Forums loading:', forumsLoading);
  console.log('Posts loading:', postsLoading);
  console.log('Forums data:', forums);
  console.log('Posts data:', posts);
  console.log('Selected forum:', selectedForum);
  console.log('Forums error:', forumsError);
  console.log('Posts error:', postsError);

  if (forumsLoading || postsLoading) return <LoadingSpinner />;
  
  // ... rest of your existing renderForumsTab code
  
  // In the section where you show the selected forum, add this debug:
  {selectedForum && (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {/* Add this debug info at the top */}
      <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
        <strong>DEBUG:</strong> Selected Forum ID: {selectedForum} | 
        Forums Available: {Array.isArray(forums) ? forums.length : 'Not array'} | 
        Posts Available: {Array.isArray(posts) ? posts.length : 'Not array'}
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
            {forums?.find((f: Forum) => f.id === selectedForum)?.name || 'Forum Not Found'}
          </h3>
        </div>
        {/* ... rest of your existing selected forum UI */}
      </div>
      
      {/* Show posts for the selected forum */}
      <div className="space-y-4">
        {console.log('Filtering posts for forum:', selectedForum)}
        {console.log('Posts before filter:', posts)}
        {!posts || posts.filter((p: ForumPost) => p.forum_id === selectedForum).length === 0 ? (
          <div>
            <p className="text-gray-500 text-center py-8">
              No posts in this forum yet. Be the first to start a conversation!
            </p>
            <div className="text-center">
              <button
                onClick={() => setShowNewPost(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Create First Post
              </button>
            </div>
          </div>
        ) : (
          posts.filter((p: ForumPost) => p.forum_id === selectedForum).map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">{post.title}</h4>
              <p className="text-gray-600 mb-3">{post.content}</p>
              {/* ... rest of your post rendering */}
            </div>
          ))
        )}
      </div>
    </div>
  )}
};

// Also add this useEffect to watch for selectedForum changes:
useEffect(() => {
  console.log('=== SELECTED FORUM CHANGED ===');
  console.log('New selected forum:', selectedForum);
  if (selectedForum) {
    console.log('Forum details:', forums?.find(f => f.id === selectedForum));
  }
}, [selectedForum, forums]);