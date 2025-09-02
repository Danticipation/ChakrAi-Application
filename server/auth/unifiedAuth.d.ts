// server/auth/unifiedAuth.d.ts

// Define the structure of the user object returned by getAuthenticatedUser
export interface AuthenticatedUser {
  id: string | number;
  uid: string;
  adid: string;
  sid: string;
}

// Define the type for the request object, assuming it's from Express or similar
export interface RequestObject {
  ctx?: {
    uid?: string;
    adid?: string;
    sid?: string;
  };
  userId?: string | number;
  headers: { [key: string]: string | string[] | undefined };
}

// Declare the module's exports
export function getAuthenticatedUser(req: RequestObject): Promise<AuthenticatedUser>;
export function unifiedAuthMiddleware(req: any, res: any, next: any): Promise<void>;
export function optionalAuthMiddleware(req: any, res: any, next: any): Promise<void>;
export function generateAuthToken(user: any): string;
export function clearUserSession(deviceFingerprint: string): void;
export function clearAllSessions(): void;
export function getCurrentUserId(req: RequestObject): Promise<string | number>;

const auth: {
  getAuthenticatedUser: (req: RequestObject) => Promise<AuthenticatedUser>;
  unifiedAuthMiddleware: (req: any, res: any, next: any) => Promise<void>;
  optionalAuthMiddleware: (req: any, res: any, next: any) => Promise<void>;
  generateAuthToken: (user: any) => string;
  clearUserSession: (deviceFingerprint: string) => void;
  getCurrentUserId: (req: RequestObject) => Promise<string | number>;
};

export default auth;
