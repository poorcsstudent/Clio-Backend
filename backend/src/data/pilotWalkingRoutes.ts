export interface PilotWalkingCoordinate {
  latitude: number;
  longitude: number;
}

export interface PilotWalkingStepDefinition {
  instruction: string;
  maneuver: "depart" | "continue" | "turn" | "arrive";
  path: PilotWalkingCoordinate[];
}

export interface PilotWalkingLegDefinition {
  fromStopId: string;
  toStopId: string;
  path: PilotWalkingCoordinate[];
  steps: PilotWalkingStepDefinition[];
}

export interface PilotWalkingRouteDefinition {
  tourId: string;
  lastReviewed: string;
  fieldVerified: boolean;
  attribution: string;
  sourceUrls: string[];
  legs: PilotWalkingLegDefinition[];
}

const havenerCenter: PilotWalkingCoordinate = {
  latitude: 37.954821574023576,
  longitude: -91.77634294571274,
};

const computerScienceBuilding: PilotWalkingCoordinate = {
  latitude: 37.95591160630769,
  longitude: -91.77463592273608,
};

const kummerStudentDesignCenter: PilotWalkingCoordinate = {
  latitude: 37.951764395574905,
  longitude: -91.7779722872522,
};

const havenerToComputerSciencePath: PilotWalkingCoordinate[] = [
  havenerCenter,
  { latitude: 37.9550096, longitude: -91.7762599 },
  { latitude: 37.9550392, longitude: -91.7762599 },
  { latitude: 37.9550392, longitude: -91.7761098 },
  { latitude: 37.9550307, longitude: -91.7760803 },
  { latitude: 37.9550096, longitude: -91.7760294 },
  { latitude: 37.954999, longitude: -91.7760107 },
  { latitude: 37.9549694, longitude: -91.7759785 },
  { latitude: 37.9550307, longitude: -91.7759008 },
  { latitude: 37.9551596, longitude: -91.7756998 },
  { latitude: 37.9552589, longitude: -91.775531 },
  { latitude: 37.9554997, longitude: -91.775531 },
  { latitude: 37.9555187, longitude: -91.7754506 },
  { latitude: 37.9555483, longitude: -91.7753809 },
  { latitude: 37.9555694, longitude: -91.7752898 },
  { latitude: 37.9557384, longitude: -91.7752308 },
  { latitude: 37.9556982, longitude: -91.7749307 },
  { latitude: 37.9556898, longitude: -91.7746815 },
  { latitude: 37.9556898, longitude: -91.7745395 },
  { latitude: 37.9557595, longitude: -91.7745395 },
  { latitude: 37.9557701, longitude: -91.7745207 },
  { latitude: 37.9557701, longitude: -91.7743304 },
  { latitude: 37.9558398, longitude: -91.7743304 },
  { latitude: 37.9558482, longitude: -91.7744912 },
  { latitude: 37.9558694, longitude: -91.7744912 },
  computerScienceBuilding,
];

const computerScienceToKummerPath: PilotWalkingCoordinate[] = [
  computerScienceBuilding,
  { latitude: 37.9558694, longitude: -91.7744857 },
  { latitude: 37.955844, longitude: -91.7744857 },
  { latitude: 37.9558356, longitude: -91.7743355 },
  { latitude: 37.955768, longitude: -91.7743355 },
  { latitude: 37.9557596, longitude: -91.7745394 },
  { latitude: 37.9556836, longitude: -91.7745394 },
  { latitude: 37.9556836, longitude: -91.7745716 },
  { latitude: 37.9555146, longitude: -91.7745501 },
  { latitude: 37.9554808, longitude: -91.7746252 },
  { latitude: 37.9551683, longitude: -91.7746252 },
  { latitude: 37.9551683, longitude: -91.7746896 },
  { latitude: 37.9551176, longitude: -91.7749148 },
  { latitude: 37.9550416, longitude: -91.7750436 },
  { latitude: 37.9549318, longitude: -91.7750865 },
  { latitude: 37.9547713, longitude: -91.7750972 },
  { latitude: 37.9547713, longitude: -91.7751401 },
  { latitude: 37.9542814, longitude: -91.7755371 },
  { latitude: 37.9540703, longitude: -91.7755371 },
  { latitude: 37.9539013, longitude: -91.7755156 },
  { latitude: 37.9538929, longitude: -91.7756122 },
  { latitude: 37.9538338, longitude: -91.7757945 },
  { latitude: 37.9538, longitude: -91.7758374 },
  { latitude: 37.9538169, longitude: -91.7761593 },
  { latitude: 37.9535635, longitude: -91.7762022 },
  { latitude: 37.9535973, longitude: -91.7765991 },
  { latitude: 37.9534706, longitude: -91.7766957 },
  { latitude: 37.9534368, longitude: -91.7767386 },
  { latitude: 37.9533692, longitude: -91.7768673 },
  { latitude: 37.9533439, longitude: -91.7769853 },
  { latitude: 37.953251, longitude: -91.7769961 },
  { latitude: 37.9532341, longitude: -91.7772321 },
  { latitude: 37.9527949, longitude: -91.7772321 },
  { latitude: 37.9524908, longitude: -91.7772535 },
  { latitude: 37.9523894, longitude: -91.7772428 },
  { latitude: 37.9516039, longitude: -91.7772857 },
  { latitude: 37.9516208, longitude: -91.7777577 },
  { latitude: 37.9516124, longitude: -91.7779616 },
  kummerStudentDesignCenter,
];

function segment(
  path: PilotWalkingCoordinate[],
  startIndex: number,
  endIndex: number,
) {
  return path.slice(startIndex, endIndex + 1);
}

export const computerScienceWalkingPilot: PilotWalkingRouteDefinition = {
  tourId: "computer-science",
  lastReviewed: "2026-07-27",
  fieldVerified: false,
  attribution:
    "Pedestrian geometry derived from OpenStreetMap data; routing courtesy of OSRM (FOSSGIS).",
  sourceUrls: [
    "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=37.954821%2C-91.776343%3B37.955912%2C-91.774636",
    "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=37.955912%2C-91.774636%3B37.951764%2C-91.777972",
  ],
  legs: [
    {
      fromStopId: "havener-center",
      toStopId: "computer-science-building",
      path: havenerToComputerSciencePath,
      steps: [
        {
          instruction:
            "Leave Havener Center on the north-side pedestrian walk and follow the campus path northeast.",
          maneuver: "depart",
          path: segment(havenerToComputerSciencePath, 0, 8),
        },
        {
          instruction:
            "Continue northeast on the pedestrian walk beside Engineering Management.",
          maneuver: "continue",
          path: segment(havenerToComputerSciencePath, 8, 15),
        },
        {
          instruction:
            "Follow the connected campus walk east toward the Computer Science Building.",
          maneuver: "continue",
          path: segment(havenerToComputerSciencePath, 15, 21),
        },
        {
          instruction:
            "Use the final walkway to reach the Computer Science Building arrival zone.",
          maneuver: "arrive",
          path: segment(
            havenerToComputerSciencePath,
            21,
            havenerToComputerSciencePath.length - 1,
          ),
        },
      ],
    },
    {
      fromStopId: "computer-science-building",
      toStopId: "kummer-student-design-center",
      path: computerScienceToKummerPath,
      steps: [
        {
          instruction:
            "Leave the Computer Science Building and follow the campus walk south.",
          maneuver: "depart",
          path: segment(computerScienceToKummerPath, 0, 10),
        },
        {
          instruction:
            "Continue south past the central campus gardens and Innovation Lab.",
          maneuver: "continue",
          path: segment(computerScienceToKummerPath, 10, 18),
        },
        {
          instruction:
            "Follow the marked pedestrian path toward the Bishop Avenue roundabout.",
          maneuver: "continue",
          path: segment(computerScienceToKummerPath, 18, 26),
        },
        {
          instruction:
            "Continue south along the Bishop Avenue pedestrian corridor toward West 10th Street.",
          maneuver: "continue",
          path: segment(computerScienceToKummerPath, 26, 34),
        },
        {
          instruction:
            "Turn west along the pedestrian walk and continue to the Kummer Student Design Center arrival zone.",
          maneuver: "arrive",
          path: segment(
            computerScienceToKummerPath,
            34,
            computerScienceToKummerPath.length - 1,
          ),
        },
      ],
    },
  ],
};

export const pilotWalkingRoutes = new Map<string, PilotWalkingRouteDefinition>([
  [computerScienceWalkingPilot.tourId, computerScienceWalkingPilot],
]);
