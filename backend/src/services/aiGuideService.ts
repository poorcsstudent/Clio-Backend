import OpenAI from "openai";
import { getBuildingKnowledgeById } from "../data/buildings";
import { getLocationById } from "../data/campusLocations";
import { AIResponse } from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type AnswerQuestionInput = {
  question: string;
  campusId: string;
  currentStopId: string;
};

export async function answerQuestion({
  question,
  campusId,
  currentStopId
}: AnswerQuestionInput): Promise<AIResponse> {
  const location = getLocationById(currentStopId);

  if (!location) {
    return {
      speech: "I could not find that campus stop.",
      shortAnswer: "Location not found.",
      suggestedQuestions: [],
      recommendedStops: []
    };
  }

  const knowledge = getBuildingKnowledgeById(currentStopId);

  if (!knowledge) {
    return {
      speech: `You are currently at ${location.name}. I do not have detailed knowledge for this stop yet.`,
      shortAnswer: `${location.name} is part of the ${location.category} category.`,
      suggestedQuestions: [],
      recommendedStops: location.nearbyStops
    };
  }

  const prompt = `
You are ClioVision, an AI-powered campus tour guide.

Personality:
- Friendly, clear, and excited like a student ambassador.
- Keep answers under 90 words.
- Do not invent facts.
- If the information is not in the provided context, say you do not know yet.

Campus ID: ${campusId}
Current stop: ${knowledge.name}
Map number: ${knowledge.mapNumber}

Summary:
${knowledge.summary}

Departments:
${knowledge.departments?.join(", ") || "Unknown"}

Majors:
${knowledge.majors?.join(", ") || "Unknown"}

Labs:
${knowledge.labs?.join(", ") || "Unknown"}

Research areas:
${knowledge.researchAreas?.join(", ") || "Unknown"}

Talking points:
${knowledge.tourTalkingPoints.join("\n")}

User question:
${question}

Answer naturally for a campus tour visitor.
`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4
  });

  const answer =
    completion.choices[0]?.message?.content ||
    "I could not generate an answer right now.";

  return {
    speech: answer,
    shortAnswer: answer,
    suggestedQuestions: knowledge.suggestedQuestions,
    recommendedStops: location.nearbyStops
  };
}