import 'dotenv/config';
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { setupVite, serveStatic, log } from "./vite.js";
import { errorHandler } from './utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env['PORT'] || '5000', 10);

// Trust proxy configuration for production (Cloudflare/ALB/Nginx)
const trustProxy = process.env.TRUST_PROXY ? parseInt(process.env.TRUST_PROXY) : 1;
app.set('trust proxy', trustProxy);

// 1) Security + parsing middleware FIRST
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
const corsConfigLocal = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'x-device-fingerprint',
    'x-session-id',
    'x-user-id',
    'x-admin-secret'
  ],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
};
app.use(cors(corsConfigLocal));

// 2) Identity + DB scoping (CRITICAL: must precede ALL routers)
import { uidCookie } from './middleware/uidCookie.js';
app.use(uidCookie);  // sets req.ctx.uid and cookie if absent

import { applyRls } from './middleware/applyRls.js';
app.use(applyRls);   // sets Postgres GUC app.uid for RLS

// 3) Routers AFTER identity middleware
import debugRouter from './routes/debug-clean.js';
app.use('/api/debug', debugRouter);

import adminRouter from './routes/admin.js';
app.use('/api/admin', adminRouter);

// Use modular API routes
import routes from './routes.js';
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Setup Vite for frontend serving and start server
(async () => {
  await setupVite(app, server);
  
  // Start server
  server.listen(PORT, '0.0.0.0', () => {
    log(`🎯 CLEAN SERVER: Running on port ${PORT}`);
    log(`🔄 Middleware order: Security → Identity → Routes`);
    log(`🔍 Debug endpoints: /api/debug/whoami, /api/debug/cookies`);
    log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
  });
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
