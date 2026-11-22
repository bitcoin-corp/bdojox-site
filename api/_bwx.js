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

// __Host-: Secure, Path=/, no Domain, so no subdomain or plain-http page can set or shadow it.
export const COOKIE = '__Host-bwx_session';
/** The name before 22 Nov 2026: read once by /api/auth/session, then moved to COOKIE. */
export const OLD_COOKIE = 'bwx_session';
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
  // www.bdojox.com serves the same site; accept it too (the signed message still names the apex)
  const o = req.headers.get('origin');
  if (originAllowed(o, siteOrigin())) return true;
  try { return new URL(String(o)).host === 'www.' + new URL(siteOrigin()).host; } catch { return false; }
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
export const clearOldCookie = () => serializeCookie('', { name: OLD_COOKIE, maxAge: 0, secure: siteOrigin().startsWith('https:') });

/*
 * The challenge's one-time ticket cookie (__Host-bwx_t_<nonce>, HttpOnly, 10 min). The challenge is stateless, so
 * without it the same verify body could be replayed for its 2 minutes to mint more sessions. /verify needs the
 * cookie (a MAC of the nonce, so it can't be made from the body) and clears it on every attempt.
 */
const NONCE_RE = /^[A-Za-z0-9_-]{8,40}\.[a-z0-9]{1,12}\.[A-Za-z0-9_-]{22}$/;
const ticketName = (nonce) => (typeof nonce === 'string' && NONCE_RE.test(nonce) ? `__Host-bwx_t_${nonce}` : null);
export async function ticketCookie(nonce, key) {
  return serializeCookie(await mac(key, `ticket|${nonce}`), { name: ticketName(nonce), maxAge: 600, secure: siteOrigin().startsWith('https:') });
}
export async function ticketOk(req, nonce, key) {
  const name = ticketName(nonce);
  const got = name && readCookie(req.headers.get('cookie'), name);
  return !!got && sameText(got, await mac(key, `ticket|${nonce}`));
}
export const clearTicket = (nonce) => (ticketName(nonce) ? serializeCookie('', { name: ticketName(nonce), maxAge: 0, secure: siteOrigin().startsWith('https:') }) : null);

export const startSession = (claims, key) => signSession(claims, { secret: key, maxAge: MAX_AGE });

/** The session from COOKIE, else from the old cookie name (`legacy` then holds its token, to move it). */
export async function readSession(req, key) {
  const cookies = req.headers.get('cookie');
  const s = await verifySession(readCookie(cookies, COOKIE), { secret: key });
  if (s) return s;
  const token = readCookie(cookies, OLD_COOKIE);
  const old = await verifySession(token, { secret: key });
  return old ? Object.assign(old, { legacy: token }) : null;
}

export { isIdentityKey };
