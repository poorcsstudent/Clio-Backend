import OpenAI from "openai";

import { config, providerBaseUrl, providerKey } from "../config";
import { retrieveCampusKnowledge } from "./knowledge";

let client: OpenAI | null = null;

function getClient() {
  const apiKey = providerKey(config.aiProvider);
  if (!apiKey) return null;
  client ??= new OpenAI({ apiKey, baseURL: providerBaseUrl(config.aiProvider) });
  return client;
}

function spokenExcerpt(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function answerCampusQuestion(input: {
  question: string;
  campusId: string;
  currentStopId?: string;
}) {
  const sources = retrieveCampusKnowledge(
    input.question,
    input.campusId,
    input.currentStopId,
  );

  if (sources.length === 0) {
    return {
      answer: "I don't have that information in the campus guide yet.",
      provider: "retrieval-only" as const,
      sources,
    };
  }

  const openai = getClient();
  if (!openai) {
    return {
      answer: spokenExcerpt(`${sources[0].title}: ${sources[0].content}`),
      provider: "retrieval-only" as const,
      sources,
    };
  }

  const context = sources
    .map(source => `[${source.id}] ${source.title}\n${source.content}`)
    .join("\n\n");

  const usesGroqGptOss = config.aiProvider === "groq"
    && config.aiModel.startsWith("openai/gpt-oss-");

  const response = await openai.chat.completions.create({
    model: config.aiModel,
    temperature: usesGroqGptOss ? 0.6 : 0.2,
    max_completion_tokens: usesGroqGptOss ? 1_024 : 120,
    ...(usesGroqGptOss ? { reasoning_effort: "low" as const } : {}),
    messages: [
      {
        role: "system",
        content: [
          "You are Clio, a concise and friendly spoken campus tour guide.",
          "Answer only from the supplied campus context.",
          "If the context is insufficient, say that the campus guide does not have that information yet.",
          "Never invent dates, statistics, directions, building access, safety details, or admissions facts.",
          "Keep the answer under 180 characters so it can be spoken through smart glasses.",
        ].join(" "),
      },
      {
        role: "user",
        content: `Campus context:\n${context}\n\nVisitor question: ${input.question}`,
      },
    ],
  });

  const answer = response.choices[0]?.message.content;

  return {
    answer: answer
      ? spokenExcerpt(answer)
      : spokenExcerpt(`${sources[0].title}: ${sources[0].content}`),
    provider: config.aiProvider,
    sources,
  };
}
