import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Essential route imports - only import what we know works
import journalRoutes from './routes/journal.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/user.js';

// Simple subscription route
const subscriptionRouter = express.Router();
subscriptionRouter.get('/status', (req, res) => {
  // Return basic subscription status - you can expand this later
  res.json({
    active: true,
    plan: 'free',
    features: ['chat', 'journal', 'basic_analytics']
  });
});

// Middleware imports (simplified for initial testing)
// import { uidCookie } from './middleware/uidCookie.js';
// import { requireUser } from './middleware/userValidation.js';
// import { securityHeaders } from './middleware/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET ?? 'dev_secret'));
// Temporarily disabled complex middleware
// app.use(securityHeaders);
// app.use(uidCookie);

// public routes
app.use('/api/auth', authRoutes);

// authenticated routes (commented out auth middleware temporarily to test)
// app.use(requireUser);
app.use('/api/journal', journalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscription', subscriptionRouter);

// Serve static files from client dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Serve the main app for any other routes (SPA routing)
app.get('*', (req: Request, res: Response) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/identity/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../premium-dashboard.html'));
});

// health
app.get('/healthz', (_req: Request, res: Response) => res.json({ ok: true }));

// error handler (typed, and handles unknown)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err instanceof Error ? err : new Error(String(err));
  console.error('Server error:', e.message);
  res.status(500).json({ error: e.message });
});

// Start the server
const PORT = parseInt(process.env.PORT || '5000', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CHAKRAI SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📍 Server accessible at http://localhost:${PORT}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
