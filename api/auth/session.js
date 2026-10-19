/** GET /api/auth/session → { identityKey, paymail } for the signed-in wallet, or 401. */
import { json, readSession, secret } from '../_bwx.js';

export async function GET(req) {
  const key = secret();
  if (!key) return json({ error: 'Sign-in is not switched on yet.' }, 503);
  const s = await readSession(req, key);
  if (!s) return json({ error: 'Not signed in.' }, 401);
  return json({ identityKey: s.sub, paymail: s.paymail ?? null });
}
