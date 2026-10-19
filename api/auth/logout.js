/** POST /api/auth/logout → clears the session cookie. */
import { cookieFor, json, sameOrigin } from '../_bwx.js';

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: 'Wrong origin.' }, 403);
  return json({ ok: true }, 200, { 'set-cookie': cookieFor('', 0) });
}
