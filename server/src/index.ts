import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import users from "./routes/users.js";
import subscription from "./routes/subscription.js";
import tieredAnalysis from "./routes/tieredAnalysis.js";
import { ensureAuthConfig, unifiedAuthMiddleware, getAuthenticatedUser } from "./auth/unifiedAuth.js";

ensureAuthConfig(); // ⛔ refuse to start if auth is misconfigured

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

app.set("trust proxy", 1);

app.use(cors({ origin: ORIGIN, credentials: true })); // exact origin, not '*'
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// Public
app.get("/health", (_req, res) => res.json({ ok: true }));

// Mount API routes
app.use('/api/users', users);

app.use('/api/subscription', subscription);
app.use('/api/tiered-analysis', tieredAnalysis);

// Add middleware for user authentication to these routes
app.use(unifiedAuthMiddleware);

// Legacy /api/me route (keeping for compatibility)
app.get("/api/me", (req, res) => {
  res.json({ user: getAuthenticatedUser(req) });
});

app.use((_req, res) => res.status(404).json({ error: "not_found" }));

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
