export function validTourProgress(value: any, origin: string, now = Date.now()): boolean {
  return Boolean(value && value.origin === origin && Number.isFinite(value.savedAt)
    && value.savedAt <= now && now - value.savedAt <= 7 * 86400000
    && Array.isArray(value.session?.stops) && value.session.stops.length > 0
    && value.session.stops.every((stop: any) => typeof stop?.id === 'string'
      && typeof stop.name === 'string' && Number.isFinite(stop.latitude) && Math.abs(stop.latitude) <= 90
      && Number.isFinite(stop.longitude) && Math.abs(stop.longitude) <= 180)
    && typeof value.session?.tour?.id === 'string' && typeof value.session.tour.name === 'string'
    && typeof value.session.sessionId === 'string'
    && Number.isInteger(value.stopIndex) && value.stopIndex >= 0 && value.stopIndex < value.session.stops.length);
}
