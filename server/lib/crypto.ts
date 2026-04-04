import { createHmac, randomBytes, createHash } from 'node:crypto'

// MODE can be 'local' (env secrets) or 'kms' (adapter below)
const MODE = process.env.CRYPTO_MODE ?? 'local'

// Local secrets (Base64URL; keep in your secret manager now, KMS later)
const K_DEVICE = Buffer.from(process.env.K_DEVICE_B64URL ?? 'dGVzdC1kZXZpY2Uta2V5LXRoaXMtaXMtbm90LXNlY3VyZQ', 'base64url')
const K_USER_DEVICE = Buffer.from(process.env.K_USER_DEVICE_B64URL ?? 'dGVzdC11c2VyLWRldmljZS1rZXktdGhpcy1pcy1ub3Qtc2VjdXJl', 'base64url')

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
  throw new Error('KMS mode not configured')
}
