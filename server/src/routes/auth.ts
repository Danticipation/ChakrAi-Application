import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from '../storage.js';
import { unifiedAuthMiddleware } from '../auth/unifiedAuth.js';

const r = Router();
// CRITICAL: Use the same secret as unifiedAuthMiddleware
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'chakrai-dev-secret-change-in-production-256-bits-minimum';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or ACCESS_TOKEN_SECRET must be configured');
}

console.log('🔑 Auth route using JWT_SECRET length:', JWT_SECRET.length);

// Helper to create JWT token
function createToken(userId: number, email: string): string {
  return jwt.sign(
    { 
      userId,
      email,
      sub: userId.toString()
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Create anonymous user WITHOUT authentication (unprotected)
r.post('/anonymous', async (req, res) => {
  try {
    console.log('🎭 Creating anonymous user...');
    
    // Create anonymous user with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const username = `anon_${timestamp}_${randomId}`;
    const email = `${username}@chakrai.temp`;
    
    // Create user
    const userId = await storage.createUser({
      username,
      email,
      name: 'Anonymous User',
      hashedPassword: null // Anonymous users don't have passwords
    });

    // Create token
    const token = createToken(userId, email);

    console.log('✅ Anonymous user created:', userId);
    res.json({
      success: true,
      user: {
        id: userId,
        email,
        displayName: 'Anonymous User',
        isAnonymous: true
      },
      token
    });
  } catch (error) {
    console.error('❌ Anonymous user creation error:', error);
    res.status(500).json({ error: 'Failed to create anonymous user' });
  }
});

// Verify token endpoint - requires auth
r.get('/verify', unifiedAuthMiddleware, async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    // Token verification happens in unifiedAuthMiddleware
    // If we get here, token is valid
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user from storage
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.name || user.email,
        isAnonymous: false
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
});

// Login endpoint
r.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('\n🔐 LOGIN ATTEMPT');
    console.log('Email:', email);
    console.log('Password length:', password?.length);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email
    console.log('🔍 Looking up user...');
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.log('❌ No user found with email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:', { id: user.id, email: user.email, hasPassword: !!user.passwordHash });

    // Verify password
    console.log('🔑 Comparing password...');
    const validPassword = await bcrypt.compare(password, user.passwordHash || '');
    console.log('Password valid:', validPassword);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = createToken(user.id, user.email!);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.name || user.email,
        isAnonymous: false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register endpoint
r.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = await storage.createUser({
      email,
      name,
      hashedPassword: passwordHash
    });

    // Create token
    const token = createToken(userId, email);

    res.json({
      token,
      user: {
        id: userId,
        email,
        displayName: name,
        isAnonymous: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Logout endpoint
r.post('/logout', (req, res) => {
  // JWT tokens are stateless, so logout is just client-side
  res.json({ success: true });
});

// Migrate anonymous user
r.post('/migrate', async (req, res) => {
  try {
    const { anonymousUserId, email, password, name } = req.body;

    if (!anonymousUserId || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if email already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Migrate the anonymous user
    const userId = await storage.migrateAnonymousUser(anonymousUserId, {
      email,
      name,
      hashedPassword: passwordHash
    });

    // Create token
    const token = createToken(userId, email);

    res.json({
      token,
      user: {
        id: userId,
        email,
        displayName: name,
        isAnonymous: false
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});

export default r;
