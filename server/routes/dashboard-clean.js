// server/routes/dashboard-clean.js
import { Router } from 'express'
import { getDashboard } from '../services/dashboard.ts'

export const dashboardRouter = Router()

dashboardRouter.get('/dashboard', async (req, res) => {
  try {
    const { uid } = req.ctx
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' })

    const tf = (String(req.query.timeframe || 'month'))
    const data = await getDashboard(uid, tf)
    return res.json(data)
  } catch (err) {
    console.error('dashboard error', err?.message || err)
    return res.status(500).json({ error: 'dashboard_failed' })
  }
})

export default dashboardRouter