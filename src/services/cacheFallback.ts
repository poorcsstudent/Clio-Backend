import { readCacheEntry } from './cacheEntry';

export async function cacheFallback<T>(key: string, load: () => Promise<T>, storage: {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
}, onCached: (savedAt: number) => void) {
  try {
    const data = await load();
    try { await storage.write(JSON.stringify({ version: 1, key, savedAt: Date.now(), data })); }
    catch { /* A successful live request does not depend on disk access. */ }
    return data;
  } catch (networkError) {
    let entry;
    try { entry = readCacheEntry<T>(await storage.read(), key); }
    catch { throw networkError; }
    if (!entry) throw networkError;
    onCached(entry.savedAt);
    return entry.data;
  }
}
