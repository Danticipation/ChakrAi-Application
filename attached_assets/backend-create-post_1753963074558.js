// Add this to your index.ts file (after the existing community endpoints)

// Create forum post endpoint
app.post('/api/community/posts', async (req, res) => {
  try {
    console.log('=== CREATE POST API ENDPOINT ===');
    console.log('Request body:', req.body);
    
    const { title, content, forum_id, author_id, author_name, is_anonymous, anonymous_name } = req.body;
    
    // Validate required fields
    if (!title || !content || !forum_id) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'title, content, and forum_id are required'
      });
    }

    // For now, we'll create a mock post since we don't have Supabase fully set up
    // In a real implementation, this would save to the database
    const newPost = {
      id: Date.now(), // Mock ID
      forum_id: parseInt(forum_id),
      title: title.trim(),
      content: content.trim(),
      author_id: author_id || null,
      author_name: author_name || anonymous_name || `Anonymous${Math.floor(Math.random() * 1000)}`,
      is_anonymous: is_anonymous !== false,
      anonymous_name: anonymous_name || `User${Math.floor(Math.random() * 1000)}`,
      heart_count: 0,
      reply_count: 0,
      is_flagged: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Created post:', newPost);

    // TODO: In a real implementation, save to Supabase here
    // For now, just return the mock post
    res.status(201).json({ 
      success: true, 
      post: newPost,
      message: 'Post created successfully'
    });

  } catch (error) {
    console.error('❌ Create post error:', error);
    res.status(500).json({ 
      error: 'Failed to create post',
      details: error.message 
    });
  }
});

// Also make sure you have this endpoint for getting posts (update if it exists)
app.get('/api/community/posts', (req, res) => {
  try {
    console.log('=== GET POSTS API ENDPOINT ===');
    
    // For now, return empty array since we're not persisting posts yet
    // In a real implementation, this would fetch from Supabase
    const posts = [];
    
    console.log('Returning posts:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});