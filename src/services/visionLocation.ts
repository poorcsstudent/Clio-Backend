export interface VisionPosition {
  timestamp: number;
  coords: { latitude: number; longitude: number; accuracy: number | null };
}

/** Location only narrows candidates; it must never establish visual identity. */
export function reliableVisionCoordinates(position: VisionPosition | null, now = Date.now()) {
  if (!position) return undefined;
  const { latitude, longitude, accuracy } = position.coords;
  if (!Number.isFinite(position.timestamp) || position.timestamp > now || now - position.timestamp > 15000
    || accuracy === null || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 50
    || !Number.isFinite(latitude) || Math.abs(latitude) > 90
    || !Number.isFinite(longitude) || Math.abs(longitude) > 180) return undefined;
  return { latitude, longitude };
}

/** Optional GPS must not hold a photo request indefinitely. Late results are ignored. */
export async function optionalPositionWithin<T>(request: Promise<T>, timeoutMs = 4000): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request.catch(() => null),
      new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), timeoutMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
