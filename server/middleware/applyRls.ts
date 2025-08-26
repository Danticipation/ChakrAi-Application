import { db } from '../db.js'
import { sql } from 'drizzle-orm'
import type { Request, Response, NextFunction } from 'express'

export async function applyRls(req: Request, _res: Response, next: NextFunction) {
  try {
    const uid = (req as any)?.ctx?.uid
    if (uid) await db.execute(sql`select set_config('app.uid', ${uid}, true);`)
  } catch { /* noop */ }
  next()
}