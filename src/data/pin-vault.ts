import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Hidden unlock PIN. Stored only in the Android Keystore-backed SecureStore.
 * No screen should call `reveal()` until all required tasks are done; that gating
 * belongs to the caller (see features/unlock, added later).
 */
const KEY = 'offscreen.unlock_pin';
const PIN_LENGTH = 8;

function randomPin(): string {
  // Rejection sampling avoids modulo bias.
  let out = '';
  while (out.length < PIN_LENGTH) {
    for (const b of Crypto.getRandomBytes(PIN_LENGTH)) {
      if (b < 250 && out.length < PIN_LENGTH) out += String(b % 10);
    }
  }
  return out;
}

export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY)) !== null;
}

/** Creates a new random PIN, replacing any existing one. The PIN is not returned. */
export async function generatePin(): Promise<void> {
  await SecureStore.setItemAsync(KEY, randomPin());
}

/** Returns the PIN. Callers must enforce the task-completion gate first. */
export async function revealPin(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function verifyPin(candidate: string): Promise<boolean> {
  const pin = await SecureStore.getItemAsync(KEY);
  return pin !== null && pin === candidate;
}

export async function clearPin(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
