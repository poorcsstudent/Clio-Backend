import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { readCacheEntry } from './cacheEntry';

const listeners = new Set<(message: string) => void>();
let notice = '';
export function subscribeCacheNotice(listener: (message: string) => void) {
  listeners.add(listener);
  listener(notice);
  return () => { listeners.delete(listener); };
}

// Only public tour data is allowed here. Never use this store for auth or photos.
export async function cachedPublicData<T>(key: string, load: () => Promise<T>): Promise<T> {
  const storageKey = `clio.public.v1.${await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key)}`;
  const uri = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${storageKey}.json` : null;
  try {
    const data = await load();
    const entry = JSON.stringify({ version: 1, key, savedAt: Date.now(), data });
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey, entry);
      } else if (uri) await FileSystem.writeAsStringAsync(uri, entry);
    } catch { /* Storage availability must not break a live response. */ }
    return data;
  } catch (error) {
    try {
      const raw = Platform.OS === 'web'
        ? (typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null)
        : uri ? await FileSystem.readAsStringAsync(uri) : null;
      const entry = readCacheEntry<T>(raw, key);
      if (!entry) throw error;
      notice = `Some tour information is cached (saved ${new Date(entry.savedAt).toLocaleDateString()}). It may be outdated. Starting a tour and AI questions still require internet.`;
      listeners.forEach(listener => listener(notice));
      return entry.data as T;
    } catch { throw error; }
  }
}
