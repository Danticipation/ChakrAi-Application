import { Router } from 'express';

const router = Router();

/**
 * GET /api/debug/whoami
 * Shows the UID the backend uses for this request.
 * Returns clean JSON only - no streaming, no next() calls.
 */
router.get('/whoami', (req, res) => {
  const signed = req.signedCookies?.u;
  const plain = req.cookies?.u;
  const cookieVal = signed || plain || '';
  
  // Set response type explicitly
  res.type('application/json');
  
  // Return clean JSON response without calling next()
  return res.status(200).json({
    uid: res.locals.uid ?? null,
    hasCookie: Boolean(cookieVal),
    cookiePresent: Boolean(req.headers.cookie),
    cookieSigned: Boolean(signed),
    cookieName: 'u',
    cookieLength: cookieVal.length,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    secureContext: !!req.secure,
    host: req.headers.host || null,
  });
});

/**
 * GET /api/debug/cookies
 * Safe cookie diagnostics (no secrets). Enabled only in non-production.
 */
router.get('/cookies', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ ok: false, message: 'Not available in production' });
  }

  const cookieName = process.env.UID_COOKIE_NAME || 'u';  // Fixed: use 'u' not 'chakrai_uid'
  const raw = (req as any).cookies?.[cookieName];

  res.json({
    ok: true,
    cookieName,
    present: !!raw,
    length: raw?.length || 0,
    // show only first/last 6 chars to confirm rotation without leaking entire value
    preview: raw ? `${raw.slice(0, 6)}...${raw.slice(-6)}` : null
  });
});

export default router;