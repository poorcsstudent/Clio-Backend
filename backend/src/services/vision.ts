import OpenAI from "openai";
import { z } from "zod";

import { config, providerBaseUrl, providerKey } from "../config";
import { campusPlaces, type CampusPlace } from "../data/campusPlaces";

export interface CampusViewLocation {
  latitude: number;
  longitude: number;
}

export interface IdentifyCampusViewInput {
  campusId: string;
  image: Buffer;
  mimeType: "image/jpeg" | "image/png";
  location?: CampusViewLocation;
}

const identificationSchema = z.object({
  placeId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  visualEvidence: z.string().trim().max(400).default(""),
});

let client: OpenAI | null = null;

function getClient() {
  const apiKey = providerKey(config.visionProvider);
  if (!apiKey) return null;
  client ??= new OpenAI({ apiKey, baseURL: providerBaseUrl(config.visionProvider) });
  return client;
}

function radians(value: number) {
  return value * Math.PI / 180;
}

export function distanceMeters(
  first: CampusViewLocation,
  second: CampusViewLocation,
) {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude)
    * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function getVisionCandidates(
  campusId: string,
  location?: CampusViewLocation,
) {
  const places = campusPlaces.filter(place => place.campusId === campusId);
  if (!location) return places.slice(0, 80);

  return places
    .map(place => ({
      place,
      distance: distanceMeters(location, place),
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 24)
    .map(item => item.place);
}

function parseModelJson(value: string) {
  const normalized = value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return identificationSchema.parse(JSON.parse(normalized));
}

function excerpt(value: string, maximumLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maximumLength) return normalized;
  return `${normalized.slice(0, maximumLength - 1).trimEnd()}…`;
}

function placeProfile(place: CampusPlace) {
  const history = place.history
    ? excerpt(place.history, 190)
    : "Clio's verified guide does not yet include a construction history for this location.";
  const use = excerpt(place.description, 210);
  const funFacts = place.funFacts?.map(fact => excerpt(fact, 170)) ?? [];
  const answer = [
    `${place.name}.`,
    `History: ${history}`,
    `Today: ${use}`,
    funFacts[0] ? `Fun fact: ${funFacts[0]}` : "",
  ].filter(Boolean).join(" ");

  return { history, use, funFacts, answer };
}

export async function identifyCampusView(input: IdentifyCampusViewInput) {
  const openai = getClient();
  if (!openai) throw new Error("Campus vision is not configured");

  const candidates = getVisionCandidates(input.campusId, input.location);
  if (candidates.length === 0) throw new Error("No campus landmarks are loaded");

  const candidateContext = candidates.map(place => ({
    placeId: place.id,
    name: place.name,
    aliases: place.aliases ?? [],
    category: place.category,
    address: place.address ?? "",
    verifiedDescription: place.description,
    ...(input.location ? {
      distanceFromUserMeters: Math.round(distanceMeters(input.location, place)),
    } : {}),
  }));

  const response = await openai.chat.completions.create({
    model: config.visionModel,
    temperature: 0.1,
    max_completion_tokens: 700,
    response_format: { type: "json_object" },
    messages: [{
      role: "user",
      content: [
        {
          type: "text",
          text: [
            "Identify the Missouri S&T building or landmark in this first-person glasses photo.",
            "Choose only from the supplied candidate list. Use visible signs, architecture, and the optional distance clues.",
            "If the image is unclear or no candidate is defensible, set placeId to null and confidence below 0.45.",
            "Return only JSON with placeId, confidence from 0 to 1, and a short visualEvidence explanation.",
            `Candidates: ${JSON.stringify(candidateContext)}`,
          ].join(" "),
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${input.mimeType};base64,${input.image.toString("base64")}`,
          },
        },
      ],
    }],
  });

  const raw = response.choices[0]?.message.content;
  if (!raw) throw new Error("The vision model returned no identification");
  const identification = parseModelJson(raw);
  const place = identification.placeId
    ? candidates.find(candidate => candidate.id === identification.placeId)
    : undefined;

  if (!place || identification.confidence < 0.45) {
    return {
      answer: "I cannot identify this campus view confidently yet. Face the building entrance or a visible sign and ask me again.",
      identification: {
        placeId: null,
        name: null,
        confidence: identification.confidence,
        visualEvidence: identification.visualEvidence,
      },
      profile: null,
      sources: [],
    };
  }

  const profile = placeProfile(place);
  return {
    answer: excerpt(profile.answer, 580),
    identification: {
      placeId: place.id,
      name: place.name,
      confidence: identification.confidence,
      visualEvidence: identification.visualEvidence,
    },
    profile: {
      history: profile.history,
      use: profile.use,
      funFacts: profile.funFacts,
    },
    sources: [place.sourceUrl, ...(place.factSourceUrls ?? [])].map((sourceUrl, index) => ({
      id: index === 0 ? `place:${place.id}` : `place:${place.id}:fact-${index}`,
      title: index === 0 ? place.name : `${place.name} history`,
      campusId: place.campusId,
      content: [place.description, place.history, ...(place.funFacts ?? [])]
        .filter(Boolean)
        .join(" "),
      score: Math.round(identification.confidence * 100),
      sourceUrl,
    })),
  };
}
