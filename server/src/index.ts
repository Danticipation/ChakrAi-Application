import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import users from "./routes/users.js";
import subscription from "./routes/subscription.js";
import tieredAnalysis from "./routes/tieredAnalysis.js";
import auth from "./routes/auth.js";
import analytics from "./routes/analytics.js";
import journal from "./routes/journal.js";
import mood from "./routes/mood.js";
import chat from "./routes/chat.js";
import tts from "./routes/tts.js";
import textToSpeech from "./routes/textToSpeech.js";
import transcribe from "./routes/transcribe.js";
import personalityInsights from "./routes/personality-insights.js";
import dataManagement from "./routes/data-management.js";
import { ensureAuthConfig, unifiedAuthMiddleware, getAuthenticatedUser } from "./auth/unifiedAuth.js";
import { testEncryption } from "./lib/encryption.js";

ensureAuthConfig(); // ⛔ refuse to start if auth is misconfigured

// HIPAA COMPLIANCE: Test encryption at startup
console.log('🔐 Testing encryption system...');
if (!testEncryption()) {
  console.error('🚨 CRITICAL: Encryption test failed! Server cannot start.');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT || 3001);

// HIPAA COMPLIANCE: Trust proxy for accurate IP addresses in audit logs
app.set("trust proxy", 1);

// HIPAA COMPLIANCE: Strict CORS configuration
// Only allow requests from whitelisted origins
const ALLOWED_ORIGINS = [
  process.env.PRODUCTION_DOMAIN,
  process.env.STAGING_DOMAIN,
  'http://localhost:5173', // Development
  'http://localhost:3000', // Alternative dev port
].filter(Boolean); // Remove undefined values

// CORS Configuration with origin validation
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in whitelist
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS BLOCKED: Unauthorized origin attempted access: ${origin}`);
      callback(new Error('Not allowed by CORS policy - unauthorized origin'));
    }
  },
  credentials: true, // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-device-fingerprint', 'x-session-id'],
  maxAge: 86400, // Cache preflight requests for 24 hours
}));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// Public
app.get("/health", (_req, res) => res.json({ ok: true }));

// Mount auth routes (PUBLIC - no auth required for login/register)
app.use('/api/auth', auth);

// Mount public routes (no auth required)
app.use('/api', textToSpeech); // Must be before unifiedAuthMiddleware for /api/voices endpoint

// Apply unified auth middleware to ALL protected routes
app.use(unifiedAuthMiddleware);

// Mount analytics routes (PROTECTED - requires auth via unifiedAuthMiddleware)
app.use('/api/analytics', analytics);

// Mount journal, mood, and chat routes (PROTECTED - requires auth via unifiedAuthMiddleware)
app.use('/api/journal', journal);
app.use('/api/mood', mood);
app.use('/api/chat', chat);
app.use('/api/tts', tts);
app.use('/api', transcribe);
app.use('/api/personality-quiz', personalityInsights);
app.use('/api/personality-insights', personalityInsights); // Also mount at old path for backwards compatibility

// Mount API routes (PROTECTED - requires auth via unifiedAuthMiddleware)
app.use('/api/users', users);
app.use('/api/data-management', dataManagement);

app.use('/api/subscription', subscription);
app.use('/api/tiered-analysis', tieredAnalysis);

// Legacy /api/me route (keeping for compatibility)
app.get("/api/me", (req, res) => {
  res.json({ user: getAuthenticatedUser(req) });
});

app.use((_req, res) => res.status(404).json({ error: "not_found" }));

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
