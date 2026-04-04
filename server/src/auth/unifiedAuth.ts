import 'dotenv/config';
import type { Request, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import { logAudit, logFailedAccess } from '../middleware/auditLogger.js';

const COOKIE_CANDIDATES = ["sb-access-token", "access_token", "yo_access", "session"] as const;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const ACCESS_TOKEN_JWKS  = process.env.ACCESS_TOKEN_JWKS as string | undefined;     // https://…/.well-known/jwks.json

// HIPAA COMPLIANCE: Session timeout configuration
// Sessions must expire after 15 minutes of inactivity (HIPAA recommended)
const SESSION_TIMEOUT_MINUTES = 15;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;

// Track last activity time for each session
const sessionActivity = new Map<string, number>();

export function ensureAuthConfig() {
  if (!ACCESS_TOKEN_SECRET && !ACCESS_TOKEN_JWKS) {
    // Refuse to boot without verification material
    throw new Error("AUTH_MISCONFIGURED: set ACCESS_TOKEN_JWKS or ACCESS_TOKEN_SECRET");
  }
}

function extractBearer(req: Request): string | null {
  const raw = req.get("authorization") || req.get("Authorization");
  if (!raw) return null;
  const m = /^Bearer\s+(.+)$/.exec(raw.trim());
  return m ? m[1] : null;
}

function extractCookie(req: Request): string | null {
  const cookies = (req as any).cookies ?? {};
  for (const name of COOKIE_CANDIDATES) {
    const v = cookies[name];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    if (ACCESS_TOKEN_JWKS) {
      const jwks = createRemoteJWKSet(new URL(ACCESS_TOKEN_JWKS));
      const { payload } = await jwtVerify(token, jwks, { algorithms: ['RS256', 'PS256', 'ES256', 'EdDSA'] }); // Assuming common asymmetric algorithms
      return payload;
    }
    if (ACCESS_TOKEN_SECRET) {
      const key = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      return payload;
    }
    return null;
  } catch (error) {
    console.error("[verifyAccessToken] Token verification failed:", error);
    return null;
  }
}

export async function unifiedAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractBearer(req) ?? extractCookie(req);
    if (!token) {
      await logFailedAccess(req, 'authentication', 'no_token_provided');
      return res.status(401).json({ error: "unauthenticated" });
    }

    const payload = await verifyAccessToken(token);
    if (!payload?.sub) {
      await logFailedAccess(req, 'authentication', 'invalid_token');
      return res.status(401).json({ error: "invalid_token" });
    }

    // HIPAA COMPLIANCE: Check session timeout
    const sessionKey = `${payload.sub}_${token.substring(0, 10)}`;
    const lastActivity = sessionActivity.get(sessionKey);
    const now = Date.now();

    if (lastActivity && (now - lastActivity) > SESSION_TIMEOUT_MS) {
      // Session expired due to inactivity
      sessionActivity.delete(sessionKey);
      await logAudit(req, {
        userId: parseInt(String(payload.sub)),
        actorUserId: parseInt(String(payload.sub)),
        actorType: 'user',
        action: 'logout',
        resourceType: 'session',
        success: true,
        accessReason: 'session_timeout',
        complianceFlags: ['automatic_logout_inactivity'],
      });
      return res.status(401).json({ 
        error: "session_expired", 
        message: `Session expired after ${SESSION_TIMEOUT_MINUTES} minutes of inactivity` 
      });
    }

    // Update last activity time
    sessionActivity.set(sessionKey, now);

    (req as any).auth = {
      token, // never log it
      user: {
        sub: String(payload.sub),
        email: (payload as any).email,
        roles: (payload as any).roles ?? [],
        ...payload
      }
    };

    // Set userId for HIPAA compliance and backward compatibility
    (req as any).userId = parseInt(String(payload.sub));

    next();
  } catch (err) {
    console.error("Auth middleware error:", err instanceof Error ? err.message : err);
    await logFailedAccess(req, 'authentication', 'auth_middleware_error');
    res.status(401).json({ error: "auth_failed" });
  }
}

export function getAuthenticatedUser(req: Request) {
  const user = (req as any).auth?.user;
  if (!user) throw new Error("auth_ctx_missing");
  return user;
}
