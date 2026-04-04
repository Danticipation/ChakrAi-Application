// src/pages/api/alarms.ts
// Example Express.js-style alarm API route (e.g. /api/alarms)

import { db } from '@/lib/db'; // assumes a Prisma or SQL/ORM db layer

export async function GET(req) {
  const userId = req.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const alarms = await db.alarm.findMany({ where: { userId } });
  return Response.json(alarms);
}

export async function POST(req) {
  const userId = req.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { triggerAt, label } = await req.json();
  const alarm = await db.alarm.create({ data: { userId, triggerAt: new Date(triggerAt), label } });
  return Response.json(alarm);
}

export async function DELETE(req) {
  const userId = req.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { id } = await req.json();
  await db.alarm.delete({ where: { id, userId } });
  return Response.json({ success: true });
}
