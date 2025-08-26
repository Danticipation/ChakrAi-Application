// server/services/schemaCaps.ts
import { db } from '../db.js'
import { sql } from 'drizzle-orm'

type BoolRow = { exists: boolean }

const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map<string, { v: boolean; t: number }>()

function getCached(k: string): boolean | undefined {
  const hit = cache.get(k)
  if (!hit) return
  if (Date.now() - hit.t > CACHE_TTL_MS) { cache.delete(k); return }
  return hit.v
}
function setCached(k: string, v: boolean) { cache.set(k, { v, t: Date.now() }) }

export async function tableExistsFast(table: string): Promise<boolean> {
  const key = `te:${table}`
  const c = getCached(key); if (c !== undefined) return c
  const q = sql<BoolRow>`select to_regclass(${`public.${table}`}) is not null as exists;`
  const r = await db.execute(q)
  const v = Boolean((r as any).rows?.[0]?.exists)
  setCached(key, v)
  return v
}

export async function columnExistsFast(table: string, column: string): Promise<boolean> {
  const key = `ce:${table}.${column}`
  const c = getCached(key); if (c !== undefined) return c
  const q = sql<BoolRow>`
    select exists (
      select 1
      from pg_attribute
      where attrelid = to_regclass(${`public.${table}`})
        and attname  = ${column}
        and not attisdropped
    ) as exists;
  `
  const r = await db.execute(q)
  const v = Boolean((r as any).rows?.[0]?.exists)
  setCached(key, v)
  return v
}

export async function indexExistsFast(indexName: string): Promise<boolean> {
  const key = `ix:${indexName}`
  const c = getCached(key); if (c !== undefined) return c
  const q = sql<BoolRow>`
    select exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where c.relkind = 'i' and n.nspname = 'public' and c.relname = ${indexName}
    ) as exists;
  `
  const r = await db.execute(q)
  const v = Boolean((r as any).rows?.[0]?.exists)
  setCached(key, v)
  return v
}