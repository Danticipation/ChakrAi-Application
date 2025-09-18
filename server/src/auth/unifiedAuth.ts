import 'dotenv/config';
import type { Request, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";

const COOKIE_CANDIDATES = ["sb-access-token", "access_token", "yo_access", "session"] as const;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const ACCESS_TOKEN_JWKS  = process.env.ACCESS_TOKEN_JWKS as string | undefined;     // https://…/.well-known/jwks.json

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
    if (!token) return res.status(401).json({ error: "unauthenticated" });

    const payload = await verifyAccessToken(token);
    if (!payload?.sub) return res.status(401).json({ error: "invalid_token" });

    (req as any).auth = {
      token, // never log it
      user: {
        sub: String(payload.sub),
        email: (payload as any).email,
        roles: (payload as any).roles ?? [],
        ...payload
      }
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err instanceof Error ? err.message : err);
    res.status(401).json({ error: "auth_failed" });
  }
}

export function getAuthenticatedUser(req: Request) {
  const user = (req as any).auth?.user;
  if (!user) throw new Error("auth_ctx_missing");
  return user;
}
