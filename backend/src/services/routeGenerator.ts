import {
    CampusLocation,
    mstLocations
} from "../data/campusLocations";
import { getDistanceInMeters } from "../utils/distance";

  const DEFAULT_START_LOCATION_ID = "welcome-center";
  const RELEVANCE_WEIGHT = 10;
  
  export function generateWalkingRoute(tourId: string): CampusLocation[] {
    const tourLocations = mstLocations.filter(
      location => (location.tourRelevance[tourId] ?? 0) > 0
    );
  
    if (tourLocations.length === 0) {
      return [];
    }
  
    const startLocation =
      tourLocations.find(location => location.id === DEFAULT_START_LOCATION_ID) ??
      tourLocations[0];
  
    const route: CampusLocation[] = [startLocation];
  
    const unvisited = new Set(
      tourLocations
        .filter(location => location.id !== startLocation.id)
        .map(location => location.id)
    );
  
    while (unvisited.size > 0) {
      const currentLocation = route[route.length - 1];
  
      const nextStop = chooseNextStopByDistanceAndRelevance(
        currentLocation,
        unvisited,
        tourId
      );
  
      if (!nextStop) {
        break;
      }
  
      route.push(nextStop);
      unvisited.delete(nextStop.id);
    }
  
    return route;
  }
  
  function chooseNextStopByDistanceAndRelevance(
    currentLocation: CampusLocation,
    unvisited: Set<string>,
    tourId: string
  ): CampusLocation | undefined {
    const candidates = mstLocations.filter(location =>
      unvisited.has(location.id)
    );
  
    return candidates
      .map(candidate => {
        const distance = getDistanceInMeters(currentLocation, candidate);
        const relevance = candidate.tourRelevance[tourId] ?? 0;
  
        return {
          location: candidate,
          score: distance - relevance * RELEVANCE_WEIGHT,
          distance,
          relevance
        };
      })
      .sort((a, b) => a.score - b.score)[0]?.location;
  }
  
