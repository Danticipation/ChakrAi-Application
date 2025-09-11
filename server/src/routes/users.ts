import { Router } from 'express';
// import { storage } from '../storage'; // if you want to persist users later

const r = Router();

/**
 * Return the current user.
 * If x-user-id is missing, create a temporary anonymous id so the UI doesn’t blow up.
 */
r.get('/current', (req, res) => {
  const headerId = Number(req.header('x-user-id'));
  const userId = Number.isFinite(headerId) && headerId > 0 ? headerId : Math.floor(Math.random() * 1e9);
  const anonymous = !(Number.isFinite(headerId) && headerId > 0);

  // You can persist this later via storage if you want a stable anon id.
  return res.json({ userId, anonymous, ok: true });
});

/**
 * Create/return an anonymous user id explicitly.
 */
r.post('/anonymous', (_req, res) => {
  const userId = Math.floor(Math.random() * 1e9);
  return res.json({ userId, anonymous: true, ok: true });
});

export default r;
