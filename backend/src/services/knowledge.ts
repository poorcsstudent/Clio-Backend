import { campuses, tourStops, tours } from "../data/campuses";
import { campusPlaces } from "../data/campusPlaces";

export interface KnowledgeSource {
  id: string;
  title: string;
  campusId: string;
  content: string;
  score: number;
  sourceUrl?: string;
}

interface KnowledgeDocument extends Omit<KnowledgeSource, "score"> {
  aliases?: string[];
  stopId?: string;
  tokens: string[];
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "at", "be", "can", "do", "for", "from", "how",
  "i", "in", "is", "it", "me", "of", "on", "or", "the", "there", "this",
  "to", "what", "where", "which", "with", "would", "you",
]);

export function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9&]+/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

function includesPhrase(value: string, phrase: string) {
  const normalize = (input: string) => input
    .toLowerCase()
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ` ${normalize(value)} `.includes(` ${normalize(phrase)} `);
}

function document(input: Omit<KnowledgeDocument, "tokens">): KnowledgeDocument {
  return { ...input, tokens: tokenize(`${input.title} ${input.content}`) };
}

const knowledgeDocuments: KnowledgeDocument[] = [
  ...campuses.map(campus =>
    document({
      id: `campus:${campus.id}`,
      title: campus.name,
      campusId: campus.id,
      content: `${campus.description} It is located in ${campus.city}, ${campus.state}.`,
    }),
  ),
  ...tourStops.map(stop =>
    document({
      id: `stop:${stop.id}`,
      stopId: stop.id,
      title: stop.name,
      campusId: stop.campusId,
      content: [
        stop.description,
        stop.funFacts?.length ? `Fun facts: ${stop.funFacts.join(" ")}` : "",
        stop.talkingPoints?.length ? `Talking points: ${stop.talkingPoints.join(" ")}` : "",
        stop.audioScript ? `Tour script: ${stop.audioScript}` : "",
        stop.address ? `Address: ${stop.address}.` : "",
        `Location: ${stop.latitude}, ${stop.longitude}.`,
      ].filter(Boolean).join(" "),
      sourceUrl: stop.sourceUrl,
    }),
  ),
  ...campusPlaces.map(place =>
    document({
      id: `place:${place.id}`,
      title: place.name,
      campusId: place.campusId,
      aliases: place.aliases,
      sourceUrl: place.sourceUrl,
      content: [
        place.description,
        `Category: ${place.category}.`,
        place.address ? `Address: ${place.address}.` : "",
        place.aliases?.length ? `Also known as: ${place.aliases.join(", ")}.` : "",
        `Location: ${place.latitude}, ${place.longitude}.`,
      ].filter(Boolean).join(" "),
    }),
  ),
  ...campuses.flatMap(campus =>
    tours.map(tour =>
      document({
        id: `tour:${campus.id}:${tour.id}`,
        title: tour.name,
        campusId: campus.id,
        content: `${tour.description} Included stops: ${tourStops
          .filter(stop => stop.campusId === campus.id && stop.tourTags.includes(tour.id))
          .map(stop => stop.name)
          .join(", ") || "none currently loaded"}.`,
      }),
    ),
  ),
];

export function retrieveCampusKnowledge(
  question: string,
  campusId: string,
  currentStopId?: string,
  limit = 4,
) {
  const queryTokens = tokenize(question);
  const querySet = new Set(queryTokens);

  return knowledgeDocuments
    .filter(item => item.campusId === campusId)
    .map(item => {
      const matches = item.tokens.filter(token => querySet.has(token));
      const uniqueMatches = new Set(matches).size;
      const titlePhraseBoost = includesPhrase(question, item.title) ? 6 : 0;
      const aliasPhraseBoost = item.aliases?.some(alias => includesPhrase(question, alias))
        ? 6
        : 0;
      const currentStopBoost = item.stopId === currentStopId ? 3 : 0;
      const curatedStopBoost = item.stopId && titlePhraseBoost > 0 ? 3 : 0;
      const stopIntentBoost = item.stopId && querySet.has("building") ? 7 : 0;
      const score =
        uniqueMatches * 2 + matches.length * 0.25 + Math.max(titlePhraseBoost, aliasPhraseBoost)
        + currentStopBoost + curatedStopBoost + stopIntentBoost;
      return { ...item, score };
    })
    .filter(item => item.score > 0 || item.stopId === currentStopId)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ tokens: _tokens, stopId: _stopId, aliases: _aliases, ...source }) => source);
}

export function getKnowledgeStats() {
  return {
    campuses: campuses.length,
    documents: knowledgeDocuments.length,
    places: campusPlaces.length,
    stops: tourStops.length,
    tours: tours.length,
  };
}
