// Fix for the "Join Discussion" button in CommunitySupport.tsx
// Replace the existing button onClick handler with this:

// In your JSX where the "Join Discussion" button is:
<button 
  onClick={() => {
    console.log('Join Discussion clicked for forum:', forum.id);
    
    // Make sure we have a user ID
    const userId = currentUser?.id || 1; // Fallback to ID 1 if no user
    
    console.log('Using userId:', userId);
    
    setSelectedForum(forum.id);
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

// Also, make sure your joinForumMutation passes the userId correctly:
// Update the joinForumMutation to this:

const joinForumMutation = useMutation({
  mutationFn: async (forumId: number) => {
    console.log('=== MUTATION STARTED ===');
    console.log('Forum ID:', forumId);
    console.log('Current User:', currentUser);
    
    // Use fallback user ID if currentUser is undefined
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
    return result;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['/api/community/forums'] });
    setError(null);
    toast({
      title: "Forum Joined Successfully!",
      description: "You can now view and create posts in this forum.",
      duration: 3000,
    });
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