const text = (value: any) => typeof value === 'string';
const identifier = (value: any) => text(value) && value.trim().length > 0;
const strings = (value: any) => Array.isArray(value) && value.every(text);
const optionalText = (value: any) => value === undefined || text(value);
const optionalStrings = (value: any) => value === undefined || strings(value);

export function validTourProgress(value: any, origin: string, now = Date.now()): boolean {
  return Boolean(value && value.origin === origin && Number.isFinite(value.savedAt)
    && value.savedAt <= now && now - value.savedAt <= 7 * 86400000
    && Array.isArray(value.session?.stops) && value.session.stops.length > 0
    && value.session.stops.every((stop: any) => identifier(stop?.id)
      && identifier(stop.name) && Number.isFinite(stop.latitude) && Math.abs(stop.latitude) <= 90
      && Number.isFinite(stop.longitude) && Math.abs(stop.longitude) <= 180
      && identifier(stop.campusId) && strings(stop.tourTags) && text(stop.description)
      && Number.isInteger(stop.order) && stop.order >= 0
      && optionalText(stop.relevance) && optionalText(stop.audioScript)
      && optionalText(stop.programCatalogUrl) && optionalStrings(stop.suggestedQuestions)
      && (stop.distanceFromPreviousMeters === undefined
        || (Number.isFinite(stop.distanceFromPreviousMeters) && stop.distanceFromPreviousMeters >= 0)))
    && identifier(value.session?.tour?.id) && identifier(value.session.tour.name)
    && text(value.session.tour.description)
    && ['all-visitors', 'undergraduate-degree'].includes(value.session.tour.audience)
    && ['curated', 'best-first-proximity'].includes(value.session.tour.routeStrategy)
    && identifier(value.session.tour.rootStopId)
    && optionalStrings(value.session.tour.degreeTypes) && optionalStrings(value.session.tour.emphasisAreas)
    && optionalText(value.session.tour.catalogUrl)
    && value.session.tour.stopCount === value.session.stops.length
    && value.session.stopCount === value.session.stops.length
    && identifier(value.session.campusId) && identifier(value.session.sessionId)
    && Number.isInteger(value.stopIndex) && value.stopIndex >= 0 && value.stopIndex < value.session.stops.length);
}

export function validSavedRoute(value: any, tourId: string): boolean {
  const coordinate = (point: any) => point && Number.isFinite(point.latitude)
    && Math.abs(point.latitude) <= 90 && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
  const path = (points: any) => Array.isArray(points) && points.length > 0 && points.every(coordinate);
  const metric = (number: any) => Number.isFinite(number) && number >= 0;
  return Boolean(value && value.tourId === tourId && value.travelMode === 'WALK'
    && optionalText(value.warning) && optionalText(value.attribution)
    && optionalText(value.lastReviewed) && optionalStrings(value.sourceUrls)
    && ['clio-campus-pilot', 'clio-coordinate-fallback', 'clio-pedestrian-network'].includes(value.provider)
    && optionalText(value.networkVersion) && optionalStrings(value.stopOrder) && optionalStrings(value.approachAssumptions)
    && (value.approaches === undefined || (Array.isArray(value.approaches) && value.approaches.every((a:any)=>identifier(a?.stopId)&&coordinate(a.coordinate)&&metric(a.gapMeters))))
    && typeof value.fieldVerified === 'boolean' && path(value.path)
    && metric(value.distanceMeters) && metric(value.durationSeconds)
    && Array.isArray(value.legs) && value.legs.every((leg: any) => leg
      && typeof leg.fromStopId === 'string' && typeof leg.toStopId === 'string'
      && path(leg.path) && metric(leg.distanceMeters) && metric(leg.durationSeconds)
      && Array.isArray(leg.steps) && leg.steps.every((step: any) => step
        && typeof step.instruction === 'string' && optionalText(step.maneuver) && path(step.path)
        && (step.kind === undefined || ['depart','turn','tunnel','crossing','stairs','continue'].includes(step.kind))
        && (step.offsetMeters === undefined || metric(step.offsetMeters))
        && metric(step.distanceMeters) && metric(step.durationSeconds))));
}
