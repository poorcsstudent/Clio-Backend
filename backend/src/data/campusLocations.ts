export type CampusLocation = {
    mapNumber: number;
    id: string;
    name: string;
  
    category:
      | "classroom"
      | "research"
      | "student-life"
      | "housing"
      | "landmark"
      | "admissions";
  
    latitude: number;
    longitude: number;
  
    nearbyStops: string[];
    tourRelevance: Record<string, number>;
  
    notes?: string;
  };
  
  export const mstLocations: CampusLocation[] = [
    {
      mapNumber: 62,
      id: "welcome-center",
      name: "Welcome Center",
      category: "admissions",
      latitude: 37.9539,
      longitude: -91.7748,
      nearbyStops: ["havener-center"],
      tourRelevance: {
        "general-campus-life": 10,
        "computer-science": 8,
        "computer-engineering": 8,
        "electrical-engineering": 8,
        "engineering-management": 8
      },
      notes: "Strong starting point for prospective students and families."
    },
    {
      mapNumber: 51,
      id: "havener-center",
      name: "Havener Center",
      category: "student-life",
      latitude: 37.9547,
      longitude: -91.7756,
      nearbyStops: ["welcome-center", "innovation-lab", "computer-science-building"],
      tourRelevance: {
        "general-campus-life": 10,
        "computer-science": 6,
        "computer-engineering": 6,
        "electrical-engineering": 5,
        "engineering-management": 6
      },
      notes: "Central student-life stop."
    },
    {
      mapNumber: 52,
      id: "innovation-lab",
      name: "Innovation Lab",
      category: "student-life",
      latitude: 37.9545,
      longitude: -91.776,
      nearbyStops: ["havener-center", "kummer-student-design-center"],
      tourRelevance: {
        "computer-science": 8,
        "computer-engineering": 7,
        "engineering-management": 8,
        "general-campus-life": 4
      }
    },
    {
      mapNumber: 53,
      id: "kummer-student-design-center",
      name: "Kummer Student Design Center",
      category: "student-life",
      latitude: 37.9543,
      longitude: -91.7751,
      nearbyStops: ["innovation-lab", "computer-science-building"],
      tourRelevance: {
        "computer-science": 7,
        "computer-engineering": 8,
        "electrical-engineering": 7,
        "engineering-management": 7,
        "general-campus-life": 5
      }
    },
    {
      mapNumber: 3,
      id: "computer-science-building",
      name: "Computer Science Building",
      category: "classroom",
      latitude: 37.9542,
      longitude: -91.7745,
      nearbyStops: ["emerson-electric-company-hall", "butler-carlton-hall"],
      tourRelevance: {
        "computer-science": 10,
        "computer-engineering": 8,
        "general-campus-life": 2
      }
    },
    {
      mapNumber: 4,
      id: "emerson-electric-company-hall",
      name: "Emerson Electric Company Hall",
      category: "classroom",
      latitude: 37.9546,
      longitude: -91.7739,
      nearbyStops: ["computer-science-building", "engineering-management-building"],
      tourRelevance: {
        "computer-science": 8,
        "computer-engineering": 10,
        "electrical-engineering": 10,
        "general-campus-life": 2
      }
    },
    {
      mapNumber: 5,
      id: "engineering-management-building",
      name: "Engineering Management Building",
      category: "classroom",
      latitude: 37.9548,
      longitude: -91.7735,
      nearbyStops: ["emerson-electric-company-hall"],
      tourRelevance: {
        "engineering-management": 10,
        "general-campus-life": 2
      }
    },
    {
      mapNumber: 2,
      id: "butler-carlton-hall",
      name: "Butler-Carlton Hall",
      category: "classroom",
      latitude: 37.9551,
      longitude: -91.7742,
      nearbyStops: ["computer-science-building"],
      tourRelevance: {
        "computer-science": 4,
        "computer-engineering": 4,
        "engineering-management": 4,
        "general-campus-life": 5
      },
      notes: "Useful STEM-context stop, but not a core CS stop."
    }
  ];
  
  export function getLocationsForTour(tourId: string): CampusLocation[] {
    return mstLocations
      .filter(location => (location.tourRelevance[tourId] ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.tourRelevance[tourId] ?? 0) -
          (a.tourRelevance[tourId] ?? 0)
      );
  }
  
  export function getLocationById(locationId: string): CampusLocation | undefined {
    return mstLocations.find(location => location.id === locationId);
  }