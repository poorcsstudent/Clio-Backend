import { BuildingKnowledge } from "./types";

export const computerScienceBuilding: BuildingKnowledge = {
  id: "computer-science-building",
  name: "Computer Science Building",
  mapNumber: 3,

  summary:
    "A key academic stop for students interested in software, artificial intelligence, cybersecurity, data, and computing systems.",

  departments: ["Computer Science"],
  majors: ["Computer Science", "Software Engineering", "Cybersecurity", "Data Science"],
  labs: ["Programming labs", "Computing research spaces"],
  researchAreas: ["Artificial intelligence", "Cybersecurity", "Software engineering", "Databases", "Systems"],
  studentOrgs: ["ACM", "Cybersecurity clubs", "Programming teams"],

  tourTalkingPoints: [
    "Computer science students focus on programming, algorithms, software systems, AI, cybersecurity, and databases.",
    "This is a core stop for prospective students who want to build software, apps, games, secure systems, or AI tools.",
    "This stop helps explain the difference between Computer Science and Computer Engineering."
  ],

  suggestedQuestions: [
    "What can I study here?",
    "What kinds of projects do computer science students build?",
    "How is computer science different from computer engineering?",
    "Are there AI or cybersecurity opportunities here?"
  ],

  aiContext:
    "Use this building as the main academic anchor for the Computer Science tour. Emphasize software, AI, cybersecurity, programming, research, and career opportunities."
};