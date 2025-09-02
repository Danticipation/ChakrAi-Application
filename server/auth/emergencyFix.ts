/**
 * IMMEDIATE HOTFIX: Stop user ID chaos
 * Replaces broken fingerprinting with stable cookie-based identity
 */

import express from 'express'
import '../../types/express-request.js'
import { v4 as uuid } from 'uuid'
import { db } from '../db.js'
import { users } from '../../shared/schema.js'
import { eq } from 'drizzle-orm'

// Single source of truth for device identity
const DEVICE_SESSION_MAP = new Map<string, number>()

function getStableDeviceId(req: express.Request): string {
  // Use cookie-based stable ID
  let deviceId = req.cookies['chakrai_device_id']
  
  if (!deviceId) {
    deviceId = `device_${uuid().replace(/-/g, '')}`
    // Will be set by middleware
  }
  
  return deviceId
}

export const emergencyAuthFix = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const deviceId = getStableDeviceId(req)
    
    // Set cookie if new
    if (!req.cookies['chakrai_device_id']) {
      res.cookie('chakrai_device_id', deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365 * 5 // 5 years
      })
    }
    
    // Get or create single user for this device
    let userId = DEVICE_SESSION_MAP.get(deviceId)
    
    if (!userId) {
      // Check database first
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.deviceFingerprint, deviceId))
        .limit(1)
      
      if (existingUser.length > 0 && existingUser[0]) {
        userId = existingUser[0].id
        DEVICE_SESSION_MAP.set(deviceId, userId)
      } else {
        // Create new user ONLY if none exists
        const newUser = await db.insert(users).values({
          username: `user_${deviceId.slice(7, 15)}`,
          deviceFingerprint: deviceId,
          isAnonymous: true,
          displayName: 'Anonymous User',
          sessionId: deviceId
        }).returning()
        
        if (newUser[0]) {
          userId = newUser[0].id
          DEVICE_SESSION_MAP.set(deviceId, userId)
          console.log(`✅ EMERGENCY FIX: Created single user ${userId} for device ${deviceId.slice(0, 12)}...`)
        }
      }
    }
    
    // Set user context
    if (userId) {
      req.userId = userId
      req.user = { id: userId }
      req.authenticatedUserId = userId
    }
    req.isAnonymous = true
    
    console.log(`🔒 EMERGENCY AUTH: User ${userId}`)
    next()
    
  } catch (error) {
    console.error('❌ Emergency auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

export default emergencyAuthFix
