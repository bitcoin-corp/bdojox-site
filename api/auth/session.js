/** GET /api/auth/session → { identityKey, paymail } for the signed-in wallet, or 401. */
import { clearOldCookie, cookieFor, json, readSession, secret } from '../_bwx.js';

export async function GET(req) {
  const key = secret();
  if (!key) return json({ error: 'Sign-in is not switched on yet.' }, 503);
  const s = await readSession(req, key);
  if (!s) return json({ error: 'Not signed in.' }, 401);
  const r = json({ identityKey: s.sub, paymail: s.paymail ?? null });
  if (s.legacy) {
    // Signed in under the old cookie name: move the same token to the __Host- cookie for the time it has left.
    r.headers.append('set-cookie', cookieFor(s.legacy, Math.max(0, s.exp - Math.floor(Date.now() / 1000))));
    r.headers.append('set-cookie', clearOldCookie());
  }
  return r;
}
