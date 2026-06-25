import { BuildingKnowledge } from "./types";

export const emersonElectricHall: BuildingKnowledge = {
  id: "emerson-electric-company-hall",
  name: "Emerson Electric Company Hall",
  mapNumber: 4,

  summary:
    "A major engineering and technology-focused academic stop connected to electrical engineering, computer engineering, embedded systems, and hardware-oriented computing.",

  departments: ["Electrical Engineering", "Computer Engineering"],
  majors: ["Electrical Engineering", "Computer Engineering"],
  labs: ["Electronics labs", "Embedded systems labs", "Hardware labs"],
  researchAreas: ["Circuits", "Embedded systems", "Power systems", "Computer hardware", "Electronics"],

  tourTalkingPoints: [
    "This is an important stop for students interested in electronics, embedded systems, circuits, and hardware.",
    "Computer Engineering overlaps with both Computer Science and Electrical Engineering.",
    "This stop helps visitors understand how software connects to physical devices and systems."
  ],

  suggestedQuestions: [
    "What is computer engineering?",
    "How does this connect to computer science?",
    "What kind of hardware projects happen here?"
  ],

  aiContext:
    "Use this building to explain the overlap between CS, CompE, and EE. Focus on embedded systems, hardware, circuits, and software-hardware integration."
};