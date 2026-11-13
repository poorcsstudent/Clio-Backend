import { campusPlaces, type CampusPlace } from "./campusPlaces";

export const MISSOURI_S_AND_T_CAMPUS_ID = "missouri-s-and-t";
export const DEGREE_TOUR_ROOT_PLACE_ID = "havener-center";

export type DegreeType = "BA" | "BS";

export interface DegreeTourPlace {
  placeId: string;
  relevance: string;
}

export interface DegreeTourProgram {
  id: string;
  name: string;
  degreeTypes: DegreeType[];
  description: string;
  emphasisAreas: string[];
  catalogUrl: string;
  places: DegreeTourPlace[];
}

export interface DegreeTourGraphNeighbor {
  nodeId: string;
  distanceMeters: number;
}

export interface DegreeTourGraphNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  accessProgramIds: string[];
  relevance: string;
  neighbors: DegreeTourGraphNeighbor[];
}

export interface DegreeTourGraph {
  campusId: string;
  programId: string;
  rootNodeId: string;
  strategy: "best-first-proximity";
  nodes: DegreeTourGraphNode[];
  route: string[];
}

const CATALOG_BASE =
  "https://catalog.mst.edu/undergraduate/degreeprogramsandcourses";

export const degreeTourMetadata = {
  lastVerified: "2026-07-24",
  sources: [
    `${CATALOG_BASE}/`,
    "https://registrar.mst.edu/classofferings/degreeprograms/semesterplan/",
    "https://directory.mst.edu/buildingsmap/",
  ],
  routeModel:
    "Each degree begins at Havener Center. A minimum-distance access graph is built from only the buildings relevant to that degree, then a best-first proximity search selects the next closest permitted node.",
} as const;

export const degreeTourPrograms: DegreeTourProgram[] = [
  {
    id: "aerospace-engineering",
    name: "Aerospace Engineering",
    degreeTypes: ["BS"],
    description:
      "Study aircraft and spacecraft through aerodynamics, propulsion, structures, controls, and engineering design.",
    emphasisAreas: [],
    catalogUrl: `${CATALOG_BASE}/aerospaceengineering/`,
    places: [
      {
        placeId: "toomey-hall",
        relevance:
          "Home to Mechanical and Aerospace Engineering and its aerospace, energy, structures, controls, and vehicle laboratories.",
      },
      {
        placeId: "compressible-flow-laboratory",
        relevance:
          "Supports hands-on work with high-speed and compressible flows used in aerospace engineering.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Provides fabrication, testing, and team space for flight, vehicle, rocketry, and other student design projects.",
      },
    ],
  },
  {
    id: "applied-mathematics",
    name: "Applied Mathematics",
    degreeTypes: ["BS"],
    description:
      "Apply mathematical modeling, computation, statistics, and analysis to scientific and engineering problems.",
    emphasisAreas: [
      "Actuarial Science",
      "Computational Mathematics",
      "Data Science and Statistics",
      "Secondary Education",
    ],
    catalogUrl: `${CATALOG_BASE}/mathematics/`,
    places: [
      {
        placeId: "rolla-building",
        relevance:
          "Home to Mathematics and Statistics, including advising and core applied mathematics coursework.",
      },
      {
        placeId: "computer-science-building",
        relevance:
          "Connects computational mathematics and data-focused work with campus computing resources.",
      },
    ],
  },
  {
    id: "architectural-engineering",
    name: "Architectural Engineering",
    degreeTypes: ["BS"],
    description:
      "Design safe, efficient buildings by combining structural, construction, materials, and building-systems engineering.",
    emphasisAreas: [
      "Construction Engineering and Project Management",
      "Construction Materials",
      "Environmental Systems for Buildings",
      "Structural Engineering",
    ],
    catalogUrl: `${CATALOG_BASE}/architecturalengineering/`,
    places: [
      {
        placeId: "butler-carlton-civil-engineering-hall",
        relevance:
          "Home to Civil, Architectural and Environmental Engineering and the program's classrooms, advising, and laboratories.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Offers collaborative design, fabrication, and project space useful for building and construction teams.",
      },
    ],
  },
  {
    id: "biological-sciences",
    name: "Biological Sciences",
    degreeTypes: ["BA", "BS"],
    description:
      "Explore organisms, cells, genetics, ecology, microbiology, and preparation for health and laboratory careers.",
    emphasisAreas: [
      "Medical Laboratory Scientist",
      "Pre-Medicine",
      "Secondary Education",
    ],
    catalogUrl: `${CATALOG_BASE}/biologicalsciences/`,
    places: [
      {
        placeId: "interdisciplinary-engineering-building",
        relevance:
          "Houses the Biological Sciences Department and interdisciplinary biology teaching and research.",
      },
      {
        placeId: "schrenk-hall",
        relevance:
          "Contains biological sciences laboratories, microbiological preparation space, a vivarium, and an imaging center.",
      },
    ],
  },
  {
    id: "biomedical-engineering",
    name: "Biomedical Engineering",
    degreeTypes: ["BS"],
    description:
      "Combine engineering and life science for biomanufacturing, biomaterials, medical devices, biotechnology, and health care.",
    emphasisAreas: ["Biomanufacturing", "Biomaterials"],
    catalogUrl: `${CATALOG_BASE}/biomedicalengineering/`,
    places: [
      {
        placeId: "interdisciplinary-engineering-building",
        relevance:
          "Provides the biological sciences foundation and interdisciplinary research environment used by biomedical engineers.",
      },
      {
        placeId: "bertelsmeyer-hall",
        relevance:
          "Houses chemical and biochemical engineering laboratories relevant to biomanufacturing.",
      },
      {
        placeId: "mcnutt-hall",
        relevance:
          "Houses materials science resources used for biomaterials study and characterization.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Home base for student design work, including biomedical device projects and prototyping.",
      },
    ],
  },
  {
    id: "business-and-management-systems",
    name: "Business and Management Systems",
    degreeTypes: ["BS"],
    description:
      "Develop skills in management, analytics, finance, operations, information systems, and technology-focused business.",
    emphasisAreas: [
      "Military Science and Leadership",
      "Secondary Education",
    ],
    catalogUrl: `${CATALOG_BASE}/businessandmanagementsystems/`,
    places: [
      {
        placeId: "fulton-hall",
        relevance:
          "Houses business and information technology programs, faculty, advising, and classrooms.",
      },
      {
        placeId: "innovation-lab",
        relevance:
          "Supports entrepreneurship, collaboration, creative problem-solving, and student venture development.",
      },
    ],
  },
  {
    id: "ceramic-engineering",
    name: "Ceramic Engineering",
    degreeTypes: ["BS"],
    description:
      "Engineer ceramic and glass materials for energy, electronics, aerospace, health, manufacturing, and extreme environments.",
    emphasisAreas: [],
    catalogUrl: `${CATALOG_BASE}/ceramicengineering/`,
    places: [
      {
        placeId: "mcnutt-hall",
        relevance:
          "Home to Materials Science and Engineering and the core ceramic engineering academic program.",
      },
      {
        placeId: "straumanis-james-hall",
        relevance:
          "Houses advanced materials research and characterization activity.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Offers manufacturing, testing, and project space for materials-centered design work.",
      },
    ],
  },
  {
    id: "chemical-engineering",
    name: "Chemical Engineering",
    degreeTypes: ["BS"],
    description:
      "Design processes that transform raw materials into chemicals, energy, food, medicines, and sustainable products.",
    emphasisAreas: ["Biochemical Engineering"],
    catalogUrl: `${CATALOG_BASE}/chemicalandbiochemicalengineering/`,
    places: [
      {
        placeId: "bertelsmeyer-hall",
        relevance:
          "Home to Chemical and Biochemical Engineering, including core classrooms, laboratories, faculty, and advising.",
      },
      {
        placeId: "schrenk-hall",
        relevance:
          "Provides chemistry and biological laboratory connections for chemical and biochemical process work.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Supports process-design teams, prototyping, fabrication, and multidisciplinary project work.",
      },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    degreeTypes: ["BA", "BS"],
    description:
      "Study molecular structure, reactions, analysis, biochemistry, polymers, coatings, and laboratory methods.",
    emphasisAreas: [
      "Biochemistry",
      "Polymer and Coatings Science",
      "Pre-Medicine",
      "Secondary Education",
    ],
    catalogUrl: `${CATALOG_BASE}/chemistry/`,
    places: [
      {
        placeId: "schrenk-hall",
        relevance:
          "Home to the Chemistry Department and teaching and research laboratories, including nuclear magnetic resonance resources.",
      },
      {
        placeId: "straumanis-james-hall",
        relevance:
          "Connects chemistry students with advanced materials research and characterization.",
      },
    ],
  },
  {
    id: "civil-engineering",
    name: "Civil Engineering",
    degreeTypes: ["BS"],
    description:
      "Plan and build infrastructure through structural, geotechnical, transportation, water, construction, and materials engineering.",
    emphasisAreas: [
      "Construction Engineering",
      "Environmental Engineering",
      "Geotechnical Engineering",
      "Materials Engineering",
      "Structural Engineering",
      "Transportation Engineering",
      "Water Resources Engineering",
    ],
    catalogUrl: `${CATALOG_BASE}/civilengineering/`,
    places: [
      {
        placeId: "butler-carlton-civil-engineering-hall",
        relevance:
          "Home to Civil, Architectural and Environmental Engineering, geotechnical engineering, and the Environmental Research Center.",
      },
      {
        placeId: "720-w-tim-bradley-way",
        relevance:
          "Houses research laboratories and Missouri's transportation training and resource programs.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Supports concrete canoe, steel bridge, construction, and other hands-on engineering teams.",
      },
    ],
  },
  {
    id: "computer-engineering",
    name: "Computer Engineering",
    degreeTypes: ["BS"],
    description:
      "Build computing hardware and embedded systems through digital logic, architecture, networks, security, and intelligent systems.",
    emphasisAreas: [
      "Computational Intelligence",
      "Computer Architecture and Embedded Systems",
      "Integrated Circuits and Logic Design",
      "Networking, Security, and Dependability",
    ],
    catalogUrl: `${CATALOG_BASE}/computerengineering/`,
    places: [
      {
        placeId: "emerson-electric-company-hall",
        relevance:
          "Home to Electrical and Computer Engineering laboratories, faculty, advising, and hardware-focused coursework.",
      },
      {
        placeId: "computer-science-building",
        relevance:
          "Connects computer engineering students with software, algorithms, cybersecurity, AI, and campus computing services.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Provides electronics, embedded-systems, robotics, fabrication, and competition-team project space.",
      },
    ],
  },
  {
    id: "computer-science",
    name: "Computer Science",
    degreeTypes: ["BS"],
    description:
      "Study software, algorithms, artificial intelligence, cybersecurity, data, systems, and computing theory.",
    emphasisAreas: [],
    catalogUrl: `${CATALOG_BASE}/computerscience/`,
    places: [
      {
        placeId: "computer-science-building",
        relevance:
          "Home to the Computer Science Department and teaching and research in software, artificial intelligence, cybersecurity, data, and computing systems.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Lets computing students apply software, AI, autonomy, simulation, and data skills on multidisciplinary design teams.",
      },
    ],
  },
  {
    id: "economics",
    name: "Economics",
    degreeTypes: ["BS"],
    description:
      "Use economic theory, data, business analysis, finance, and policy to understand decisions and markets.",
    emphasisAreas: [
      "Decision Data Analytics",
      "Economics and Business",
      "Energy Economics",
      "Financial Economics and Technology",
    ],
    catalogUrl: `${CATALOG_BASE}/economics/`,
    places: [
      {
        placeId: "harris-hall",
        relevance:
          "Houses the Economics program and its faculty and academic offices.",
      },
      {
        placeId: "fulton-hall",
        relevance:
          "Connects economics with business, management, information technology, and nuclear energy policy faculty.",
      },
    ],
  },
  {
    id: "education",
    name: "Education",
    degreeTypes: ["BS"],
    description:
      "Prepare to teach through education coursework, field experiences, content methods, and classroom practice.",
    emphasisAreas: [
      "Early Childhood Education",
      "Educational Studies",
      "Elementary Education",
      "Middle School Language Arts",
      "Middle School Mathematics",
      "Middle School Science",
      "Middle School Social Studies",
    ],
    catalogUrl: `${CATALOG_BASE}/education/`,
    places: [
      {
        placeId: "centennial-hall",
        relevance:
          "Home to the Education Department, its advising, faculty, and teacher-preparation coursework.",
      },
      {
        placeId: "child-development-center",
        relevance:
          "A curriculum-based early-childhood facility relevant to observation and early-childhood education.",
      },
    ],
  },
  {
    id: "electrical-engineering",
    name: "Electrical Engineering",
    degreeTypes: ["BS"],
    description:
      "Study circuits, electronics, communications, controls, electromagnetics, optics, power, and energy systems.",
    emphasisAreas: [
      "Circuits and Electronics",
      "Communications and Signal Processing",
      "Computer Engineering",
      "Controls and Systems",
      "Electromagnetics",
      "Optics and Devices",
      "Power and Energy",
    ],
    catalogUrl: `${CATALOG_BASE}/electricalengineering/`,
    places: [
      {
        placeId: "emerson-electric-company-hall",
        relevance:
          "Home to Electrical and Computer Engineering classrooms, faculty, advising, and research laboratories.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Supports circuit, power, controls, robotics, communications, and embedded-system work on student design teams.",
      },
    ],
  },
  {
    id: "engineering-management",
    name: "Engineering Management",
    degreeTypes: ["BS"],
    description:
      "Combine engineering, operations, systems thinking, analytics, economics, and leadership for technology organizations.",
    emphasisAreas: [
      "Industrial Engineering",
      "Management of Technology",
      "Manufacturing Engineering",
      "Packaging Engineering",
      "Quality Engineering",
    ],
    catalogUrl: `${CATALOG_BASE}/engineeringmanagement/`,
    places: [
      {
        placeId: "engineering-management-building",
        relevance:
          "Home to Engineering Management and Systems Engineering faculty, advising, classrooms, and laboratories.",
      },
      {
        placeId: "fulton-hall",
        relevance:
          "Connects engineering management with business, information technology, finance, and economics.",
      },
      {
        placeId: "innovation-lab",
        relevance:
          "Provides collaborative space for entrepreneurship, product development, and technology leadership.",
      },
    ],
  },
  {
    id: "english-and-technical-communication",
    name: "English and Technical Communication",
    degreeTypes: ["BS"],
    description:
      "Develop professional writing, editing, rhetoric, literature, digital media, and communication for technical settings.",
    emphasisAreas: ["English Education"],
    catalogUrl: `${CATALOG_BASE}/englishandtechnicalcommunication/`,
    places: [
      {
        placeId: "humanities-and-social-sciences-building",
        relevance:
          "Home to English and Technical Communication faculty, advising, classrooms, and communication-focused work.",
      },
      {
        placeId: "curtis-laws-wilson-library",
        relevance:
          "Provides research collections, digital resources, writing support context, and information services.",
      },
    ],
  },
  {
    id: "environmental-engineering",
    name: "Environmental Engineering",
    degreeTypes: ["BS"],
    description:
      "Protect water, air, soil, and public health through treatment, remediation, sustainability, and environmental systems design.",
    emphasisAreas: [],
    catalogUrl: `${CATALOG_BASE}/environmentalengineering/`,
    places: [
      {
        placeId: "butler-carlton-civil-engineering-hall",
        relevance:
          "Home to Environmental Engineering and the Environmental Research Center.",
      },
      {
        placeId: "interdisciplinary-engineering-building",
        relevance:
          "Connects environmental engineering with biological systems and critical-minerals research.",
      },
      {
        placeId: "720-w-tim-bradley-way",
        relevance:
          "Houses applied research laboratories and transportation-resource programs with environmental infrastructure connections.",
      },
    ],
  },
  {
    id: "environmental-science",
    name: "Environmental Science",
    degreeTypes: ["BS"],
    description:
      "Study ecosystems and environmental change through biology, chemistry, earth science, data, and field investigation.",
    emphasisAreas: ["Secondary Education"],
    catalogUrl: `${CATALOG_BASE}/environmentalsciences/`,
    places: [
      {
        placeId: "interdisciplinary-engineering-building",
        relevance:
          "Houses Biological Sciences and interdisciplinary environmental research activity.",
      },
      {
        placeId: "schrenk-hall",
        relevance:
          "Provides biology and chemistry laboratories used for environmental sampling and analysis.",
      },
      {
        placeId: "butler-carlton-civil-engineering-hall",
        relevance:
          "Connects environmental science with environmental engineering and the Environmental Research Center.",
      },
      {
        placeId: "ecovillage",
        relevance:
          "Demonstrates student-built solar housing and campus-scale sustainability systems.",
      },
    ],
  },
  {
    id: "geological-engineering",
    name: "Geological Engineering",
    degreeTypes: ["BS"],
    description:
      "Apply geology and engineering to ground conditions, water, hazards, energy, waste, quarries, and natural resources.",
    emphasisAreas: [
      "Engineering Geology and Geotechnics",
      "Environmental Protection and Hazardous Waste",
      "Groundwater Hydrology and Contaminant Transport",
      "Petroleum, Energy, and Natural Resources",
      "Quarry Engineering",
    ],
    catalogUrl: `${CATALOG_BASE}/geologicalengineering/`,
    places: [
      {
        placeId: "mcnutt-hall",
        relevance:
          "Home to Geosciences and Geological and Petroleum Engineering faculty, advising, classrooms, and laboratories.",
      },
      {
        placeId: "kennedy-experimental-mine",
        relevance:
          "Provides a field-scale underground environment for geological, mining, and geotechnical investigation.",
      },
      {
        placeId: "rock-mechanics-and-explosives-research-center",
        relevance:
          "Supports rock mechanics, subsurface behavior, excavation, and geotechnical research.",
      },
    ],
  },
  {
    id: "geology-and-geophysics",
    name: "Geology and Geophysics",
    degreeTypes: ["BS"],
    description:
      "Investigate Earth materials and processes through geology, geochemistry, geophysics, groundwater, and energy resources.",
    emphasisAreas: [
      "Geochemistry",
      "Geology",
      "Geophysics",
      "Groundwater and Environmental Geochemistry",
      "Petroleum Geology",
    ],
    catalogUrl: `${CATALOG_BASE}/geologyandgeophysics/`,
    places: [
      {
        placeId: "mcnutt-hall",
        relevance:
          "Home to Geosciences and Geological and Petroleum Engineering and the program's collections and laboratories.",
      },
      {
        placeId: "physics-building",
        relevance:
          "Connects geophysics with the physics of waves, fields, instrumentation, and quantitative measurement.",
      },
      {
        placeId: "kennedy-experimental-mine",
        relevance:
          "Offers direct access to exposed rock and subsurface conditions for field observation and measurement.",
      },
    ],
  },
  {
    id: "history",
    name: "History",
    degreeTypes: ["BA", "BS"],
    description:
      "Analyze people, institutions, evidence, conflict, technology, and change across time and place.",
    emphasisAreas: ["National Security", "Secondary Education"],
    catalogUrl: `${CATALOG_BASE}/history/`,
    places: [
      {
        placeId: "humanities-and-social-sciences-building",
        relevance:
          "Home to History and Political Science faculty, advising, classrooms, and the program's academic community.",
      },
      {
        placeId: "curtis-laws-wilson-library",
        relevance:
          "Provides primary and secondary sources, archives access, databases, and research support for historical work.",
      },
    ],
  },
  {
    id: "information-science-and-technology",
    name: "Information Science and Technology",
    degreeTypes: ["BS"],
    description:
      "Connect business and computing through information systems, analytics, databases, enterprise technology, and digital operations.",
    emphasisAreas: [],
    catalogUrl: `${CATALOG_BASE}/informationscienceandtechnology/`,
    places: [
      {
        placeId: "fulton-hall",
        relevance:
          "Houses Information Science and Technology with business and management programs.",
      },
      {
        placeId: "computer-science-building",
        relevance:
          "Connects information systems students with computing infrastructure, software, data, and IT services.",
      },
      {
        placeId: "innovation-lab",
        relevance:
          "Supports technology-enabled collaboration, entrepreneurship, and applied digital projects.",
      },
    ],
  },
  {
    id: "mechanical-engineering",
    name: "Mechanical Engineering",
    degreeTypes: ["BS"],
    description:
      "Design machines and energy systems through mechanics, materials, controls, manufacturing, robotics, and thermal science.",
    emphasisAreas: [
      "Control Systems",
      "Energy Conversion",
      "Environmental Systems",
      "Instrumentation",
      "Manufacturing Processes",
      "Materials Science",
      "Mechanical Design and Analysis",
      "Systems Integration",
      "Thermal Science",
    ],
    catalogUrl: `${CATALOG_BASE}/mechanicalengineering/`,
    places: [
      {
        placeId: "toomey-hall",
        relevance:
          "Home to Mechanical and Aerospace Engineering and laboratories in manufacturing, energy, materials, robotics, and vehicle systems.",
      },
      {
        placeId: "compressible-flow-laboratory",
        relevance:
          "Supports fluid mechanics, thermal systems, aerodynamics, and high-speed-flow experiments.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Provides fabrication, machining, testing, and team space for mechanical systems and vehicles.",
      },
    ],
  },
  {
    id: "metallurgical-engineering",
    name: "Metallurgical Engineering",
    degreeTypes: ["BS"],
    description:
      "Understand and engineer metals through extraction, processing, manufacturing, structure, properties, and performance.",
    emphasisAreas: [
      "Chemical Metallurgy",
      "Manufacturing Metallurgy",
      "Physical Metallurgy",
    ],
    catalogUrl: `${CATALOG_BASE}/metallurgicalengineering/`,
    places: [
      {
        placeId: "mcnutt-hall",
        relevance:
          "Home to Materials Science and Engineering and core metallurgical engineering instruction and laboratories.",
      },
      {
        placeId: "straumanis-james-hall",
        relevance:
          "Houses advanced materials research, testing, and characterization.",
      },
      {
        placeId: "kummer-student-design-center",
        relevance:
          "Offers manufacturing and fabrication equipment for applying metals knowledge in student projects.",
      },
    ],
  },
  {
    id: "mining-engineering",
    name: "Mining Engineering",
    degreeTypes: ["BS"],
    description:
      "Plan safe, efficient resource extraction through mine design, explosives, equipment, environment, health, and sustainability.",
    emphasisAreas: [
      "Coal",
      "Explosives Engineering",
      "Mining and the Environment",
      "Mining Health and Safety",
      "Quarry Engineering",
      "Sustainable Development",
    ],
    catalogUrl: `${CATALOG_BASE}/miningengineering/`,
    places: [
      {
        placeId: "mcnutt-hall",
        relevance:
          "Home to Mining Engineering faculty, advising, classrooms, laboratories, and energy-related research.",
      },
      {
        placeId: "kennedy-experimental-mine",
        relevance:
          "Provides an operating-scale underground setting for mine systems, safety, surveying, and field instruction.",
      },
      {
        placeId: "rock-mechanics-and-explosives-research-center",
        relevance:
          "Supports rock mechanics, explosives, fragmentation, excavation, and mining-safety research.",
      },
    ],
  },
  {
    id: "multidisciplinary-studies",
    name: "Multidisciplinary Studies",
    degreeTypes: ["BA"],
    description:
      "Build a coherent degree across two or three approved focus areas, combining humanities, social science, science, and technology.",
    emphasisAreas: [
      "French Language and French-Speaking Cultures",
      "Global Engineering",
      "Spanish Language and Spanish-Speaking Cultures",
    ],
    catalogUrl: `${CATALOG_BASE}/multidisciplinarystudies/`,
    places: [
      {
        placeId: "humanities-and-social-sciences-building",
        relevance:
          "Home to Arts, Languages and Philosophy, which administers the multidisciplinary studies degree and advising.",
      },
      {
        placeId: "innovation-lab",
        relevance:
          "Provides a neutral collaboration point for projects that cross academic and technical boundaries.",
      },
      {
        placeId: "centennial-hall",
        relevance:
          "Connects globally focused programs and partnerships to multidisciplinary and global-engineering study.",
      },
    ],
  },
  {
    id: "nuclear-engineering",
    name: "Nuclear Engineering",
    degreeTypes: ["BS"],
    description:
      "Design and analyze nuclear systems through reactor physics, radiation, thermal hydraulics, materials, safety, and energy.",
    emphasisAreas: [],
    catalogUrl: `${CATALOG_BASE}/nuclearengineering/`,
    places: [
      {
        placeId: "fulton-hall",
        relevance:
          "Primary home of Nuclear Engineering and Radiation Science faculty, advising, classrooms, and laboratories.",
      },
      {
        placeId: "mstr",
        relevance:
          "Houses Missouri S&T's operating research reactor for hands-on reactor, radiation, and measurement experience.",
      },
      {
        placeId: "mcnutt-hall",
        relevance:
          "Connects nuclear engineering with nuclear materials and advanced materials faculty and laboratories.",
      },
    ],
  },
  {
    id: "petroleum-engineering",
    name: "Petroleum Engineering",
    degreeTypes: ["BS"],
    description:
      "Study subsurface energy resources through reservoir, drilling, production, geology, fluids, and energy systems.",
    emphasisAreas: [],
    catalogUrl: `${CATALOG_BASE}/petroleumengineering/`,
    places: [
      {
        placeId: "mcnutt-hall",
        relevance:
          "Home to Geological and Petroleum Engineering faculty, advising, classrooms, and energy research.",
      },
      {
        placeId: "kennedy-experimental-mine",
        relevance:
          "Provides direct exposure to subsurface conditions, rock behavior, and field-scale geologic systems.",
      },
      {
        placeId: "rock-mechanics-and-explosives-research-center",
        relevance:
          "Connects petroleum engineering with geomechanics, subsurface stress, and rock-response research.",
      },
    ],
  },
  {
    id: "philosophy",
    name: "Philosophy",
    degreeTypes: ["BS"],
    description:
      "Develop rigorous reasoning in ethics, logic, knowledge, technology, science, society, and human values.",
    emphasisAreas: [],
    catalogUrl: `${CATALOG_BASE}/philosophy/`,
    places: [
      {
        placeId: "humanities-and-social-sciences-building",
        relevance:
          "Home to Arts, Languages and Philosophy faculty, advising, classrooms, and the philosophy degree.",
      },
      {
        placeId: "curtis-laws-wilson-library",
        relevance:
          "Provides scholarly collections and research resources for philosophy, ethics, history, and technology studies.",
      },
    ],
  },
  {
    id: "physics",
    name: "Physics",
    degreeTypes: ["BS"],
    description:
      "Study matter, energy, fields, waves, quantum systems, instrumentation, computation, and the physical universe.",
    emphasisAreas: ["Applied Physics", "Geophysics", "Secondary Education"],
    catalogUrl: `${CATALOG_BASE}/physics/`,
    places: [
      {
        placeId: "physics-building",
        relevance:
          "Home to the Physics Department and its teaching, laboratory, and research activity.",
      },
      {
        placeId: "mstr",
        relevance:
          "Provides a campus nuclear and radiation facility relevant to nuclear, particle, detector, and applied physics.",
      },
      {
        placeId: "straumanis-james-hall",
        relevance:
          "Connects physics with materials characterization and condensed-matter research.",
      },
    ],
  },
  {
    id: "psychological-science",
    name: "Psychological Science",
    degreeTypes: ["BA", "BS"],
    description:
      "Study cognition, behavior, neuroscience, health, human factors, organizations, and research methods.",
    emphasisAreas: [
      "Cognition and Neuroscience",
      "Diversity and Inclusion",
      "Health Psychology",
      "Human Factors",
      "Industrial and Organizational Psychology",
      "Secondary Education",
    ],
    catalogUrl: `${CATALOG_BASE}/psychologicalscience/`,
    places: [
      {
        placeId: "humanities-and-social-sciences-building",
        relevance:
          "Home to Psychological Science faculty, advising, classrooms, and research laboratories.",
      },
      {
        placeId: "innovation-lab",
        relevance:
          "Supports collaborative human-centered design and applied work relevant to cognition and human factors.",
      },
    ],
  },
  {
    id: "semiconductor-engineering",
    name: "Semiconductor Engineering",
    degreeTypes: ["BS"],
    description:
      "Integrate devices, fabrication, materials, circuits, chemistry, physics, and computing for semiconductor technology.",
    emphasisAreas: [
      "Semiconductor Device Engineering",
      "Semiconductor Process Engineering",
    ],
    catalogUrl: `${CATALOG_BASE}/semiconductorengineering/`,
    places: [
      {
        placeId: "emerson-electric-company-hall",
        relevance:
          "Connects semiconductor device study with electrical engineering, electronics, circuits, and computer engineering.",
      },
      {
        placeId: "mcnutt-hall",
        relevance:
          "Connects semiconductor processing with materials science, structure, properties, and characterization.",
      },
      {
        placeId: "bertelsmeyer-hall",
        relevance:
          "Supports the chemical-process foundation used in semiconductor fabrication.",
      },
      {
        placeId: "physics-building",
        relevance:
          "Provides the solid-state, quantum, optics, and device-physics foundation of semiconductor engineering.",
      },
      {
        placeId: "straumanis-james-hall",
        relevance:
          "Houses advanced materials research and characterization relevant to semiconductor materials and devices.",
      },
    ],
  },
];

const placeById = new Map(campusPlaces.map(place => [place.id, place]));

const accessProgramIdsByPlaceId = degreeTourPrograms.reduce<Map<string, string[]>>(
  (access, program) => {
    for (const { placeId } of program.places) {
      const programIds = access.get(placeId) ?? [];
      programIds.push(program.id);
      access.set(placeId, programIds);
    }
    return access;
  },
  new Map([[DEGREE_TOUR_ROOT_PLACE_ID, degreeTourPrograms.map(program => program.id)]]),
);

function degreesToRadians(value: number) {
  return value * Math.PI / 180;
}

export function distanceBetweenPlaces(
  first: Pick<CampusPlace, "latitude" | "longitude">,
  second: Pick<CampusPlace, "latitude" | "longitude">,
) {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = degreesToRadians(second.latitude - first.latitude);
  const longitudeDelta = degreesToRadians(second.longitude - first.longitude);
  const firstLatitude = degreesToRadians(first.latitude);
  const secondLatitude = degreesToRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(
    earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

function findProgram(programId: string) {
  return degreeTourPrograms.find(program => program.id === programId);
}

export function getDegreeTourProgram(programId: string) {
  return findProgram(programId);
}

export function buildDegreeTourGraph(programId: string): DegreeTourGraph | undefined {
  const program = findProgram(programId);
  if (!program) return undefined;

  const relevanceByPlaceId = new Map(
    program.places.map(place => [place.placeId, place.relevance]),
  );
  const placeIds = [
    DEGREE_TOUR_ROOT_PLACE_ID,
    ...program.places.map(place => place.placeId),
  ];
  const places = placeIds.map(placeId => {
    const place = placeById.get(placeId);
    if (!place) {
      throw new Error(
        `Degree tour "${program.id}" references missing campus place "${placeId}"`,
      );
    }
    return place;
  });

  const candidateEdges = places.flatMap((first, firstIndex) =>
    places.slice(firstIndex + 1).map(second => ({
      firstId: first.id,
      secondId: second.id,
      distanceMeters: distanceBetweenPlaces(first, second),
    })),
  ).sort((first, second) =>
    first.distanceMeters - second.distanceMeters ||
    first.firstId.localeCompare(second.firstId) ||
    first.secondId.localeCompare(second.secondId),
  );

  const parent = new Map(placeIds.map(placeId => [placeId, placeId]));
  const findRoot = (placeId: string): string => {
    const parentId = parent.get(placeId);
    if (!parentId || parentId === placeId) return placeId;
    const rootId = findRoot(parentId);
    parent.set(placeId, rootId);
    return rootId;
  };
  const neighbors = new Map<string, DegreeTourGraphNeighbor[]>(
    placeIds.map(placeId => [placeId, []]),
  );

  let edgeCount = 0;
  for (const edge of candidateEdges) {
    const firstRoot = findRoot(edge.firstId);
    const secondRoot = findRoot(edge.secondId);
    if (firstRoot === secondRoot) continue;
    parent.set(secondRoot, firstRoot);
    neighbors.get(edge.firstId)?.push({
      nodeId: edge.secondId,
      distanceMeters: edge.distanceMeters,
    });
    neighbors.get(edge.secondId)?.push({
      nodeId: edge.firstId,
      distanceMeters: edge.distanceMeters,
    });
    edgeCount += 1;
    if (edgeCount === placeIds.length - 1) break;
  }

  const route = [DEGREE_TOUR_ROOT_PLACE_ID];
  const remainingPlaceIds = new Set(
    placeIds.filter(placeId => placeId !== DEGREE_TOUR_ROOT_PLACE_ID),
  );
  while (remainingPlaceIds.size > 0) {
    const currentPlace = placeById.get(route[route.length - 1]);
    if (!currentPlace) break;
    const nextPlaceId = [...remainingPlaceIds].sort((firstId, secondId) => {
      const firstPlace = placeById.get(firstId);
      const secondPlace = placeById.get(secondId);
      if (!firstPlace || !secondPlace) return firstId.localeCompare(secondId);
      return (
        distanceBetweenPlaces(currentPlace, firstPlace) -
          distanceBetweenPlaces(currentPlace, secondPlace) ||
        firstId.localeCompare(secondId)
      );
    })[0];
    const nextPlace = placeById.get(nextPlaceId);
    if (!nextPlace) break;
    const routeDistance = distanceBetweenPlaces(currentPlace, nextPlace);
    if (!(neighbors.get(currentPlace.id) ?? []).some(edge => edge.nodeId === nextPlace.id)) {
      neighbors.get(currentPlace.id)?.push({
        nodeId: nextPlace.id,
        distanceMeters: routeDistance,
      });
      neighbors.get(nextPlace.id)?.push({
        nodeId: currentPlace.id,
        distanceMeters: routeDistance,
      });
    }
    route.push(nextPlaceId);
    remainingPlaceIds.delete(nextPlaceId);
  }

  const nodes = places.map(place => ({
    id: place.id,
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    accessProgramIds: accessProgramIdsByPlaceId.get(place.id) ?? [],
    relevance:
      place.id === DEGREE_TOUR_ROOT_PLACE_ID
        ? "Every degree tour begins at Havener Center, the central campus meeting point."
        : relevanceByPlaceId.get(place.id) ?? place.description,
    neighbors: [...(neighbors.get(place.id) ?? [])].sort((first, second) =>
      first.distanceMeters - second.distanceMeters ||
      first.nodeId.localeCompare(second.nodeId),
    ),
  }));

  return {
    campusId: MISSOURI_S_AND_T_CAMPUS_ID,
    programId,
    rootNodeId: DEGREE_TOUR_ROOT_PLACE_ID,
    strategy: "best-first-proximity",
    nodes,
    route,
  };
}
