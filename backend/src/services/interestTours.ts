import { randomUUID } from 'node:crypto';
import { campusPlaces } from '../data/campusPlaces';
import { degreeTourPrograms } from '../data/degreeTours';
import layout from '../data/artwork-layout.json';
import { createArtworkRoute } from './artworkRouting';
import { createNetworkWalkingRoute } from './walkingRoutes';
import { PedestrianRouteError } from './pedestrianRouting';

const extras = [
  { id: 'housing', name: 'Student housing', pattern: /housing/i },
  { id: 'life', name: 'Campus life', pattern: /student support|recreation|student life/i },
  { id: 'campus-history', name: 'History & landmarks', pattern: /landmark|historic/i },
];
export const interestCatalog = {
  interests: [
    ...extras.map(item => ({ id: item.id, name: item.name, group: 'Campus experience',
      matches: campusPlaces.filter(p => item.pattern.test(p.category)).map(p => ({ placeId: p.id, relevance: p.description })) })),
    ...degreeTourPrograms.map(p => ({ id: p.id, name: p.name, group: 'Academics', matches: p.places })),
  ],
  places: campusPlaces,
  layout,
};

export function planInterestTour(interestIds: unknown, excludedIds: unknown = []) {
  if (!Array.isArray(interestIds) || !interestIds.length || interestIds.some(id => typeof id !== 'string' || !interestCatalog.interests.some(i => i.id === id)) || new Set(interestIds).size !== interestIds.length)
    throw new Error('Choose one or more distinct, known interests.');
  if (!Array.isArray(excludedIds) || excludedIds.some(id => typeof id !== 'string' || id === 'havener-center' || !campusPlaces.some(p => p.id === id)) || new Set(excludedIds).size !== excludedIds.length)
    throw new Error('Removed stops must be distinct campus buildings; Havener remains the start.');
  const interests = interestCatalog.interests.filter(i => interestIds.includes(i.id));
  const matches = campusPlaces.map(p => ({ ...p,
    reasons: interests.flatMap(i => i.matches.filter(m => m.placeId === p.id).map(m => ({ interestId: i.id, interest: i.name, relevance: m.relevance }))),
  })).filter(p => p.id !== 'havener-center' && p.reasons.length && !excludedIds.includes(p.id))
    .sort((a,b) => b.reasons.length - a.reasons.length || a.name.localeCompare(b.name));
  if (!matches.length) throw new Error('Include at least one matching destination.');
  const root = { ...campusPlaces.find(p => p.id === 'havener-center')!, reasons: [] as typeof matches[number]['reasons'] };
  const requested = [root, ...matches];
  const tourId = `interest-${randomUUID()}`;
  let walkingRoute: ReturnType<typeof createNetworkWalkingRoute> | null = null;
  let routingError: string | null = null;
  try { walkingRoute = createNetworkWalkingRoute(tourId, requested, true); }
  catch (error) { if (!(error instanceof PedestrianRouteError)) throw error; routingError = error.message; }
  const ordered = walkingRoute ? walkingRoute.stopOrder!.map(id => requested.find(p => p.id === id)!) : requested;
  const artwork = createArtworkRoute(ordered, layout, undefined, false);
  const stops = ordered.map((p,index) => ({ ...p, order: index + 1, tourTags: ['personalized'],
    relevance: p.id === root.id ? 'Your personalized campus visit begins here.' : p.reasons.map(r => `${r.interest}: ${r.relevance}`).join(' '),
    audioScript: `${p.name}. ${p.description}`,
    distanceFromPreviousMeters: index ? walkingRoute?.legs[index-1]?.distanceMeters : 0,
  }));
  return {
    interestIds, excludedIds, walkingRoute, artwork, routingError,
    orderExplanation: walkingRoute ? (stops.length <= 11
      ? 'Shortest open route on the mapped pedestrian graph for these building approaches; starts at Havener.'
      : 'Walking-network order refined to reduce backtracking. Every stop is retained; not guaranteed globally shortest.')
      : 'All chosen stops retained. Walking cannot start until the geographic connection gaps are resolved or you remove affected stops.',
    session: { sessionId: `tour_${randomUUID()}`, campusId: root.campusId, interestIds, excludedIds, illustration: artwork,
      tour: { id: tourId, name: 'Your campus tour', description: interests.map(i => i.name).join(' · '), audience: 'all-visitors' as const,
        rootStopId: root.id, routeStrategy: 'curated' as const, stopCount: stops.length }, stopCount: stops.length, stops },
  };
}
