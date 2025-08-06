import { storage } from './storage.js';
import { nanoid } from 'nanoid';

export interface AnonymousUser {
  id: number;
  sessionId: string;
  deviceFingerprint: string;
  isAnonymous: boolean;
  createdAt: Date;
  lastActiveAt: Date;
}

export class UserSessionManager {
  private static instance: UserSessionManager;
  
  static getInstance(): UserSessionManager {
    if (!UserSessionManager.instance) {
      UserSessionManager.instance = new UserSessionManager();
    }
    return UserSessionManager.instance;
  }

  /**
   * Get or create anonymous user based on device fingerprint
   */
  async getOrCreateAnonymousUser(deviceFingerprint: string, sessionId?: string): Promise<AnonymousUser> {
    try {
      // First try to find existing user by device fingerprint
      const existingUser = await storage.getUserByDeviceFingerprint(deviceFingerprint);
      
      if (existingUser) {
        // Update last active time
        await storage.updateUserLastActive(existingUser.id);
        return {
          id: existingUser.id,
          sessionId: existingUser.sessionId || sessionId || nanoid(),
          deviceFingerprint,
          isAnonymous: true,
          createdAt: existingUser.createdAt || new Date(),
          lastActiveAt: new Date()
        };
      }

      // Create new anonymous user with unique username
      const newSessionId = sessionId || nanoid(12);
      const uniqueUsername = `anonymous_${newSessionId}_${Date.now()}_${nanoid(6)}`;
      
      const newUser = await storage.createUser({
        username: uniqueUsername,
        sessionId: newSessionId,
        deviceFingerprint,
        isAnonymous: true
      });

      return {
        id: newUser.id,
        sessionId: newSessionId,
        deviceFingerprint,
        isAnonymous: true,
        createdAt: newUser.createdAt || new Date(),
        lastActiveAt: new Date()
      };
    } catch (error) {
      console.error('Error creating anonymous user:', error);
      
      // Handle duplicate constraint violations (username or session_id)
      if (error.code === '23505' && (error.constraint === 'users_username_unique' || error.constraint === 'users_session_id_key')) {
        console.log('Username collision detected, retrying with new unique identifier...');
        
        // Generate a completely unique username with timestamp and random suffix
        const fallbackSessionId = nanoid(16);
        const fallbackUsername = `anon_${Date.now()}_${nanoid(10)}`;
        
        try {
          const fallbackUser = await storage.createUser({
            username: fallbackUsername,
            sessionId: fallbackSessionId,
            deviceFingerprint,
            isAnonymous: true
          });
          
          return {
            id: fallbackUser.id,
            sessionId: fallbackSessionId,
            deviceFingerprint,
            isAnonymous: true,
            createdAt: fallbackUser.createdAt || new Date(),
            lastActiveAt: new Date()
          };
        } catch (retryError) {
          console.error('Fallback user creation also failed:', retryError);
          throw new Error('Failed to create anonymous user session after retry');
        }
      }
      
      throw new Error('Failed to create anonymous user session');
    }
  }

  /**
   * Generate device fingerprint from request headers
   */
  generateDeviceFingerprint(req: any): string {
    // For consistency, always use the explicit header first
    const explicitFingerprint = req.headers['x-device-fingerprint'];
    if (explicitFingerprint) {
      return Array.isArray(explicitFingerprint) ? explicitFingerprint[0] : explicitFingerprint;
    }

    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const forwarded = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    
    // Create a stable fingerprint (not for security, just for user identification)
    const fingerprint = Buffer.from(
      userAgent + acceptLanguage + acceptEncoding + forwarded
    ).toString('base64').substring(0, 20);
    
    return fingerprint;
  }

  /**
   * Get session info from request
   */
  getSessionFromRequest(req: any): { sessionId?: string; deviceFingerprint: string } {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    // Priority: explicit device fingerprint header > generated from browser headers
    const deviceFingerprint = req.headers['device-fingerprint'] || this.generateDeviceFingerprint(req);
    
    return { sessionId, deviceFingerprint };
  }

  /**
   * Clean up old anonymous sessions (older than 90 days)
   */
  async cleanupOldSessions(): Promise<void> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await storage.deleteInactiveAnonymousUsers(ninetyDaysAgo);
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }
}

export const userSessionManager = UserSessionManager.getInstance();