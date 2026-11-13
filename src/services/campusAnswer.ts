import type { CampusAnswer, KnowledgeSource } from './api';

export function validateCampusAnswer(value: unknown): CampusAnswer {
  const result = value as Partial<CampusAnswer> | null;
  if (!result || typeof result.answer !== 'string' || !result.answer.trim()
    || !['groq', 'openai', 'retrieval-only'].includes(result.provider ?? '')
    || !Array.isArray(result.sources) || !result.sources.every(validSource)) {
    throw new Error('Clio received an incomplete answer. Please ask again.');
  }
  return { answer: result.answer, provider: result.provider!, sources: result.sources };
}

function validSource(value: unknown): value is KnowledgeSource {
  if (!value || typeof value !== 'object') return false;
  const source = value as KnowledgeSource;
  return ['id', 'title', 'campusId', 'content'].every(key =>
    typeof source[key as keyof KnowledgeSource] === 'string')
    && typeof source.score === 'number' && Number.isFinite(source.score);
}
