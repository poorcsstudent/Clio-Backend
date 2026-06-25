import { BuildingKnowledge } from "./types";

export const havenerCenter: BuildingKnowledge = {
  id: "havener-center",
  name: "Havener Center",
  mapNumber: 51,

  summary:
    "A central student-life hub for dining, events, meetings, campus resources, and everyday student activity.",

  departments: [],
  majors: [],
  labs: [],
  researchAreas: [],
  studentOrgs: ["Student organizations", "Campus activities groups"],

  tourTalkingPoints: [
    "Havener Center is a major student-life stop.",
    "Students may come here for food, events, meetings, and campus activities.",
    "This stop helps balance academic tour content with everyday campus life."
  ],

  suggestedQuestions: [
    "What do students do here?",
    "Are there clubs and organizations here?",
    "Is this a common place to eat or study?"
  ],

  aiContext:
    "Use this building to explain campus life, student organizations, dining, events, and the non-academic side of the student experience."
};