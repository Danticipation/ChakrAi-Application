// Add this debug section at the top of your renderForumsTab function
// Right after the error display section and before the forum grid

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
      {/* ERROR DISPLAY */}
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

      {/* TEMPORARY DEBUG DISPLAY - ADD THIS */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-bold text-yellow-800 mb-2">🐛 DEBUG INFO:</h4>
        <div className="text-sm space-y-1">
          <div><strong>Selected Forum:</strong> {selectedForum || 'None'}</div>
          <div><strong>Forums Available:</strong> {forums?.length || 'None'}</div>
          <div><strong>Posts Available:</strong> {posts?.length || 'None'}</div>
          <div><strong>Show New Post:</strong> {showNewPost ? 'Yes' : 'No'}</div>
          <div><strong>Forums Data:</strong> {JSON.stringify(forums?.map(f => ({id: f.id, name: f.name})) || 'None')}</div>
        </div>
        <button 
          onClick={() => {
            console.log('Manual forum selection test');
            setSelectedForum(1);
          }}
          className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-xs"
        >
          Test: Force Select Forum 1
        </button>
      </div>

      {/* Show selected forum content FIRST (if selected) */}
      {selectedForum && (
        <div className="bg-white rounded-xl p-6 border-2 border-green-500">
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="text-green-800 font-bold">✅ FORUM SELECTED!</h4>
            <p className="text-green-700 text-sm">Forum ID: {selectedForum}</p>
            <p className="text-green-700 text-sm">
              Forum Name: {forums?.find(f => f.id === selectedForum)?.name || 'Unknown'}
            </p>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  console.log('Back button clicked');
                  setSelectedForum(null);
                }}
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                ← Back to Forums
              </button>
              <h3 className="text-lg font-semibold text-gray-800">
                {forums?.find(f => f.id === selectedForum)?.name || `Forum ${selectedForum}`}
              </h3>
            </div>
            <button 
              onClick={() => {
                console.log('New Post button clicked');
                setShowNewPost(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>

          {/* Forum posts area */}
          <div className="border-2 border-blue-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Posts in this forum:</h4>
            {posts?.filter(p => p.forum_id === selectedForum).length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Posts Yet</h3>
                <p className="text-gray-500 mb-4">Be the first to start a conversation!</p>
                <button
                  onClick={() => setShowNewPost(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <div>Posts would appear here...</div>
            )}
          </div>
        </div>
      )}

      {/* Only show forum grid if no forum is selected */}
      {!selectedForum && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Choose a Forum</h2>
          
          {/* Forum Categories Grid */}
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
                        console.log('🎯 Join Discussion clicked for forum:', forum.id, forum.name);
                        joinForumMutation.mutate(forum.id);
                      }}
                      disabled={joinForumMutation.isPending}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
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
              <div className="col-span-2 text-center py-8">
                <p className="text-gray-500">No forums available</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};