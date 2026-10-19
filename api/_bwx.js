/**
 * Sign in with bWalletX (or any BRC-100 wallet) for bdojox.com, via @bwalletx/connect.
 *
 * The wallet signs a one-time challenge with its identity key; /api/auth/verify checks it and sets our own
 * HttpOnly session cookie (bwx_session, HMAC-signed). No vendor SDK, no API key.
 *
 * This site has no database, so the challenge is stateless: the nonce carries its own expiry and an HMAC
 * over (random, expiry, identity key, origin). A nonce only works for the key it was issued to, on this
 * origin, for 2 minutes. Without a store, a captured signature could be replayed inside those 2 minutes;
 * that only signs in the same wallet that signed it. Move to pgStore/redisStore if the site gets a DB.
 *
 * Env (never in git): BWALLETX_SESSION_SECRET (32+ chars). Optional BWALLETX_ORIGIN (default https://bdojox.com).
 */
import { LOGIN_PROTOCOL, loginMessage, verifySignIn, isIdentityKey, originAllowed, signSession, verifySession, serializeCookie, readCookie } from '@bwalletx/connect/server';

export const COOKIE = 'bwx_session';
export const MAX_AGE = 30 * 24 * 3600;
const LIFETIME_MS = 2 * 60 * 1000;
const LOOKUP_URL = process.env.BWALLETX_LOOKUP_URL || 'https://bwallet-nine.vercel.app/api/paymail/lookup';

/** Our origin, from config only (never from the request). */
export function siteOrigin() {
  return (process.env.BWALLETX_ORIGIN || 'https://bdojox.com').replace(/\/$/, '');
}

/** null when the secret is missing: the routes then answer 503 instead of throwing. */
export function secret() {
  const s = process.env.BWALLETX_SESSION_SECRET;
  return typeof s === 'string' && s.length >= 32 ? s : null;
}

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });

const enc = new TextEncoder();
const b64u = (u8) => Buffer.from(u8).toString('base64url');

async function mac(key, text) {
  // A key for nonces only, derived from the session secret, so a nonce MAC can never pass as a session.
  const k = await crypto.subtle.importKey('raw', enc.encode('bdojox nonce v1|' + key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(text)))).slice(0, 22);
}

function sameText(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Step 1: { nonce, message, protocolID, keyID, expiresAt } for the wallet to sign. */
export async function makeChallenge(identityKey, key) {
  const origin = siteOrigin();
  const ik = identityKey.toLowerCase();
  const rand = b64u(crypto.getRandomValues(new Uint8Array(12)));
  const exp = Date.now() + LIFETIME_MS;
  const nonce = `${rand}.${exp.toString(36)}.${await mac(key, `${rand}|${exp}|${ik}|${origin}`)}`;
  return { nonce, message: loginMessage(origin, nonce, exp), protocolID: LOGIN_PROTOCOL, keyID: nonce, expiresAt: exp };
}

/** A NonceStore that rebuilds the challenge from the nonce itself (for verifySignIn), bound to one identity key. */
function statelessStore(identityKey, key) {
  const origin = siteOrigin();
  return {
    put() {},
    async take(nonce) {
      const parts = String(nonce).split('.');
      if (parts.length !== 3 || !isIdentityKey(identityKey)) return null;
      const [rand, exp36, tag] = parts;
      const exp = parseInt(exp36, 36);
      if (!Number.isFinite(exp)) return null;
      const ik = identityKey.toLowerCase();
      if (!sameText(tag, await mac(key, `${rand}|${exp}|${ik}|${origin}`))) return null;
      return { identityKey: ik, origin, message: loginMessage(origin, nonce, exp), expiresAt: exp };
    },
  };
}

/** Step 2: the proven identity key, or null. */
export function checkSignature(body, key) {
  return verifySignIn({ origin: siteOrigin(), store: statelessStore(body?.identityKey, key), identityKey: body?.identityKey, nonce: body?.nonce, signature: body?.signature });
}

export function sameOrigin(req) {
  return originAllowed(req.headers.get('origin'), siteOrigin());
}

/** The wallet's bWalletX name (alice@bwalletx.com), or null. Public endpoint; fails quiet. */
export async function lookupPaymail(identityKey) {
  try {
    const r = await fetch(`${LOOKUP_URL}?key=${encodeURIComponent(identityKey)}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3000) });
    if (!r.ok) return null;
    const p = String((await r.json())?.paymail || '').toLowerCase();
    return /^[a-z0-9._-]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/.test(p) ? p : null;
  } catch {
    return null;
  }
}

export const cookieFor = (value, maxAge) => serializeCookie(value, { name: COOKIE, maxAge, secure: siteOrigin().startsWith('https:') });

export const startSession = (claims, key) => signSession(claims, { secret: key, maxAge: MAX_AGE });

export async function readSession(req, key) {
  return verifySession(readCookie(req.headers.get('cookie'), COOKIE), { secret: key });
}

export { isIdentityKey };
