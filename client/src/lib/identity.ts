let ADID: string | null = null

export async function ensureInstall(): Promise<string> {
  if (ADID) return ADID
  const r = await fetch('/v1/install/register', { method: 'POST', credentials: 'include' })
  if (!r.ok) throw new Error('install_register_failed')
  const { adid } = await r.json()
  ADID = adid
  console.log('âœ… Device registered with ADID:', adid.slice(0, 8) + '...')
  return adid
}

export async function ensureSession(): Promise<{ uid: string }>{
  await ensureInstall()
  const r = await fetch('/v1/session/start', { method: 'POST', credentials: 'include' })
  if (!r.ok) throw new Error('session_start_failed')
  const { uid } = await r.json()
  console.log('âœ… Session started for UID:', uid)
  return { uid }
}

export async function api(path: string, init: RequestInit = {}) {
  await ensureInstall()
  const headers = new Headers(init.headers)
  headers.set('X-ADID', ADID!)
  return fetch(path, { ...init, headers, credentials: 'include' })
}

export async function endSession() {
  try {
    await fetch('/v1/session/end', { method: 'POST', credentials: 'include' })
    ADID = null
    console.log('âœ… Session ended')
  } catch (error) {
    console.error('âŒ Session end failed:', error)
  }
}

