// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { storage } from './storage.ts';
import chatRouter from './routes/chat.js';
import usersRouter from './routes/users.js';
import subscriptionRouter from './routes/subscription.js';
import tieredAnalysisRouter from './routes/tieredAnalysis.js';
import moodRouter from './routes/mood.js';
import analyticsRouter from './routes/analytics.js';
import journalRouter from './routes/journal.js';
import { unifiedAuthMiddleware } from '../auth/unifiedAuth.js'; // Import unifiedAuthMiddleware

dotenv.config();

const app = express();

// CORS + JSON
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5174' }));
app.use(express.json());

// Apply unified authentication middleware globally
app.use(unifiedAuthMiddleware);

// Health check (public)
app.get('/health', (_req, res) => res.json({ ok: true }));

// Log every API request + user id from header (safe: no bodies/PHI)
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    const uid = req.header('x-user-id') ?? (req as any).userId ?? 'none';
    console.log(`[api] ${req.method} ${req.path} uid=${uid}`);
  }
  next();
});

// Routes
app.use('/api', analyticsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/users', usersRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/tiered-analysis', tieredAnalysisRouter);
app.use('/api/journal', journalRouter);
app.use('/api/mood', moodRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`[server] listening on :${port}`));
