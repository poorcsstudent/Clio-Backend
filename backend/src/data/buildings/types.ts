export type BuildingKnowledge = {
    id: string;
    name: string;
    mapNumber: number;
  
    summary: string;
  
    departments?: string[];
    majors?: string[];
    labs?: string[];
    researchAreas?: string[];
    studentOrgs?: string[];
  
    tourTalkingPoints: string[];
    suggestedQuestions: string[];
  
    aiContext: string;
  };