import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Get forums
router.get('/forums', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ forums: [] });
    }

    const { data: forums, error } = await supabase
      .from('forums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase forums error:', error);
      return res.json({ forums: [] });
    }

    console.log('Returning forums:', forums?.length || 0);
    res.json({ forums: forums || [] });
  } catch (error) {
    console.error('Forums error:', error);
    res.json({ forums: [] });
  }
});

// Get posts for a forum
router.get('/forums/:forumId/posts', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ posts: [] });
    }

    const { forumId } = req.params;
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, replies(*)')
      .eq('forum_id', forumId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase posts error:', error);
      return res.json({ posts: [] });
    }

    res.json({ posts: posts || [] });
  } catch (error) {
    console.error('Posts error:', error);
    res.json({ posts: [] });
  }
});

// Create a new post
router.post('/forums/:forumId/posts', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Community features unavailable' });
    }

    const { forumId } = req.params;
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'Title, content, and author are required' });
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        forum_id: parseInt(forumId),
        title,
        content,
        author,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase create post error:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Create a reply to a post
router.post('/posts/:postId/replies', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Community features unavailable' });
    }

    const { postId } = req.params;
    const { content, author } = req.body;

    if (!content || !author) {
      return res.status(400).json({ error: 'Content and author are required' });
    }

    const { data: reply, error } = await supabase
      .from('replies')
      .insert({
        post_id: parseInt(postId),
        content,
        author,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase create reply error:', error);
      return res.status(500).json({ error: 'Failed to create reply' });
    }

    res.json({ success: true, reply });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

// Peer check-ins
router.get('/checkins', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ checkins: [] });
    }

    const { data: checkins, error } = await supabase
      .from('peer_checkins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Supabase checkins error:', error);
      return res.json({ checkins: [] });
    }

    res.json({ checkins: checkins || [] });
  } catch (error) {
    console.error('Checkins error:', error);
    res.json({ checkins: [] });
  }
});

// Create a peer check-in
router.post('/checkins', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Community features unavailable' });
    }

    const { mood, message, author } = req.body;

    if (!mood || !message || !author) {
      return res.status(400).json({ error: 'Mood, message, and author are required' });
    }

    const { data: checkin, error } = await supabase
      .from('peer_checkins')
      .insert({
        mood,
        message,
        author,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase create checkin error:', error);
      return res.status(500).json({ error: 'Failed to create check-in' });
    }

    res.json({ success: true, checkin });
  } catch (error) {
    console.error('Create checkin error:', error);
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

export default router;