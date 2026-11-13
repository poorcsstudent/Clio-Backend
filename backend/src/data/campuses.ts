import { campusPlaces } from "./campusPlaces";
import {
  buildDegreeTourGraph,
  DEGREE_TOUR_ROOT_PLACE_ID,
  degreeTourMetadata,
  degreeTourPrograms,
  distanceBetweenPlaces,
  MISSOURI_S_AND_T_CAMPUS_ID,
} from "./degreeTours";

export interface Tour {
  id: string;
  name: string;
  description: string;
  audience: "all-visitors" | "undergraduate-degree";
  degreeTypes?: string[];
  emphasisAreas?: string[];
  catalogUrl?: string;
  rootStopId: string;
  routeStrategy: "curated" | "best-first-proximity";
  stopCount: number;
}

export interface TourStop {
  id: string;
  campusId: string;
  name: string;
  tourTags: string[];
  order: number;
  description: string;
  address?: string;
  latitude: number;
  longitude: number;
  funFacts?: string[];
  talkingPoints?: string[];
  suggestedQuestions?: string[];
  audioScript?: string;
  sourceUrl?: string;
  programCatalogUrl?: string;
  relevance?: string;
  distanceFromPreviousMeters?: number;
  graphNeighborIds?: string[];
}

export const campuses = [
  {
    id: MISSOURI_S_AND_T_CAMPUS_ID,
    name: "Missouri S&T",
    city: "Rolla",
    state: "MO",
    description:
      "A public technological research university with academic, research, residential, recreation, and student-support facilities across its Rolla campus.",
  },
];

const placeById = new Map(campusPlaces.map(place => [place.id, place]));

const generalCampusLifeRoute = [
  {
    placeId: "havener-center",
    relevance:
      "The central meeting point, with dining, the S&T Store, lounges, conference rooms, and major campus events.",
  },
  {
    placeId: "innovation-lab",
    relevance:
      "A campus-wide space for creativity, collaboration, entrepreneurship, and hands-on discovery.",
  },
  {
    placeId: "curtis-laws-wilson-library",
    relevance:
      "The main library, research-resource center, IT Helpdesk location, and a shared study destination.",
  },
  {
    placeId: "kummer-student-design-center",
    relevance:
      "The 24-hour home of student design teams, manufacturing, testing, and project collaboration.",
  },
  {
    placeId: "residential-commons-1",
    relevance:
      "A suite-style residence hall that introduces visitors to student housing near the main campus.",
  },
];

function requirePlace(placeId: string) {
  const place = placeById.get(placeId);
  if (!place) throw new Error(`Tour references missing campus place "${placeId}"`);
  return place;
}

function createGeneralTourStops(): TourStop[] {
  return generalCampusLifeRoute.map((routePlace, index) => {
    const place = requirePlace(routePlace.placeId);
    const previousPlace =
      index > 0 ? requirePlace(generalCampusLifeRoute[index - 1].placeId) : undefined;
    return {
      id: place.id,
      campusId: place.campusId,
      name: place.name,
      tourTags: ["general-campus-life"],
      order: index + 1,
      description: place.description,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      talkingPoints: [routePlace.relevance],
      suggestedQuestions: [
        `Why is ${place.name} on this tour?`,
        `What can students do at ${place.name}?`,
      ],
      audioScript: `This is ${place.name}. ${routePlace.relevance}`,
      sourceUrl: place.sourceUrl,
      relevance: routePlace.relevance,
      distanceFromPreviousMeters: previousPlace
        ? distanceBetweenPlaces(previousPlace, place)
        : 0,
    };
  });
}

const degreeTours: Tour[] = degreeTourPrograms.map(program => {
  const graph = buildDegreeTourGraph(program.id);
  if (!graph) throw new Error(`Could not build degree tour graph for "${program.id}"`);
  return {
    id: program.id,
    name: `${program.name} Tour`,
    description: program.description,
    audience: "undergraduate-degree",
    degreeTypes: program.degreeTypes,
    emphasisAreas: program.emphasisAreas,
    catalogUrl: program.catalogUrl,
    rootStopId: DEGREE_TOUR_ROOT_PLACE_ID,
    routeStrategy: graph.strategy,
    stopCount: graph.route.length,
  };
});

export const tours: Tour[] = [
  {
    id: "general-campus-life",
    name: "General Campus Life",
    description:
      "A broad route through shared student-life, learning, design, and residential spaces.",
    audience: "all-visitors",
    rootStopId: DEGREE_TOUR_ROOT_PLACE_ID,
    routeStrategy: "curated",
    stopCount: generalCampusLifeRoute.length,
  },
  ...degreeTours,
];

export function getTourStopsForTour(tourId: string): TourStop[] {
  if (tourId === "general-campus-life") return createGeneralTourStops();

  const program = degreeTourPrograms.find(candidate => candidate.id === tourId);
  const graph = buildDegreeTourGraph(tourId);
  if (!program || !graph) return [];

  const relevanceByPlaceId = new Map(
    program.places.map(place => [place.placeId, place.relevance]),
  );
  const graphNodeById = new Map(graph.nodes.map(node => [node.id, node]));

  return graph.route.map((placeId, index) => {
    const place = requirePlace(placeId);
    const previousPlace = index > 0 ? requirePlace(graph.route[index - 1]) : undefined;
    const relevance =
      placeId === DEGREE_TOUR_ROOT_PLACE_ID
        ? `Start the ${program.name} tour here, then follow Clio to the campus spaces most relevant to the degree.`
        : relevanceByPlaceId.get(placeId) ?? place.description;
    return {
      id: place.id,
      campusId: place.campusId,
      name: place.name,
      tourTags: [program.id],
      order: index + 1,
      description: place.description,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      talkingPoints: [relevance],
      suggestedQuestions: [
        `Why do ${program.name} students use ${place.name}?`,
        `What should a ${program.name} student notice here?`,
      ],
      audioScript: `This is ${place.name}. ${relevance}`,
      sourceUrl: place.sourceUrl,
      programCatalogUrl: program.catalogUrl,
      relevance,
      distanceFromPreviousMeters: previousPlace
        ? distanceBetweenPlaces(previousPlace, place)
        : 0,
      graphNeighborIds: graphNodeById.get(placeId)?.neighbors.map(neighbor => neighbor.nodeId),
    };
  });
}

const allTourTagsByPlaceId = new Map<string, Set<string>>();
for (const tour of tours) {
  for (const stop of getTourStopsForTour(tour.id)) {
    const tags = allTourTagsByPlaceId.get(stop.id) ?? new Set<string>();
    tags.add(tour.id);
    allTourTagsByPlaceId.set(stop.id, tags);
  }
}

const degreeTalkingPointsByPlaceId = new Map<string, Set<string>>();
for (const program of degreeTourPrograms) {
  for (const programPlace of program.places) {
    const talkingPoints =
      degreeTalkingPointsByPlaceId.get(programPlace.placeId) ?? new Set<string>();
    talkingPoints.add(programPlace.relevance);
    degreeTalkingPointsByPlaceId.set(programPlace.placeId, talkingPoints);
  }
}

const rootPlace = requirePlace(DEGREE_TOUR_ROOT_PLACE_ID);

export const tourStops: TourStop[] = [...allTourTagsByPlaceId.entries()]
  .map(([placeId, tourTags]) => {
    const place = requirePlace(placeId);
    const talkingPoints = [
      ...(degreeTalkingPointsByPlaceId.get(placeId) ?? []),
    ];
    if (placeId === DEGREE_TOUR_ROOT_PLACE_ID) {
      talkingPoints.unshift(
        "Every undergraduate degree tour begins here before branching to major-relevant campus nodes.",
      );
    }
    return {
      id: place.id,
      campusId: place.campusId,
      name: place.name,
      tourTags: [...tourTags].sort(),
      order:
        placeId === DEGREE_TOUR_ROOT_PLACE_ID
          ? 1
          : 2 + distanceBetweenPlaces(rootPlace, place),
      description: place.description,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      talkingPoints,
      suggestedQuestions: [
        `Which degree tours include ${place.name}?`,
        `What happens at ${place.name}?`,
      ],
      audioScript: `This is ${place.name}. ${place.description}`,
      sourceUrl: place.sourceUrl,
    };
  })
  .sort((first, second) => first.order - second.order);

export const tourDataMetadata = {
  ...degreeTourMetadata,
  degreeProgramCount: degreeTourPrograms.length,
  totalTourCount: tours.length,
  routedPlaceCount: tourStops.length,
} as const;
