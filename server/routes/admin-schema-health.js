// server/routes/admin-schema-health.js
import { Router } from 'express'
import { db } from '../db.js'
import { sql } from 'drizzle-orm'
import { tableExistsFast, columnExistsFast, indexExistsFast } from '../services/schemaCaps.js'

export const adminSchemaHealthRouter = Router()

// Protect with a simple header so this isn't public.
// Set ADMIN_HEALTH_SECRET in your env; if unset, route is open (dev only).
adminSchemaHealthRouter.get('/admin/schema-health', async (req, res) => {
  try {
    const required = process.env.ADMIN_HEALTH_SECRET
    if (required && req.get('x-admin-secret') !== required) {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }

    async function tableReport(
      table,
      wantUidIndex // e.g., 'journal_entries_uid_created_idx'
    ) {
      const exists = await tableExistsFast(table)
      if (!exists) return { exists: false }

      const hasUid = await columnExistsFast(table, 'uid')
      const idxOk = wantUidIndex ? await indexExistsFast(wantUidIndex) : undefined

      // Row counts (fast enough for your sizes; switch to reltuples if huge)
      const totalQ = await db.execute(sql`select count(*)::text as c from ${sql.raw(table)};`)
      const total = Number((totalQ).rows?.[0]?.c ?? 0)

      let nullUid = 0
      if (hasUid) {
        const nullQ = await db.execute(
          sql`select count(*)::text as c from ${sql.raw(table)} where uid is null;`
        )
        nullUid = Number((nullQ).rows?.[0]?.c ?? 0)
      }

      return { exists, hasUid, indexOk: idxOk, total, nullUid }
    }

    const journal = await tableReport('journal_entries', 'journal_entries_uid_created_idx')
    const mood    = await tableReport('mood_entries',    'mood_entries_uid_created_idx')
    const conv    = await tableReport('conversations',   'conversations_uid_created_idx')

    // Optional: mapping table presence
    const mappingExists = await tableExistsFast('uid_legacy_map')

    const ok =
      journal.exists &&
      mood.exists &&
      journal.hasUid &&
      mood.hasUid &&
      (journal.indexOk ?? true) &&
      (mood.indexOk ?? true)

    res.json({
      ok,
      now: new Date().toISOString(),
      db: {
        journal_entries: journal,
        mood_entries: mood,
        conversations: conv,
        uid_legacy_map: { exists: mappingExists }
      }
    })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message ?? 'unknown' })
  }
})

export default adminSchemaHealthRouter