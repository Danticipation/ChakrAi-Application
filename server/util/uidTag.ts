// server/util/uidTag.ts
import crypto from 'crypto';

const LOG_KEY = process.env.LOG_KEY || 'dev-log-key-change-me';

export function makeUidTag(uid: string, bytes = 10): string {
  // HMAC-SHA256(uid) -> first N bytes (default 10 = 80 bits) as hex
  // 80 bits makes collisions astronomically unlikely.
  const full = crypto.createHmac('sha256', LOG_KEY).update(uid).digest();
  return full.subarray(0, bytes).toString('hex'); // 20 hex chars
}
