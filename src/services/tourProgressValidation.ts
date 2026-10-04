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

export function validSavedRoute(value: any, tourId: string): boolean {
  const coordinate = (point: any) => point && Number.isFinite(point.latitude)
    && Math.abs(point.latitude) <= 90 && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
  const path = (points: any) => Array.isArray(points) && points.length > 0 && points.every(coordinate);
  const metric = (number: any) => Number.isFinite(number) && number >= 0;
  return Boolean(value && value.tourId === tourId && value.travelMode === 'WALK'
    && ['clio-campus-pilot', 'clio-coordinate-fallback'].includes(value.provider)
    && typeof value.fieldVerified === 'boolean' && path(value.path)
    && metric(value.distanceMeters) && metric(value.durationSeconds)
    && Array.isArray(value.legs) && value.legs.every((leg: any) => leg
      && typeof leg.fromStopId === 'string' && typeof leg.toStopId === 'string'
      && path(leg.path) && metric(leg.distanceMeters) && metric(leg.durationSeconds)
      && Array.isArray(leg.steps) && leg.steps.every((step: any) => step
        && typeof step.instruction === 'string' && path(step.path)
        && metric(step.distanceMeters) && metric(step.durationSeconds))));
}
