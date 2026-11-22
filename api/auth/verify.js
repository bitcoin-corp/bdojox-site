/** POST /api/auth/verify { identityKey, nonce, signature } → sets the bwx_session cookie. */
import { checkSignature, clearOldCookie, clearTicket, cookieFor, json, lookupPaymail, MAX_AGE, sameOrigin, secret, startSession, ticketOk } from '../_bwx.js';

export async function POST(req) {
  const key = secret();
  if (!key) return json({ error: 'Sign-in is not switched on yet.' }, 503);
  if (!sameOrigin(req)) return json({ error: 'Wrong origin.' }, 403);
  const body = await req.json().catch(() => null);
  // The challenge's ticket cookie: required, and cleared on every attempt (one use).
  const cleared = clearTicket(body?.nonce);
  const res = (b, status, cookies = []) => {
    const r = json(b, status);
    for (const c of [cleared, ...cookies]) if (c) r.headers.append('set-cookie', c);
    return r;
  };
  if (!(await ticketOk(req, body?.nonce, key))) return res({ error: 'That sign-in expired or was already used. Start again.' }, 401);
  const identityKey = await checkSignature(body, key);
  if (!identityKey) return res({ error: 'That signature was not accepted. Start again.' }, 401);
  const paymail = await lookupPaymail(identityKey);
  const token = await startSession({ sub: identityKey, ...(paymail ? { paymail, handle: paymail } : {}) }, key);
  return res({ identityKey, paymail }, 200, [cookieFor(token, MAX_AGE), clearOldCookie()]);
}
