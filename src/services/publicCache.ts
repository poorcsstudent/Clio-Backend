import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { cacheFallback } from './cacheFallback';

const listeners = new Set<(message: string) => void>();
let notice = '';
export function subscribeCacheNotice(listener: (message: string) => void) {
  listeners.add(listener);
  listener(notice);
  return () => { listeners.delete(listener); };
}

// Only public tour data is allowed here. Never use this store for auth or photos.
export async function cachedPublicData<T>(key: string, load: () => Promise<T>): Promise<T> {
  let storageKey: string;
  try {
    storageKey = `clio.public.v1.${await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key)}`;
  } catch {
    // Web crypto may be unavailable in an insecure LAN preview. Keep live data usable.
    return load();
  }
  const uri = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${storageKey}.json` : null;
  return cacheFallback(key, load, {
    write: async entry => {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey, entry);
      } else if (uri) await FileSystem.writeAsStringAsync(uri, entry);
    },
    read: async () => Platform.OS === 'web'
        ? (typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null)
        : uri ? await FileSystem.readAsStringAsync(uri) : null,
  }, savedAt => {
      notice = `Some tour information is cached (saved ${new Date(savedAt).toLocaleDateString()}). It may be outdated. Starting a tour and AI questions still require internet.`;
      listeners.forEach(listener => listener(notice));
  });
}
