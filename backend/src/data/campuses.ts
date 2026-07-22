export const tours = [
  {
    id: "general-campus-life",
    name: "General Campus Life",
    description: "A broad tour for prospective students and families."
  },
  {
    id: "computer-science",
    name: "Computer Science Tour",
    description: "Focused on CS, software, AI, cybersecurity, and computing spaces."
  },
  {
    id: "computer-engineering",
    name: "Computer Engineering Tour",
    description: "Focused on embedded systems, hardware, software, and computing labs."
  },
  {
    id: "electrical-engineering",
    name: "Electrical Engineering Tour",
    description: "Focused on circuits, power, electronics, and EE research spaces."
  },
  {
    id: "engineering-management",
    name: "Engineering Management Tour",
    description: "Focused on business, management, systems, and engineering leadership."
  }
];

export const campuses = [
  {
    id: "missouri-s-and-t",
    name: "Missouri S&T",
    city: "Rolla",
    state: "MO",
    description: "A public technological research university with academic, research, residential, recreation, and student-support facilities across its Rolla campus."
  }
];

export const tourStops = [
  {
    id: "havener-center",
    campusId: "missouri-s-and-t",
    name: "Havener Center",
    tourTags: ["general-campus-life"],
    order: 1,
    description: "The center of campus, with dining, the S&T Store, student lounge space, conference rooms, and event facilities.",
    address: "1346 N. Bishop Ave., Rolla, MO 65401",
    latitude: 37.954821574023576,
    longitude: -91.776342945712742,
    talkingPoints: [
      "Dining, the S&T Store, student gathering space, and campus events are located here.",
      "The connected Innovation Lab is immediately east of Havener Center."
    ],
    suggestedQuestions: [
      "Where can I eat on campus?",
      "Where is the S&T Store?"
    ],
    audioScript: "This is Havener Center, the center of campus and a primary destination for dining, events, the S&T Store, and student gathering space.",
    sourceUrl: "https://calendar.mst.edu/havener_center_540"
  },
  {
    id: "computer-science-building",
    campusId: "missouri-s-and-t",
    name: "Computer Science Building",
    tourTags: ["computer-science", "computer-engineering"],
    order: 2,
    description: "Home to Missouri S&T's Computer Science Department and Information Technology Services.",
    address: "500 W. 15th St., Rolla, MO 65409",
    latitude: 37.955911606307687,
    longitude: -91.774635922736081,
    funFacts: [
      "The building houses both the Computer Science Department and Information Technology Services."
    ],
    talkingPoints: [
      "Computer science teaching, advising, research, and computing support are centered here.",
      "Relevant study areas include software, artificial intelligence, cybersecurity, and computing systems."
    ],
    suggestedQuestions: [
      "What classes would I take here?",
      "What do students usually do in this building?"
    ],
    audioScript:
      "This is the Computer Science Building, home to the Computer Science Department and Information Technology Services.",
    sourceUrl: "https://calendar.mst.edu/computer_science_building_453"
  },
  {
    id: "electrical-computer-engineering",
    campusId: "missouri-s-and-t",
    name: "Emerson Electric Company Hall",
    tourTags: ["electrical-engineering", "computer-engineering"],
    order: 3,
    description: "Home to Missouri S&T's Electrical and Computer Engineering Department, with teaching and research in areas including embedded systems, energy, electronics, communications, controls, and signal processing.",
    address: "301 W. 16th St., Rolla, MO 65409",
    latitude: 37.956144342651776,
    longitude: -91.772984513371028,
    talkingPoints: [
      "Electrical and computer engineering offices and laboratories are based here.",
      "Research areas include artificial intelligence, cyber-physical systems, energy systems, electromagnetics, and signal processing."
    ],
    suggestedQuestions: [
      "Where is the ECE department?",
      "What does computer engineering study here?"
    ],
    audioScript: "This is Emerson Electric Company Hall, home to Electrical and Computer Engineering at Missouri S&T.",
    sourceUrl: "https://ece.mst.edu/aboutece/contact/"
  },
  {
    id: "engineering-management",
    campusId: "missouri-s-and-t",
    name: "Engineering Management Building",
    tourTags: ["engineering-management"],
    order: 4,
    description: "Home to Missouri S&T's Engineering Management and Systems Engineering Department.",
    address: "600 W. 14th St., Rolla, MO 65409-0370",
    latitude: 37.955315796221868,
    longitude: -91.775096518040229,
    talkingPoints: [
      "Programs here connect engineering, management, systems thinking, operations, and technical leadership."
    ],
    suggestedQuestions: [
      "What is engineering management?",
      "What is systems engineering?"
    ],
    audioScript: "This is the Engineering Management Building, home to Engineering Management and Systems Engineering.",
    sourceUrl: "https://calendar.mst.edu/engineering_management_building_673"
  },
  {
    id: "residential-commons-1",
    campusId: "missouri-s-and-t",
    name: "Residential Commons 1",
    tourTags: ["general-campus-life"],
    order: 5,
    description: "One of the two Residential Commons buildings providing suite-style student housing near the west side of the main campus.",
    address: "710 Tim Bradley Way, Rolla, MO 65401",
    latitude: 37.9556228202308,
    longitude: -91.777494011304753,
    talkingPoints: [
      "Residential Commons offers suite-style rooms with shared living and bathroom spaces."
    ],
    suggestedQuestions: [
      "What are the rooms like?",
      "Where is Residential Commons 2?"
    ],
    audioScript: "This is Residential Commons 1, part of Missouri S&T's suite-style student housing community.",
    sourceUrl: "https://reslife.mst.edu/livingoptions/residencehalls/residentialcommons/"
  }
];
