import express, { type Request, type Response } from 'express'
import { safe } from '../util/safe.js';
import { v4 as uuidv4 } from 'uuid'
import { adidFromDID, udidFrom, genDID, sha256b64url, b64url } from '../lib/crypto.js'
import { db } from '../db.js'
import { installs, sessions, userDevices } from '../../shared/schema.js'
import { eq } from 'drizzle-orm'

const router = express.Router()

// Helper to read/set DID cookie
function getDidCookie(req: express.Request) {
  const val = req.cookies['did']
  return val ? Buffer.from(val, 'base64url') : null
}

function setDidCookie(res: express.Response, did: Buffer) {
  res.cookie('did', b64url(did as Buffer), {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict', 
    path: '/', 
    maxAge: 1000*60*60*24*365*5
  })
}

function clearSidCookie(res: express.Response) {
  res.clearCookie('sid', { path: '/' })
}

function setSidCookie(res: express.Response, sid: string) {
  res.cookie('sid', sid, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict', 
    path: '/', 
    maxAge: 1000*60*60*24*30 
  })
}

// 1) /v1/install/register – sets DID cookie if missing; returns ADID
router.post('/install/register', safe(async (req: Request, res: Response) => {
  let did = getDidCookie(req);
  if (!did) { 
    const generatedDid = genDID();
    did = Buffer.from(generatedDid);
    setDidCookie(res, did); 
  }
  
  const adid = await adidFromDID(did!);
  const didHash = sha256b64url(did!);
  const platform = req.get('X-Platform') ?? 'web';
  
  // upsert installs
  await db.insert(installs)
    .values({ adid, didHash, platform })
    .onConflictDoNothing()
  
  console.log(`✅ Install registered: ${adid}`)
  return res.json({ adid })
}))

// 2) /v1/session/start – creates anonymous user if needed; sets SID cookie
router.post('/session/start', safe(async (req: Request, res: Response) => {
  const did = getDidCookie(req);
  if (!did) return res.status(401).json({ error: 'no_install' });
  
  const adid = await adidFromDID(did);

  // Bind or create a pseudonymous user for this ADID
  let row = await db.select().from(userDevices).where(eq(userDevices.adid, adid)).limit(1);
  let uid: string;
  
  if (row.length && row[0]) { 
    uid = row[0].uid;
    // Update last seen
    await db.update(userDevices)
      .set({ lastSeen: new Date() })
      .where(eq(userDevices.adid, adid));
  } else {
    uid = `usr_${uuidv4().replace(/-/g,'')}`;
    const udid = await udidFrom(uid, did);
    await db.insert(userDevices).values({ uid, adid, udid });
  }

  const sid = uuidv4();
  await db.insert(sessions).values({ sid, adid, uid });
  setSidCookie(res, sid);
  const udid = await udidFrom(uid, did);
  
  console.log(`✅ Session started: uid=${uid}, sid=${sid}`);
  return res.json({ sid, uid, adid, udid });
}))

// 3) /v1/session/end – revoke session and clear cookie
router.post('/session/end', safe(async (req: Request, res: Response) => {
  const sid = req.cookies['sid']
  if (sid) {
    await db.update(sessions)
      .set({ revoked: true })
      .where(eq(sessions.sid, sid))
  }
  clearSidCookie(res)
  console.log(`✅ Session ended: ${sid}`)
  res.status(204).end()
}))

export default router
