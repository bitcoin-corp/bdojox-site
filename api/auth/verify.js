/** POST /api/auth/verify { identityKey, nonce, signature } → sets the bwx_session cookie. */
import { checkSignature, cookieFor, json, lookupPaymail, MAX_AGE, sameOrigin, secret, startSession } from '../_bwx.js';

export async function POST(req) {
  const key = secret();
  if (!key) return json({ error: 'Sign-in is not switched on yet.' }, 503);
  if (!sameOrigin(req)) return json({ error: 'Wrong origin.' }, 403);
  const body = await req.json().catch(() => null);
  const identityKey = await checkSignature(body, key);
  if (!identityKey) return json({ error: 'That signature was not accepted. Start again.' }, 401);
  const paymail = await lookupPaymail(identityKey);
  const token = await startSession({ sub: identityKey, ...(paymail ? { paymail, handle: paymail } : {}) }, key);
  return json({ identityKey, paymail }, 200, { 'set-cookie': cookieFor(token, MAX_AGE) });
}
