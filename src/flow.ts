/** The heavy half: finds a BRC-100 wallet (bWalletX first) and signs our challenge. Loaded on click. */
import { discoverWallets, pickWallet, pairingModal, signInWithBwalletX, clearPairing, type Challenge } from '@bwalletx/connect';

export async function signIn(challenge: (identityKey: string) => Promise<Challenge>) {
  const list = await discoverWallets({ probeLocal: true, pairing: () => pairingModal() });
  if (!list.length) throw Object.assign(new Error('No wallet found. Get bWalletX at bwalletx.com/get.'), { code: 'NOT_FOUND' });
  const direct = list.filter((w) => w.kind !== 'pairing');
  const choice = list.length > 1 ? await pickWallet(list, { title: 'Connect to bDojoX' }) : (direct[0] ?? list[0]);
  if (!choice) return null;
  let cw;
  try {
    cw = await choice.connect();
  } catch (e) {
    if ((e as Error)?.message === 'cancelled') return null;
    throw e;
  }
  if (!cw.wallet) throw new Error('That wallet cannot sign in here. Use bWalletX or another BRC-100 wallet.');
  const r = await signInWithBwalletX({ wallet: cw.wallet, challenge });
  return { identityKey: r.identityKey, nonce: r.nonce, signature: r.signature };
}

export function forget() {
  void clearPairing();
}
