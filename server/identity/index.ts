import type { Request, Response } from 'express';
import crypto from 'crypto';

// Enhanced identity helper with key rotation support
function makeUid() {
  return 'usr_' + crypto.randomBytes(16).toString('hex');
}

const COOKIE_NAME = process.env.UID_COOKIE_NAME || 'u';
const COOKIE_SECURE =
  process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production';

// Key rotation support - parse signing keys
type KeyBag = Record<string, Buffer>;

function parseKeys(env?: string): { activeKid: string, keys: KeyBag } {
  if (!env) throw new Error('UID_SIGNING_KEYS missing');
  const keys: KeyBag = {};
  const pairs = env.split(',').map(s => s.trim()).filter(Boolean);
  if (!pairs.length) throw new Error('UID_SIGNING_KEYS invalid');
  let activeKid = '';
  for (const pair of pairs) {
    const [kid, b64] = pair.split(':');
    if (!kid || !b64) throw new Error('UID_SIGNING_KEYS malformed');
    keys[kid] = Buffer.from(b64, 'base64');
    if (!activeKid) activeKid = kid; // first = active
  }
  return { activeKid, keys };
}

const { activeKid, keys } = parseKeys(process.env.UID_SIGNING_KEYS);

const b64u = (buf: Buffer) =>
  buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

// Cryptographic sealing with key rotation
function seal(uid: string) {
  const kid = activeKid;
  const key = keys[kid];
  if (!key) throw new Error(`Active key ${kid} not found`);
  
  const mac = crypto.createHmac('sha256', key).update(`${uid}.${kid}`).digest();
  return `${uid}.${kid}.${b64u(mac)}`;
}

// Verify sealed token with support for multiple keys
function unseal(token: string | undefined | null): string | null {
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [uid, kid, sig] = parts as [string, string, string];
  if (!kid || !keys[kid]) return null;
  const key = keys[kid];
  if (!key || !uid || !/^usr_[0-9a-f]{32}$/.test(uid)) return null;
  
  const mac = crypto.createHmac('sha256', key).update(`${uid}.${kid}`).digest();
  if (!sig) return null;
  const got = Buffer.from(sig.replace(/-/g,'+').replace(/_/g,'/'), 'base64');
  const ok = got.length === mac.length && crypto.timingSafeEqual(got, mac);
  
  return ok ? uid : null;
}

export function readUidCookie(req: Request): string | null {
  const raw = (req as any).cookies?.[COOKIE_NAME];
  return unseal(raw);
}

export function writeUidCookie(res: Response, uid: string) {
  res.cookie(COOKIE_NAME, seal(uid), {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 400 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  });
}

export function ensureRequestUid(req: Request, res: Response): string {
  const ctx: any = (req as any).ctx || ((req as any).ctx = {});
  if (ctx.uid && typeof ctx.uid === 'string' && ctx.uid.startsWith('usr_')) {
    return ctx.uid;
  }
  
  // 1) Try cookie with cryptographic verification
  const fromCookie = readUidCookie(req);
  if (fromCookie) {
    ctx.uid = fromCookie;
    return fromCookie;
  }
  
  // 2) Mint once, set signed cookie
  const minted = makeUid();
  ctx.uid = minted;
  writeUidCookie(res, minted);
  return minted;
}
