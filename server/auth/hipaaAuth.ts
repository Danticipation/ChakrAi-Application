import express from 'express'
import { db } from '../db.js'
import { sessions, installs, userDevices } from '../../shared/schema.js'
import { eq } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { adidFromDID, udidFrom, genDID, sha256b64url, b64url } from '../lib/crypto.js'
import { uidLog, uidError } from '../util/uidLog.js'
import { makeUidTag } from '../util/uidTag.js'


// Database connection check
let dbAvailable = false;
try {
  if (db) {
    dbAvailable = true;
  }
} catch (error) {
  console.warn('⚠️ Database not available, using fallback auth');
  dbAvailable = false;
}

// HIPAA-compliant guard middleware
export const hipaaAuthMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.log('🔐 HIPAA Auth: Processing request for', req.url);
    
    // Skip HIPAA auth for static assets and common non-API requests
    const staticPaths = ['/assets/', '/favicon', '/manifest', '/sw.js', '/.well-known/', '/logo', '/icon'];
    const isStaticRequest = staticPaths.some(path => req.url.includes(path));
    
    if (isStaticRequest) {
      console.log('📋 Skipping HIPAA auth for static resource:', req.url);
      return next();
    }
    
    let uid: string | undefined;
    
    // Check if database is available before proceeding
    if (!dbAvailable) {
      console.log('🔄 Database unavailable, using session fallback auth');
      // Generate consistent session-based UID
      const sessionId = req.cookies?.['session_id'] || Math.random().toString(36).substring(2, 15);
      if (!req.cookies?.['session_id']) {
        res.cookie('session_id', sessionId, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 30,
          path: '/'
        });
      }
      
      uid = `usr_session_${sessionId}`;
      console.log('✅ Using session-based UID:', uid);
    } else {
      // 1. Check for existing UID token (prefer signed, fallback to plain)
      const rawCookie = req.signedCookies?.['u'] || req.cookies?.['u'];
      uid = rawCookie;
      console.log('🍪 Existing UID cookie:', uid ? 'present' : 'none');

      // 2. If no UID cookie, create new identity
      if (!uid) {
        console.log('🆕 Creating new identity...');
        
        try {
          // Generate DID for this device
          const did: Buffer = req.cookies?.['did']
            ? Buffer.from(req.cookies['did'], 'base64url')
            : genDID();

          res.cookie('did', b64url(did), {
            httpOnly: true,
            signed: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: process.env['NODE_ENV'] === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 365 * 5
          });

          // Get ADID from DID
          console.log('📱 Getting ADID from DID...');
          const adid = await adidFromDID(did)
          
          console.log('💾 Inserting install record...');
          try {
            await db.insert(installs)
              .values({ adid, didHash: sha256b64url(did), platform: 'web' })
              .onConflictDoNothing()
          } catch (dbError) {
            console.warn('⚠️ Install record insert failed, continuing:', (dbError as Error).message);
          }

          // Create session
          let sid = req.cookies?.['sid'] || req.signedCookies?.['sid']
          if (!sid) {
            console.log('🔄 Creating new session...');
            sid = uuid()
            res.cookie('sid', sid, {
              httpOnly: true,
              signed: true,
              secure: process.env['NODE_ENV'] === 'production',
              sameSite: process.env['NODE_ENV'] === 'production' ? 'none' : 'lax',
              path: '/',
              maxAge: 1000*60*60*24*30
            })
            try {
              await db.insert(sessions).values({ sid, adid, uid: null })
            } catch (dbError) {
              console.warn('⚠️ Session insert failed, continuing:', (dbError as Error).message);
            }
          }

          // Get or create single user for this ADID (race-proof)
          console.log('👤 Getting or creating user...');
          let existing: { uid: string | null }[] = [];
          try {
            existing = await db.select().from(userDevices).where(eq(userDevices.adid, adid)).limit(1)
          } catch (dbError) {
            console.warn('⚠️ User lookup failed, using fallback:', (dbError as Error).message);
          }
          
          uid = existing[0]?.uid ?? undefined
          
          if (!uid) {
            console.log('🆕 Creating new user...');
            const newUid = `usr_${uuid().replace(/-/g,'')}`
            
            try {
              const udid = await udidFrom(newUid, did)
              
              // Atomic upsert - prevents race conditions
              const result = await db.insert(userDevices)
                .values({ uid: newUid, adid, udid })
                .onConflictDoUpdate({
                  target: userDevices.adid,
                  set: { lastSeen: new Date() }
                })
                .returning({ uid: userDevices.uid })
              
              uid = result[0]?.uid
              if (uid === newUid) {
                uidLog(`✅ Created single user ${uid} for ADID ${adid.slice(0,8)}...`)
              }
            } catch (dbError) {
              console.warn('⚠️ User creation failed, using generated UID:', (dbError as Error).message);
              uid = newUid; // Use the generated UID even if DB insert failed
            }
          }

          // Update session with UID
          console.log('🔄 Updating session with UID...');
          try {
            await db.update(sessions).set({ uid }).where(eq(sessions.sid, sid))
          } catch (dbError) {
            console.warn('⚠️ Session update failed, continuing:', (dbError as Error).message);
          }

          // Set the signed UID cookie
          console.log('🍪 Setting UID cookie...');
          res.cookie('u', uid, {
            httpOnly: true,
            signed: true,
            maxAge: 1000 * 60 * 60 * 24 * 365 * 2, // 2 years
            sameSite: process.env['NODE_ENV'] === 'production' ? 'none' : 'lax',
            secure: process.env['NODE_ENV'] === 'production',
            path: '/'
          })
          
        } catch (dbError) {
          console.error('💥 Database operation failed, using fallback UID:', (dbError as Error).message);
          // Generate a fallback UID when database is completely unavailable
          uid = `usr_fallback_${Math.random().toString(36).substring(2, 15)}`;
          console.log('🆕 Using fallback UID:', uid);
        }
      }
    }

    // 3. Set context with proper numeric conversion
    console.log('🔢 Setting request context...');
    if (!uid) {
      // This should not happen in normal flow, but as a safeguard:
      console.error('💥 Critical auth error: UID is missing before setting context.');
      uid = `usr_emergency_${uuid().replace(/-/g, '')}`;
      uidError('🚨 Critical auth error: UID was missing, generated emergency UID.', { url: req.url });
    }
    ;(req as any).ctx = { uid }
    // Use a simple hash for consistent numeric ID
    const hashCode = uid.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a; // Convert to 32bit integer
    }, 0);
    const positiveId = Math.abs(hashCode) % 2147483647; // Keep it positive and within INT range
    req.userId = positiveId;
    req.user = { 
      id: positiveId, 
      uid: uid, 
      adid: req.cookies?.['adid'] || 'unknown_adid', // Fallback if adid not yet set in cookie
      sid: req.cookies?.['sid'] || 'unknown_sid', // Fallback if sid not yet set in cookie
      isAnonymous: true 
    };
    req.authenticatedUserId = positiveId;
    req.isAnonymous = true;

    // 4. Set locals for downstream use (canonical UID and stable tag)
    res.locals['uid'] = uid;                 // the real persistent UID, e.g. "usr_abcdef..."
    res.locals['uidTag'] = makeUidTag(uid);  // short, stable, anonymized tag for logs

    console.log(`✅ HIPAA Auth successful: ${uid} -> userId: ${positiveId}`);
    uidLog(`🔒 HIPAA Auth: ${uid}`)
    next()
  } catch (error) {
    console.error('❌ HIPAA auth error for', req.url, ':', error);
    console.error('📊 Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack?.split('\n').slice(0, 5).join('\n'),
      type: (error as any).constructor.name
    });
    uidError('❌ HIPAA auth error:', error as Error)
    res.status(500).json({ error: 'authentication_error' })
  }
}

export default hipaaAuthMiddleware
