# Anonymous Identity & Memory Playbook (HIPAA‑safe)
**Step‑by‑Step Implementation Guide v1.0**

> Purpose: Provide a precise, copy‑pasteable plan your team (and Claude) can follow to implement anonymous, unique device/install identity, strict session isolation, and durable user memory—without cross‑contamination and with HIPAA sanity.

---

## 0) Glossary (canonical terms)
- **DID** = *device_install_id* — Random 128‑bit value generated locally on first launch/visit.
- **SID** = *session_id* — Random UUID issued on login; rotates on logout.
- **UID** = *user_id* — Canonical user record identifier (after auth).
- **ADID** = *anon_device_id* — `HMAC(k_device, DID)`; server‑derived, sent to client.
- **UDID** = *user_device_id* — `HMAC(k_user_device, UID || DID)`; server‑derived.

Non‑goals: probabilistic browser/device fingerprinting; third‑party trackers; storing raw DID in any analytics vendor.

---

## 1) High‑level architecture
1) **Pre‑login**: client generates DID once; registers install → server returns ADID.
2) **Login**: client sends ADID → server issues SID, binds `(SID ↦ ADID, UID)` and returns UDID.
3) **Requests**: every API/telemetry call carries `{SID, ADID, (UID if logged in)}` headers.
4) **Middleware**: server enforces tuple invariants; mismatches are rejected.
5) **Logout**: end session, wipe SID‑namespaced caches; next login issues a fresh SID.
6) **Memory**: long‑term by UID; device‑local by UDID; ephemeral by SID.

---

## 2) API contract (copy‑paste)
All endpoints are versioned (`/v1`) and require TLS. Examples shown with JSON.

### 2.1 `POST /v1/install/register`
**Request**: no body. Server generates/reads **DID** as an **HttpOnly cookie** and returns **ADID**.

**Response** `200`
```json
{ "adid": "base64url(HMAC_SHA256(k_device, did))[0:22]" }
```
**Errors**: `401 attestation_failed` (if you add it), `409 duplicate_install` (idempotent OK).

### 2.2 `POST /v1/session/start`
**Request**: no body required for anonymous users.

**Response** `200`
```json
{ "sid": "uuid_v4", "uid": "usr_xxx", "adid": "...", "udid": "base64url(HMAC_SHA256(k_user_device, uid||did))[0:22]" }
```
**Also sets**: `sid` as **HttpOnly; Secure; SameSite=Strict** cookie.

### 2.3 `POST /v1/session/end`
**Request**: none.

**Response**: `204 No Content` and clears `sid` cookie.

### 2.4 Required headers on **every** subsequent call
```
X-ADID: <adid>
```
`X-SID` and `X-UID` are optional because the server reads `sid` from the cookie and already knows `uid` for anonymous users. The guard still enforces `(sid ↦ adid, uid)`.

---

# NEW: Stack‑specific implementation (Node.js/Express TS + Postgres/Drizzle + React/Vite)

This section is drop‑in code for your stack. It includes Drizzle schema/migration, crypto helpers (with a KMS adapter), Express routes & guard, and a tiny React client SDK. It replaces fingerprinting with **secure, persistent, anonymous identity**.

## A) Backend — packages
```bash
npm i express cookie-parser zod uuid
npm i -D typescript ts-node @types/express @types/cookie-parser
npm i drizzle-orm drizzle-kit pg pg-native
```

## B) Drizzle schema (Postgres)
`/db/schema.ts`
```ts
import { pgTable, text, boolean, timestamp, uuid as uuidCol, real, jsonb, primaryKey } from 'drizzle-orm/pg-core'

export const installs = pgTable('installs', {
  adid: text('adid').primaryKey(),
  didHash: text('did_hash').notNull(),
  platform: text('platform').notNull(),
  attested: boolean('attested').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const sessions = pgTable('sessions', {
  sid: uuidCol('sid').primaryKey(),
  adid: text('adid').notNull().references(() => installs.adid),
  uid: text('uid'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  revoked: boolean('revoked').default(false),
})

export const userDevices = pgTable('user_devices', {
  uid: text('uid').notNull(),
  adid: text('adid').notNull().references(() => installs.adid),
  udid: text('udid').notNull().unique(),
  firstSeen: timestamp('first_seen', { withTimezone: true }).defaultNow(),
  lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.uid, t.adid] }) }))

export const agentMemoryFacts = pgTable('agent_memory_facts', {
  uid: text('uid').notNull(),
  factId: text('fact_id').notNull(),
  type: text('type').notNull(),
  value: jsonb('value').notNull(),
  source: text('source').notNull(),
  confidence: real('confidence').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.uid, t.factId] }) }))

export const agentMemorySummaries = pgTable('agent_memory_summaries', {
  uid: text('uid').notNull(),
  period: text('period').notNull(),
  version: text('version').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.uid, t.period, t.version] }) }))
```

## C) Crypto helpers with KMS adapter
`/lib/crypto.ts`
```ts
import { createHmac, randomBytes, createHash } from 'node:crypto'

// MODE can be 'local' (env secrets) or 'kms' (adapter below)
const MODE = process.env.CRYPTO_MODE ?? 'local'

// Local secrets (Base64URL; keep in your secret manager now, KMS later)
const K_DEVICE = Buffer.from(process.env.K_DEVICE_B64URL ?? '', 'base64url')
const K_USER_DEVICE = Buffer.from(process.env.K_USER_DEVICE_B64URL ?? '', 'base64url')

export const b64url = (buf: Buffer) => buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
export const sha256b64url = (buf: Buffer) => b64url(createHash('sha256').update(buf).digest())

export function genDID(): Buffer { return randomBytes(16) }

export async function adidFromDID(did: Buffer): Promise<string> {
  if (MODE === 'kms') return kmsHmacShort('device', did)
  const mac = createHmac('sha256', K_DEVICE).update(did).digest()
  return b64url(mac).slice(0,22)
}

export async function udidFrom(uid: string, did: Buffer): Promise<string> {
  const msg = Buffer.concat([Buffer.from(uid), did])
  if (MODE === 'kms') return kmsHmacShort('user_device', msg)
  const mac = createHmac('sha256', K_USER_DEVICE).update(msg).digest()
  return b64url(mac).slice(0,22)
}

// Placeholder KMS adapter shape (wire later if/when you choose AWS KMS)
async function kmsHmacShort(purpose: 'device'|'user_device', msg: Buffer): Promise<string> {
  // Use AWS KMS Sign with an HMAC key (KeySpec: HMAC_256). Key IDs from env.
  // const KeyId = purpose==='device'? process.env.KMS_DEVICE_KEY_ID! : process.env.KMS_USER_DEVICE_KEY_ID!
  // const mac = await kms.sign({ KeyId, Message: msg, SigningAlgorithm: 'HMAC_SHA_256' })
  // return b64url(Buffer.from(mac.Signature!)).slice(0,22)
  throw new Error('KMS mode not configured')
}
```

## D) Express app with guard & routes
`/app.ts`
```ts
import express from 'express'
import cookieParser from 'cookie-parser'
import { v4 as uuidv4 } from 'uuid'
import { adidFromDID, udidFrom, genDID, sha256b64url, b64url } from './lib/crypto'
import { db } from './db/client' // your Drizzle client
import { installs, sessions, userDevices } from './db/schema'
import { eq } from 'drizzle-orm'

const app = express()
app.use(express.json())
app.use(cookieParser())

// Helper to read/set DID cookie
function getDidCookie(req: express.Request) {
  const val = req.cookies['did']
  return val ? Buffer.from(val, 'base64url') : null
}
function setDidCookie(res: express.Response, did: Buffer) {
  res.cookie('did', b64url(did), {
    httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 1000*60*60*24*365*5
  })
}
function clearSidCookie(res: express.Response) {
  res.clearCookie('sid', { path: '/' })
}
function setSidCookie(res: express.Response, sid: string) {
  res.cookie('sid', sid, { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 1000*60*60*24*30 })
}

// 1) /v1/install/register — sets DID cookie if missing; returns ADID
app.post('/v1/install/register', async (req, res) => {
  let did = getDidCookie(req)
  if (!did) { did = genDID(); setDidCookie(res, did) }
  const adid = await adidFromDID(did)
  const didHash = sha256b64url(did)
  const platform = req.get('X-Platform') ?? 'web'
  // upsert installs
  await db.insert(installs).values({ adid, didHash, platform }).onConflictDoNothing()
  return res.json({ adid })
})

// 2) /v1/session/start — creates anonymous user if needed; sets SID cookie
app.post('/v1/session/start', async (req, res) => {
  const did = getDidCookie(req)
  if (!did) return res.status(401).json({ error: 'no_install' })
  const adid = await adidFromDID(did)

  // Bind or create a pseudonymous user for this ADID
  // Strategy: if a userDevices row exists, reuse its uid; otherwise create one
  let row = await db.select().from(userDevices).where(eq(userDevices.adid, adid)).limit(1)
  let uid: string
  if (row.length) { uid = row[0].uid }
  else {
    uid = `usr_${uuidv4().replace(/-/g,'')}`
    const udid = await udidFrom(uid, did)
    await db.insert(userDevices).values({ uid, adid, udid })
  }

  const sid = uuidv4()
  await db.insert(sessions).values({ sid, adid, uid })
  setSidCookie(res, sid)
  const udid = await udidFrom(uid, did)
  return res.json({ sid, uid, adid, udid })
})

// 3) Guard middleware — enforce tuple invariants
app.use(async (req, res, next) => {
  const sid = req.cookies['sid']
  const adid = req.get('X-ADID')
  if (!sid || !adid) return res.status(401).set('X-Client-Action','RESET').end()

  const sess = (await db.select().from(sessions).where(eq(sessions.sid, sid)).limit(1))[0]
  if (!sess || sess.revoked) return res.status(401).set('X-Client-Action','RESET').end()
  if (sess.adid !== adid)   return res.status(401).set('X-Client-Action','RESET').end()

  ;(req as any).ctx = { uid: sess.uid!, adid, sid }
  return next()
})

// 4) Example protected route
app.get('/v1/me', (req, res) => {
  const ctx = (req as any).ctx
  res.json({ uid: ctx.uid, adid: ctx.adid })
})

// 5) /v1/session/end — revoke session and clear cookie
app.post('/v1/session/end', async (req, res) => {
  const sid = req.cookies['sid']
  if (sid) await db.update(sessions).set({ revoked: true }).where(eq(sessions.sid, sid))
  clearSidCookie(res)
  res.status(204).end()
})

export default app
```

## E) React client SDK (Vite/TS)
`/src/lib/identity.ts`
```ts
let ADID: string | null = null

export async function ensureInstall(): Promise<string> {
  if (ADID) return ADID
  const r = await fetch('/v1/install/register', { method: 'POST', credentials: 'include' })
  if (!r.ok) throw new Error('install_register_failed')
  const { adid } = await r.json()
  ADID = adid
  return adid
}

export async function ensureSession(): Promise<{ uid: string }>{
  await ensureInstall()
  const r = await fetch('/v1/session/start', { method: 'POST', credentials: 'include' })
  if (!r.ok) throw new Error('session_start_failed')
  const { uid } = await r.json()
  return { uid }
}

export async function api(path: string, init: RequestInit = {}) {
  await ensureInstall()
  const headers = new Headers(init.headers)
  headers.set('X-ADID', ADID!)
  return fetch(path, { ...init, headers, credentials: 'include' })
}
```

**Usage in your app entry**
```ts
// main.tsx
import { ensureSession } from './lib/identity'
ensureSession().catch(() => window.location.reload())
```

This ensures:
- DID is generated and locked in an **HttpOnly** cookie → JS cannot read it (reduces exfil risk).
- ADID is derived on the server and returned to JS once for headering.
- A durable anonymous **UID** is created and bound to the ADID, fixing the “multiple users” issue.
- Session **SID** lives in an HttpOnly cookie and is enforced server‑side.

## F) Tests (Jest)
`/tests/guard.test.ts`
```ts
// Sketch: focuses on the invariants
// 1) /install/register sets cookie + returns adid
// 2) /session/start sets sid, binds uid
// 3) Protected route 401 without X-ADID, 200 with matching X-ADID
// 4) Mismatch adid → 401 with X-Client-Action: RESET
```

## G) Environment (+ HIPAA posture)
- `CRYPTO_MODE=local` initially; set `K_DEVICE_B64URL` and `K_USER_DEVICE_B64URL` with **high‑entropy** 32‑byte randoms (Base64URL). Store in your secret manager. When you settle on infra, switch to `CRYPTO_MODE=kms` and wire AWS KMS keys.
- Serve SPA and API on the same origin to keep cookies **SameSite=Strict**.
- Vendors that touch `uid/adid/udid` must be under a **BAA** before prod.

## H) Migration from broken fingerprinting
1) Ship `/v1/install/register` + `/v1/session/start`.
2) On first API call from old clients, detect missing `X-ADID` → 401 with `X-Client-Action: RESET` and show a friendly “We updated our security. Please refresh.”
3) The new flow binds a single durable UID per device; no more accidental multi‑user creation.

---

### Appendix: Rationale
- Hiding DID in an HttpOnly cookie prevents JS/framework bugs from leaking it. ADID (HMAC) is safe to expose.
- Anonymous UID ensures healthcare data isolation **now**, while allowing future account linking without schema changes.
- Drizzle schema mirrors the earlier design so your memory layer (by UID) immediately stabilizes.

- HMAC‑derived IDs give determinism and unlinkability without exposing secrets.
- SID namespacing + server invariants is the simplest reliable way to eradicate cross‑contamination.
- Long‑term memory by UID enables relationship continuity without increasing PHI surface beyond what you already need for auth.

