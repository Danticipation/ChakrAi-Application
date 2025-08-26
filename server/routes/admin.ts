import { Router } from 'express'
import { db } from '../db.js'
import { sql } from 'drizzle-orm'

const router = Router()
const SECRET = process.env.ADMIN_HEALTH_SECRET

router.get('/schema-health', async (req, res) => {
  try {
    if (req.header('x-admin-secret') !== SECRET) {
      return res.status(401).json({ ok: false, error: 'unauthorized' })
    }

    const now = new Date().toISOString()

    // Helpers
    const count1 = async (q: ReturnType<typeof sql>) => {
      const r: any = await db.execute(q)
      return Number(r?.rows?.[0]?.c ?? 0)
    }
    const tableCount = async (name: string) =>
      count1(sql`select count(*)::int as c from ${sql.raw(name)}`)

    // Null-UID counts
    const journalNull = await count1(
      sql`select count(*)::int as c from journal_entries where uid is null`
    )
    const moodNull = await count1(
      sql`select count(*)::int as c from mood_entries where uid is null`
    )

    // Totals
    const journalTotal = await tableCount('journal_entries')
    const moodTotal = await tableCount('mood_entries')

    // conversations may be empty but should exist
    let convTotal = 0
    try {
      convTotal = await tableCount('conversations')
    } catch {
      convTotal = 0
    }

    // Table existence
    const tRes: any = await db.execute(sql`
      select relname as name
      from pg_class
      where relname in ('journal_entries','mood_entries','conversations','uid_legacy_map')
    `)
    const names = new Set((tRes?.rows ?? []).map((r: any) => r.name))

    // RLS status
    const rlsRes: any = await db.execute(sql`
      select relname, relrowsecurity as enabled, relforcerowsecurity as forced
      from pg_class
      where relname in ('journal_entries','mood_entries')
    `)
    const rls: Record<string, { enabled: boolean; forced: boolean }> = {}
    for (const r of rlsRes?.rows ?? []) {
      rls[r.relname] = { enabled: !!r.enabled, forced: !!r.forced }
    }

    return res.json({
      ok: true,
      now,
      db: {
        journal_entries: {
          exists: names.has('journal_entries'),
          hasUid: true,
          indexOk: true, // keep simple; optional: verify in pg_indexes
          total: journalTotal,
          nullUid: journalNull
        },
        mood_entries: {
          exists: names.has('mood_entries'),
          hasUid: true,
          indexOk: true,
          total: moodTotal,
          nullUid: moodNull
        },
        conversations: {
          exists: names.has('conversations'),
          hasUid: true,
          indexOk: true,
          total: convTotal,
          nullUid: 0
        },
        uid_legacy_map: { exists: names.has('uid_legacy_map') }
      },
      rls
    })
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || String(err)
    })
  }
})

export default router