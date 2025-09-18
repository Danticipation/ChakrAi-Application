/**
 * UNIFIED USER SESSION SYSTEM
 * 
 * CRITICAL: This replaces all other user ID systems.
 * ALL components must use this system to ensure consistent user IDs.
 * 
 * Single Source of Truth: HIPAA Auth Middleware (server-side)
 */

interface AuthenticatedUser {
  id: number;
  sessionId: string;
  deviceFingerprint: string;
  isAuthenticated: boolean;
  timestamp: string;
}

class UnifiedUserSessionManager {
  private static instance: UnifiedUserSessionManager;
  private cachedUser: AuthenticatedUser | null = null;
  private isAuthenticating = false;

  static getInstance(): UnifiedUserSessionManager {
    if (!UnifiedUserSessionManager.instance) {
      UnifiedUserSessionManager.instance = new UnifiedUserSessionManager();
    }
    return UnifiedUserSessionManager.instance;
  }

  /**
   * Get device fingerprint (compatible with HIPAA system)
   */
  private getDeviceFingerprint(): string {
    // Use existing device fingerprint or create one
    const existing = localStorage.getItem('deviceFingerprint');
    if (existing) {
      return existing;
    }

    // Generate new fingerprint compatible with server system
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const fingerprint = `chakrai_${timestamp}_${random}`;
    
    localStorage.setItem('deviceFingerprint', fingerprint);
    return fingerprint;
  }

  /**
   * Get session ID (compatible with HIPAA system)
   */
  private getSessionId(): string {
    const existing = localStorage.getItem('sessionId');
    if (existing) {
      return existing;
    }

    const sessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('sessionId', sessionId);
    return sessionId;
  }

  /**
   * CRITICAL: Get authenticated user ID from HIPAA auth system
   * This is the ONLY way to get user ID in the application
   */
  async getAuthenticatedUserId(): Promise<number> {
    // Return cached user if available and recent
    if (this.cachedUser && this.isRecentAuth()) {
      console.log('ðŸ”„ Using cached authenticated user:', this.cachedUser.id);
      return this.cachedUser.id;
    }

    // Prevent concurrent authentication requests
    if (this.isAuthenticating) {
      await this.waitForAuthentication();
      if (this.cachedUser) {
        return this.cachedUser.id;
      }
    }

    try {
      this.isAuthenticating = true;
      console.log('ðŸ” Getting user from HIPAA auth system...');

      // Call a simple API that will trigger HIPAA auth middleware
      // This will set the necessary cookies and create/retrieve the user
      const response = await fetch('/api/users/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-device-fingerprint': this.getDeviceFingerprint(),
          'x-session-id': this.getSessionId()
        }
      });

      if (!response.ok) {
        throw new Error(`HIPAA authentication failed: ${response.status}`);
      }

      const authData = await response.json();
      
      // Extract user ID from /api/users/current response
      const userId = authData.userId || 0;
      
      if (!userId) {
        throw new Error('No user ID returned from HIPAA auth');
      }
      
      this.cachedUser = {
        id: userId,
        sessionId: this.getSessionId(),
        deviceFingerprint: this.getDeviceFingerprint(),
        isAuthenticated: true,
        timestamp: new Date().toISOString()
      };

      console.log('âœ… HIPAA authentication successful - User ID:', this.cachedUser.id);
      return this.cachedUser.id;

    } catch (error) {
      console.error('âŒ HIPAA authentication failed:', error);
      
      // CRITICAL: Authentication failure should not create fake users
      // Return 0 to indicate auth failure - components must handle this
      console.error('ðŸ˜¨ CRITICAL: HIPAA authentication failed - component must retry or show error');
      return 0;
      
    } finally {
      this.isAuthenticating = false;
    }
  }

  /**
   * Get API headers for consistent authentication
   * The HIPAA auth system uses cookies, so we just need basic headers
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      'x-device-fingerprint': this.getDeviceFingerprint(),
      'x-session-id': this.getSessionId()
    };
  }

  /**
   * Check if cached authentication is recent (within 5 minutes)
   */
  private isRecentAuth(): boolean {
    if (!this.cachedUser) return false;
    
    const authTime = new Date(this.cachedUser.timestamp).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (now - authTime) < fiveMinutes;
  }

  /**
   * Wait for ongoing authentication to complete
   */
  private async waitForAuthentication(): Promise<void> {
    const maxWait = 5000; // 5 seconds
    const startTime = Date.now();
    
    while (this.isAuthenticating && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Clear cached user and force re-authentication
   */
  clearCache(): void {
    this.cachedUser = null;
    console.log('ðŸ§¹ User session cache cleared');
  }

  /**
   * Get current user info (cached)
   */
  getCurrentUser(): AuthenticatedUser | null {
    return this.cachedUser;
  }
}

// Export singleton instance
export const unifiedUserSession = UnifiedUserSessionManager.getInstance();

/**
 * REPLACEMENT for getCurrentUserId()
 * Use this instead of the old getCurrentUserId() function
 */
export const getCurrentUserId = async (): Promise<number> => {
  return await unifiedUserSession.getAuthenticatedUserId();
};

/**
 * Get authenticated headers for API calls
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  return await unifiedUserSession.getAuthHeaders();
};

/**
 * Clear user session and force re-authentication
 */
export const clearUserSession = (): void => {
  unifiedUserSession.clearCache();
};

/**
 * SYNCHRONOUS VERSION for components that can't use async
 * Returns cached user ID or 0 if not authenticated
 */
export const getCurrentUserIdSync = (): number => {
  const currentUser = unifiedUserSession.getCurrentUser();
  return currentUser ? currentUser.id : 0;
};

/**
 * NUCLEAR RESET - Deletes user record from database and clears all data
 */
export const nuklearReset = async (): Promise<void> => {
  console.warn('ðŸš¨ NUCLEAR RESET - Deleting USER RECORD and ALL data');
  
  try {
    const deviceFingerprint = localStorage.getItem('deviceFingerprint') || 'unknown';
    
    // Call clear user data endpoint
    try {
      const response = await fetch('/api/users/clear-user-data', { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceFingerprint: deviceFingerprint
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`âœ… Server nuclear reset successful:`, result.message);
        if (result.deletedUserId) {
          console.log(`ðŸ’¥ Deleted user ID ${result.deletedUserId} from database`);
        }
      } else {
        console.warn('âš ï¸ Server nuclear reset failed:', result.error);
      }
    } catch (serverError) {
      console.warn('âš ï¸ Server nuclear reset request failed:', serverError);
    }
    
    // Clear all browser storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear cached user session
    unifiedUserSession.clearCache();
    
    console.log('ðŸ’¥ Nuclear reset completed - user will get NEW ID on next interaction');
    
  } catch (error) {
    console.error('âŒ Nuclear reset failed:', error);
    throw error;
  }
};

/**
 * Validate user session (for backward compatibility)
 */
export const validateUserSession = (): boolean => {
  const currentUser = unifiedUserSession.getCurrentUser();
  return !!currentUser;
};

