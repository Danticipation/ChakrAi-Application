import type { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

export async function applyRls(req: Request, _res: Response, next: NextFunction) {
  const uid = (req as any).ctx?.uid;
  if (!uid) return next(new Error('UID missing before RLS'));
  // Set Postgres GUC for RLS policies
  try {
    await db.execute(sql`select set_config('app.uid', ${uid}, true)`);
  } catch (error) {
    console.error('RLS setup error:', error);
  }
  next();
}