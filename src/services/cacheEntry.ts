export function readCacheEntry<T>(raw: string | null, key: string, now = Date.now()): { data: T; savedAt: number } | null {
  try {
    const entry = raw ? JSON.parse(raw) : null;
    if (!entry || entry.version !== 1 || entry.key !== key || !Number.isFinite(entry.savedAt)
      || entry.savedAt > now || now - entry.savedAt > 30 * 86400000 || !entry.data) return null;
    return { data: entry.data as T, savedAt: entry.savedAt };
  } catch { return null; }
}
