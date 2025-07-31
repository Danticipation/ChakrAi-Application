// Fix for CommunitySupport.tsx - Update the joinForumMutation onSuccess handler

const joinForumMutation = useMutation({
  mutationFn: async (forumId: number) => {
    console.log('=== MUTATION STARTED ===');
    console.log('Forum ID:', forumId);
    console.log('Current User:', currentUser);
    
    const userId = currentUser?.id || 1;
    
    console.log('Making request to:', `/api/forums/${forumId}/join`);
    console.log('Request body:', { userId });
    
    const response = await fetch(`/api/forums/${forumId}/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ userId }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
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
    console.log('=== JOIN ERROR ===');
    console.error('Join error:', error);
    
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

// Also update the button click handler to NOT set selectedForum immediately
// Replace the existing button onClick with this:

<button 
  onClick={() => {
    console.log('Join Discussion clicked for forum:', forum.id);
    
    // DON'T set selectedForum here - let the mutation success handler do it
    // setSelectedForum(forum.id); // Remove this line
    
    joinForumMutation.mutate(forum.id);
  }}
  disabled={joinForumMutation.isPending}
  className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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