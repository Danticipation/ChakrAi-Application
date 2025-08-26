import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'

type KeyBag = Record<string, Buffer>

function parseKeys(env?: string): { activeKid: string, keys: KeyBag } {
  if (!env) throw new Error('UID_SIGNING_KEYS missing')
  const keys: KeyBag = {}
  const pairs = env.split(',').map(s => s.trim()).filter(Boolean)
  if (!pairs.length) throw new Error('UID_SIGNING_KEYS invalid')
  let activeKid = ''
  for (const pair of pairs) {
    const [kid, b64] = pair.split(':')
    if (!kid || !b64) throw new Error('UID_SIGNING_KEYS malformed')
    keys[kid] = Buffer.from(b64, 'base64')
    if (!activeKid) activeKid = kid // first = active
  }
  return { activeKid, keys }
}

const { activeKid, keys } = parseKeys(process.env.UID_SIGNING_KEYS)

const b64u = (buf: Buffer) =>
  buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')

function seal(uid: string, kid: string) {
  const mac = crypto.createHmac('sha256', keys[kid]).update(`${uid}.${kid}`).digest()
  return `${uid}.${kid}.${b64u(mac)}`
}

function verify(token: string): { ok: boolean, uid?: string, kid?: string } {
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false }
  const [uid, kid, sig] = parts
  const key = keys[kid]
  if (!key || !/^usr_[0-9a-f]{32}$/.test(uid)) return { ok: false }
  const mac = crypto.createHmac('sha256', key).update(`${uid}.${kid}`).digest()
  const got = Buffer.from(sig.replace(/-/g,'+').replace(/_/g,'/'), 'base64')
  const ok = got.length === mac.length && crypto.timingSafeEqual(got, mac)
  return ok ? { ok, uid, kid } : { ok: false }
}

const newUid = () => 'usr_' + crypto.randomBytes(16).toString('hex') // 32 hex

/**
 * Behavior:
 * - If upstream HIPAA middleware already set req.ctx.uid, we trust it and sync the cookie.
 * - Else we verify cookie; if absent/invalid we mint a new uid.
 * - We never create multiple UIDs for the same browser.
 */
export function uidCookie(req: Request, res: Response, next: NextFunction) {
  const cookieName = 'u'
  const priorCtxUid: string | undefined = (req as any)?.ctx?.uid
  const token = (req as any)?.cookies?.[cookieName] || ''
  const verified = verify(token)

  let uid = priorCtxUid || verified.uid || newUid()
  let needsSet = false

  // Use active key ID from environment
  const activeKeyId = process.env.UID_ACTIVE_KEY_ID || activeKid

  // If HIPAA upstream gave us a uid and cookie disagrees, re-seal with that uid
  if (priorCtxUid) {
    if (!verified.ok || verified.uid !== priorCtxUid || verified.kid !== activeKeyId) {
      needsSet = true
    }
  } else {
    // No upstream uid: set cookie if not valid or wrong key id
    if (!verified.ok || verified.kid !== activeKeyId) {
      needsSet = true
    }
  }

  if (needsSet) {
    const sealed = seal(uid, activeKeyId)
    res.cookie(cookieName, sealed, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 400 * 24 * 60 * 60 * 1000, // ~13 months
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/',
    })
  }

  // expose UID to downstream auth + RLS middleware
  ;(req as any).ctx = { ...(req as any).ctx, uid }
  next()
}