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
    description: "A sample campus for AI-powered walking tours."
  }
];

export const tourStops = [
  {
    id: "havener-center",
    campusId: "missouri-s-and-t",
    name: "Havener Center",
    tourTags: ["general-campus-life"],
    order: 1,
    description: "A central student hub for dining, events, and campus activities.",
    latitude: 37.9547,
    longitude: -91.7756
  },
  {
    id: "computer-science-building",
    campusId: "missouri-s-and-t",
    name: "Computer Science Department",
    tourTags: ["computer-science", "computer-engineering"],
    order: 2,
    description: "A key stop for students interested in CS, AI, cybersecurity, software, and computing research.",
    latitude: 37.9542,
    longitude: -91.7745,
    funFacts: [
      "Example fun fact about this stop."
    ],
    talkingPoints: [
      "What students usually do here.",
      "Why this stop matters for the selected tour."
    ],
    suggestedQuestions: [
      "What classes would I take here?",
      "What do students usually do in this building?"
    ],
    audioScript:
      "Welcome to this stop. This is the short spoken tour-guide script users would hear through the phone or Meta glasses."
  },
  {
    id: "electrical-computer-engineering",
    campusId: "missouri-s-and-t",
    name: "Electrical and Computer Engineering",
    tourTags: ["electrical-engineering", "computer-engineering"],
    order: 3,
    description: "A major stop for students interested in electronics, embedded systems, circuits, and computer hardware.",
    latitude: 37.9541,
    longitude: -91.7742
  },
  {
    id: "engineering-management",
    campusId: "missouri-s-and-t",
    name: "Engineering Management",
    tourTags: ["engineering-management"],
    order: 4,
    description: "A stop focused on systems thinking, management, operations, and technical leadership.",
    latitude: 37.9538,
    longitude: -91.7751
  },
  {
    id: "residential-commons",
    campusId: "missouri-s-and-t",
    name: "Residential Commons",
    tourTags: ["general-campus-life"],
    order: 5,
    description: "A housing area for students living on campus.",
    latitude: 37.9538,
    longitude: -91.7764
  }
];
