/** POST /api/auth/challenge { identityKey } → a one-time message for the wallet to sign (2 min). */
import { makeChallenge, isIdentityKey, json, sameOrigin, secret } from '../_bwx.js';

// Unauthenticated route: a light per-instance limit (20 a minute per IP).
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  return ++h.n > 20;
}

export async function POST(req) {
  const key = secret();
  if (!key) return json({ error: 'Sign-in is not switched on yet.' }, 503);
  if (!sameOrigin(req)) return json({ error: 'Wrong origin.' }, 403);
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return json({ error: 'Too many tries. Wait a minute.' }, 429);
  const body = await req.json().catch(() => null);
  if (!isIdentityKey(body?.identityKey)) return json({ error: 'That is not a wallet identity key.' }, 400);
  return json(await makeChallenge(body.identityKey, key));
}
