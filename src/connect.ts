/**
 * bdojox.com: "Connect bWalletX" in the nav. Light part only (session check, nav, account menu, panel);
 * the wallet code (@bwalletx/connect + @bsv/sdk) loads from ./flow on the first click.
 * Server: api/auth/{challenge,verify,session,logout}.js. Build: pnpm bundle → js/connect.js.
 */
import { bavatarSvg } from './bavatar';

type Me = { identityKey: string; paymail: string | null };

const WEB = 'https://web.bwalletx.com';
const BSHARES = `${WEB}/m/bshares`;
const GET = 'https://bwalletx.com/get';

const $ = <T extends Element>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: (Node | string)[]) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...kids);
  return e;
}

const MARK =
  '<svg viewBox="23 8 74 100" aria-hidden="true" focusable="false"><defs><linearGradient id="bwxc-g" gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="105"><stop offset="0" stop-color="#FFE58A"/><stop offset=".55" stop-color="#FFD24D"/><stop offset="1" stop-color="#C98F00"/></linearGradient><mask id="bwxc-m"><rect width="140" height="140" fill="#fff"/><circle cx="60" cy="72" r="15" fill="#000"/></mask></defs><g fill="url(#bwxc-g)" mask="url(#bwxc-m)"><polygon points="45,12 45,76 27,76 27,30"/><circle cx="60" cy="72" r="33"/></g></svg>';

/** $alice for alice@bwalletx.com; other paymails in full; no name → a short key. */
export function handleOf(me: Me): string {
  const p = me.paymail;
  if (p && /@bwalletx\.com$/.test(p)) return '$' + p.split('@')[0];
  if (p) return p;
  return me.identityKey.slice(0, 6) + '…' + me.identityKey.slice(-4);
}

const avatarUri = (k: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bavatarSvg(k, { size: 64 }));

let me: Me | null = null;
let busy = false;

// ── status line (screen readers + visible toast) ────────────────────────────────────────────────
const live = h('div', { class: 'bwxc-toast', role: 'status', 'aria-live': 'polite' });
let toastT = 0;
function say(text: string, error = false) {
  live.textContent = text;
  live.classList.toggle('err', error);
  live.classList.toggle('show', !!text);
  clearTimeout(toastT);
  if (text) toastT = window.setTimeout(() => live.classList.remove('show'), error ? 7000 : 3500);
}

// ── nav pieces ─────────────────────────────────────────────────────────────────────────────────
const connectBtn = h('button', { type: 'button', class: 'nav-connect', 'aria-label': 'Connect with bWalletX' });
connectBtn.innerHTML = `${MARK}<span>Connect</span>`;

const acctBtn = h('button', { type: 'button', class: 'nav-acct', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'bwxc-menu', hidden: '' });
const acctImg = h('img', { alt: '', width: '30', height: '30' });
const acctName = h('span', { class: 'nm' });
acctBtn.append(acctImg, acctName, h('span', { class: 'car', 'aria-hidden': 'true' }));

const dd = h('div', { class: 'bwxc-dd', id: 'bwxc-menu', hidden: '' });
const ddHead = h('div', { class: 'hd' });
const ddList = h('ul', { role: 'list' });
dd.append(ddHead, ddList);

function items(): HTMLElement[] {
  const companies = h('button', { type: 'button', 'data-act': 'companies' }, h('span', { class: 'k', 'aria-hidden': 'true' }, '株'), h('span', {}, 'Your companies'));
  const start = h('a', { href: BSHARES, target: '_blank', rel: 'noopener', 'data-act': 'start' }, h('span', { class: 'k', 'aria-hidden': 'true' }, '始'), h('span', {}, 'Start a company'), h('span', { class: 'ext', 'aria-hidden': 'true' }, '↗'));
  const out = h('button', { type: 'button', 'data-act': 'signout' }, h('span', { class: 'k', 'aria-hidden': 'true' }, '出'), h('span', {}, 'Sign out'));
  return [companies, start, out];
}

// Phone menu (inside #menu .menu-foot)
const mWrap = h('div', { class: 'bwxc-m' });

// ── "Your companies" panel ─────────────────────────────────────────────────────────────────────
const panel = h('dialog', { class: 'bwxc-panel', 'aria-labelledby': 'bwxc-pt' });
panel.innerHTML = `
  <form method="dialog" class="top"><span class="tag">Account</span><button class="x" aria-label="Close" value="close"></button></form>
  <div class="who"><img alt="" width="56" height="56"><div><b class="nm"></b><span class="pm"></span></div></div>
  <h2 id="bwxc-pt">Your companies</h2>
  <p class="bwxc-lede">Share registers are in testing. Your companies and holdings show up in bShares, inside your own bWalletX, once their register opens.</p>
  <ul class="facts" role="list">
    <li><span class="chip"></span>Registers live in bShares, in your bWalletX</li>
    <li><span class="chip b"></span>Your shares stay in your own wallet, locked 2-of-2</li>
    <li><span class="chip w"></span>Nothing here is offered or sold</li>
  </ul>
  <div class="acts">
    <a class="btn btn-red" href="${BSHARES}" target="_blank" rel="noopener">Open bShares in bWalletX <span aria-hidden="true">↗</span></a>
    <a class="btn ghost" href="${BSHARES}" target="_blank" rel="noopener">Start a company <span aria-hidden="true">↗</span></a>
  </div>
  <p class="fine">bShares opens in the bWalletX web wallet. Use the same wallet you connected here.</p>`;

function openPanel(from?: HTMLElement) {
  closeMenu(false);
  if (!me) return;
  $<HTMLImageElement>('.who img', panel)!.src = avatarUri(me.identityKey);
  $('.who .nm', panel)!.textContent = handleOf(me);
  $('.who .pm', panel)!.textContent = me.paymail ?? 'Connected with bWalletX';
  panel.showModal();
  panel.addEventListener('close', () => (from ?? acctBtn).focus(), { once: true });
}
panel.addEventListener('click', (e) => {
  if (e.target === panel) panel.close(); // backdrop
});

// ── account dropdown ───────────────────────────────────────────────────────────────────────────
function openMenu() {
  dd.hidden = false;
  acctBtn.setAttribute('aria-expanded', 'true');
  ddList.querySelector<HTMLElement>('a,button')?.focus();
}
function closeMenu(back = true) {
  if (dd.hidden) return;
  dd.hidden = true;
  acctBtn.setAttribute('aria-expanded', 'false');
  if (back) acctBtn.focus();
}
acctBtn.addEventListener('click', () => (dd.hidden ? openMenu() : closeMenu()));
document.addEventListener('click', (e) => {
  if (!dd.hidden && !dd.contains(e.target as Node) && !acctBtn.contains(e.target as Node)) closeMenu(false);
});
dd.addEventListener('keydown', (e) => {
  const f = [...ddList.querySelectorAll<HTMLElement>('a,button')];
  const i = f.indexOf(document.activeElement as HTMLElement);
  if (e.key === 'Escape') closeMenu();
  else if (e.key === 'ArrowDown') (e.preventDefault(), f[(i + 1) % f.length].focus());
  else if (e.key === 'ArrowUp') (e.preventDefault(), f[(i - 1 + f.length) % f.length].focus());
  else if (e.key === 'Tab' && ((e.shiftKey && i === 0) || (!e.shiftKey && i === f.length - 1))) closeMenu(false);
});

async function act(e: Event) {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!t) return;
  const a = t.dataset.act;
  if (a === 'companies') openPanel();
  else if (a === 'signout') await signOut();
  else if (a === 'connect') await connect();
  else if (a === 'start') closeMenu(false);
}
dd.addEventListener('click', act);
mWrap.addEventListener('click', act);

// ── render ─────────────────────────────────────────────────────────────────────────────────────
function render() {
  connectBtn.hidden = !!me;
  acctBtn.hidden = !me;
  connectBtn.disabled = busy;
  connectBtn.classList.toggle('busy', busy);
  $('span', connectBtn)!.textContent = busy ? 'Connecting…' : 'Connect';
  mWrap.replaceChildren();
  if (me) {
    const name = handleOf(me);
    acctImg.src = avatarUri(me.identityKey);
    acctName.textContent = name;
    acctBtn.setAttribute('aria-label', `Account: ${name}`);
    ddHead.replaceChildren(h('img', { src: avatarUri(me.identityKey), alt: '', width: '40', height: '40' }), h('div', {}, h('b', {}, name), h('span', {}, me.paymail ?? 'Connected with bWalletX')));
    ddList.replaceChildren(...items().map((x) => h('li', {}, x)));
    const head = h('div', { class: 'who' }, h('img', { src: avatarUri(me.identityKey), alt: '', width: '40', height: '40' }), h('div', {}, h('b', {}, name), h('span', {}, 'Connected with bWalletX')));
    const list = h('ul', { role: 'list' }, ...items().map((x) => h('li', {}, x)));
    mWrap.append(head, list);
  } else {
    closeMenu(false);
    const b = h('button', { type: 'button', class: 'btn bwxc-mconnect', 'data-act': 'connect' });
    b.innerHTML = `${MARK.replace(/bwxc-(g|m)/g, 'bwxm-$1')}<span>${busy ? 'Connecting…' : 'Connect bWalletX'}</span>`;
    if (busy) b.setAttribute('disabled', '');
    mWrap.append(b);
  }
}

// ── server calls ───────────────────────────────────────────────────────────────────────────────
async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || (r.status === 404 ? 'Sign-in is not switched on yet.' : `Sign-in failed (${r.status}).`));
  return j;
}

async function connect() {
  if (busy || me) return;
  busy = true;
  render();
  try {
    const flow = await import('./flow');
    const res = await flow.signIn((identityKey) => post('/api/auth/challenge', { identityKey }));
    if (!res) return; // closed the picker
    const v = await post('/api/auth/verify', res);
    me = { identityKey: v.identityKey, paymail: v.paymail ?? null };
    say(`Connected as ${handleOf(me)}.`);
  } catch (e) {
    say((e as Error)?.message || 'Could not connect.', true);
  } finally {
    busy = false;
    render();
    if (me && !document.getElementById('menu')?.classList.contains('open')) acctBtn.focus();
  }
}
connectBtn.addEventListener('click', connect);

async function signOut() {
  closeMenu(false);
  await post('/api/auth/logout', {}).catch(() => {});
  try {
    (await import('./flow')).forget();
  } catch {
    /* nothing paired */
  }
  me = null;
  render();
  say('Signed out.');
  connectBtn.offsetParent ? connectBtn.focus() : document.getElementById('burger')?.focus();
}

async function restore() {
  try {
    const r = await fetch('/api/auth/session', { credentials: 'same-origin' });
    if (r.ok) {
      const j = await r.json();
      me = { identityKey: j.identityKey, paymail: j.paymail ?? null };
    }
  } catch {
    /* offline or no API: stay signed out */
  }
  render();
}

// ── mount ──────────────────────────────────────────────────────────────────────────────────────
function mount() {
  const cta = $('.site-nav .nav-cta');
  if (!cta) return;
  const slot = h('div', { class: 'bwxc' });
  slot.append(connectBtn, acctBtn, dd);
  cta.before(slot);
  $('#menu .menu-foot')?.prepend(mWrap);
  document.body.append(panel, live);
  render();
  void restore();
}
mount();
