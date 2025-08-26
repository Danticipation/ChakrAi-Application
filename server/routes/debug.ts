import { Router } from 'express'

const router = Router()

// Production smoke test endpoint
router.get('/whoami', async (req, res) => {
  try {
    const uid = (req as any)?.ctx?.uid
    const cookies = (req as any)?.cookies || {}
    
    // Only return UID (no PHI) for debugging
    res.json({
      uid: uid || 'no_uid_found',
      hasCookie: !!cookies.u,
      cookiePresent: Object.keys(cookies).includes('u'),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      secureContext: req.secure || req.get('x-forwarded-proto') === 'https'
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'whoami_failed',
      uid: 'error_occurred'
    })
  }
})

export default router