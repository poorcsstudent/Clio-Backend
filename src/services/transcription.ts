export function validateTranscription(value: unknown): { text: string } {
  const text = value && typeof value === 'object' && 'text' in value ? value.text : undefined;
  if (typeof text !== 'string') throw new Error('Clio received an invalid transcription. Please try recording again.');
  const cleaned = text.trim();
  if (cleaned.length < 2) throw new Error('I could not hear a question. Please try recording again.');
  if (cleaned.length > 500) throw new Error('Please ask a shorter question (500 characters or fewer).');
  return { text: cleaned };
}
