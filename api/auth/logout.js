/** POST /api/auth/logout → clears the session cookie. */
import { clearOldCookie, cookieFor, json, sameOrigin } from '../_bwx.js';

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: 'Wrong origin.' }, 403);
  const r = json({ ok: true }, 200, { 'set-cookie': cookieFor('', 0) });
  r.headers.append('set-cookie', clearOldCookie());
  return r;
}
