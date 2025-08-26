// server/services/dashboard.ts
import { db } from '../db.js'
import { sql } from 'drizzle-orm'

type Timeframe = 'week' | 'month' | 'quarter'
const TZ = 'America/Phoenix'

function windowFor(timeframe: Timeframe) {
  const days = timeframe === 'week' ? 7 : timeframe === 'quarter' ? 90 : 30
  const now = new Date()
  const since = new Date(now)
  since.setDate(now.getDate() - days)
  const prevSince = new Date(since)
  prevSince.setDate(prevSince.getDate() - days)
  const prevUntil = since
  return { days, since, now, prevSince, prevUntil }
}

function fmtDateKey(date: Date, tz = TZ) {
  // "YYYY-MM-DD" in target TZ
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date)
}

function minusDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() - n)
  return d
}

function computeStreak(activeDayKeys: Set<string>, tz = TZ): number {
  let streak = 0
  let cursor = new Date()
  while (true) {
    const key = fmtDateKey(cursor, tz)
    if (!activeDayKeys.has(key)) break
    streak++
    cursor = minusDays(cursor, 1)
  }
  return streak
}

async function countByUid(table: string, uid: string, since: Date, until?: Date): Promise<number> {
  // created_at BETWEEN since AND until (or now)
  const untilParam = until ?? new Date()
  
  // Convert dates to Mountain Time strings for proper comparison
  const sinceStr = since.toISOString()
  const untilStr = untilParam.toISOString()
  
  const q = sql<{ count: string }>`
    select count(*)::text as count
    from ${sql.raw(table)}
    where uid = ${uid}
      and created_at >= ${sinceStr}::timestamptz
      and created_at < ${untilStr}::timestamptz;
  `
  try {
    const rows = await db.execute(q)
    const count = Number((rows as any).rows?.[0]?.count ?? 0)
    console.log(`📊 ${table} count for UID ${uid.slice(-8)}: ${count} (${sinceStr} to ${untilStr})`)
    return count
  } catch (error) {
    console.error(`Error counting ${table} for UID ${uid}:`, error)
    return 0
  }
}

async function sumMindfulMinutes(uid: string, since: Date, until?: Date): Promise<number> {
  // Optional table. If absent, return 0 quietly.
  try {
    const untilParam = until ?? new Date()
    const sinceStr = since.toISOString()
    const untilStr = untilParam.toISOString()
    
    const q = sql<{ minutes: string }>`
      select coalesce(sum(duration_minutes),0)::text as minutes
      from mindful_sessions
      where uid = ${uid}
        and started_at >= ${sinceStr}::timestamptz
        and started_at < ${untilStr}::timestamptz;
    `
    const rows = await db.execute(q)
    return Number((rows as any).rows?.[0]?.minutes ?? 0)
  } catch {
    // table doesn't exist yet: fine.
    return 0
  }
}

async function distinctActiveDays(uid: string, daysBack = 120): Promise<Set<string>> {
  // Pull distinct day keys from each activity source; union in TS for robustness.
  const queries = [
    sql<{ day: string }>`
      select distinct (created_at at time zone ${TZ})::date::text as day
      from journal_entries
      where uid = ${uid} and created_at >= now() - interval '${daysBack} days'
      `,
    sql<{ day: string }>`
      select distinct (created_at at time zone ${TZ})::date::text as day
      from mood_entries
      where uid = ${uid} and created_at >= now() - interval '${daysBack} days'
      `,
    sql<{ day: string }>`
      select distinct (created_at at time zone ${TZ})::date::text as day
      from conversations
      where uid = ${uid} and created_at >= now() - interval '${daysBack} days'
      `,
  ]

  // mindful_sessions is optional
  const qMindful = sql<{ day: string }>`
    select distinct (started_at at time zone ${TZ})::date::text as day
    from mindful_sessions
    where uid = ${uid} and started_at >= now() - interval '${daysBack} days'
  `
  const results = await Promise.allSettled([ ...queries.map(q => db.execute(q)), db.execute(qMindful) ])

  const active = new Set<string>()
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const rows = (r.value as any).rows as Array<{ day: string }>
      for (const row of rows ?? []) active.add(row.day)
    }
  }
  return active
}

function deltaTag(curr: number, prev: number): string | null {
  const diff = curr - prev
  if (diff === 0) return null
  return (diff > 0 ? '+' : '') + diff
}

export async function getDashboard(uid: string, timeframe: Timeframe = 'month') {
  console.log(`📈 Dashboard request for UID: ${uid.slice(-8)} (timeframe: ${timeframe})`);
  const { since, prevSince, prevUntil } = windowFor(timeframe)
  
  console.log(`🕰️ Time window: ${since.toISOString()} to ${new Date().toISOString()}`);

  // Counts (current window)
  const [journalNow, convosNow, moodNow, minutesNow] = await Promise.all([
    countByUid('journal_entries', uid, since),
    countByUid('conversations', uid, since),
    countByUid('mood_entries', uid, since),
    sumMindfulMinutes(uid, since),
  ])

  // Counts (previous window)
  const [journalPrev, convosPrev, moodPrev, minutesPrev] = await Promise.all([
    countByUid('journal_entries', uid, prevSince, prevUntil),
    countByUid('conversations', uid, prevSince, prevUntil),
    countByUid('mood_entries', uid, prevSince, prevUntil),
    sumMindfulMinutes(uid, prevSince, prevUntil),
  ])

  // Streak (last ~120 days across all activity)
  const activeDays = await distinctActiveDays(uid, 120)
  const currentStreak = computeStreak(activeDays, TZ)
  
  const result = {
    timeframe,
    currentStreak,
    streakChange: null as string | null, // streak deltas are tricky; keep null or compute separately if you store historical snapshot
    journalEntries: journalNow,
    journalChange: deltaTag(journalNow, journalPrev),
    moodEntries: moodNow,
    moodChange: deltaTag(moodNow, moodPrev),
    aiConversations: convosNow,
    conversationsChange: deltaTag(convosNow, convosPrev),
    mindfulMinutes: minutesNow,
    mindfulChange: deltaTag(minutesNow, minutesPrev),
    lastUpdated: new Date().toISOString(),
  }
  
  console.log(`📈 Dashboard result:`, result);
  return result;
}