// Add this to your index.ts file (BEFORE the Vite setup)
// Place it right after your other community API endpoints

// ============ COMMUNITY POSTS API ENDPOINTS ============

// Create forum post endpoint - CRITICAL FIX
app.post('/api/community/posts', async (req, res) => {
  try {
    console.log('=== CREATE POST API CALLED ===');
    console.log('Request method:', req.method);  
    console.log('Request URL:', req.url);
    console.log('Request body:', req.body);
    console.log('Headers:', req.headers);

    const { title, content, forum_id, author_id, author_name, is_anonymous, anonymous_name } = req.body;
    
    // Log each field
    console.log('Parsed fields:');
    console.log('- Title:', title);
    console.log('- Content:', content);
    console.log('- Forum ID:', forum_id);
    console.log('- Author ID:', author_id);
    console.log('- Author Name:', author_name);
    console.log('- Is Anonymous:', is_anonymous);
    console.log('- Anonymous Name:', anonymous_name);

    // Basic validation
    if (!title || !content || !forum_id) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          title: !title ? 'Title is required' : 'OK',
          content: !content ? 'Content is required' : 'OK', 
          forum_id: !forum_id ? 'Forum ID is required' : 'OK'
        }
      });
    }

    // Create mock post (since we're not using Supabase yet)
    const newPost = {
      id: Date.now(), // Use timestamp as mock ID
      forum_id: parseInt(forum_id) || forum_id,
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

    console.log('✅ Successfully created mock post:', newPost);

    // Return success response
    res.status(201).json({ 
      success: true, 
      post: newPost,
      message: 'Post created successfully (mock data)'
    });

  } catch (error) {
    console.error('❌ CREATE POST ERROR:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: 'Check server console for full error details'
    });
  }
});

// Get posts endpoint - make sure this exists too
app.get('/api/community/posts', (req, res) => {
  try {
    console.log('=== GET POSTS API CALLED ===');
    
    // For now, return empty array since we're using mock data
    // In a real implementation, this would fetch from database
    const posts = [];
    
    console.log('Returning posts:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Get forum posts by forum ID
app.get('/api/community/forums/:forumId/posts', (req, res) => {
  try {
    const forumId = parseInt(req.params.forumId);
    console.log('=== GET FORUM POSTS API CALLED ===');
    console.log('Forum ID:', forumId);
    
    // For now, return empty array
    const posts = [];
    
    console.log('Returning forum posts:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error('Get forum posts error:', error);
    res.status(500).json({ error: 'Failed to get forum posts' });
  }
});

console.log('✅ Community posts API endpoints registered');