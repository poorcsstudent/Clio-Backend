/** Render only known states, never arbitrary server text or error details. */
export function describeAiStatus(value: unknown): string {
  const data = value as { configured?: unknown; observation?: { lastOutcome?: unknown; recent?: unknown } } | null;
  if (!data || typeof data.configured !== 'boolean' || !data.observation) {
    return 'AI observations are unavailable on this backend version.';
  }
  const configured = data.configured ? 'AI credentials are configured.' : 'AI credentials are not configured.';
  const outcome = data.observation.lastOutcome;
  if (data.observation.recent !== true) return `${configured} No recent request observation; provider operation is unconfirmed.`;
  const descriptions: Record<string, string> = {
    'provider-response': 'A recent question received a provider response.',
    'retrieval-only': 'The latest question used campus retrieval only, not a provider answer.',
    'request-failed': 'The latest question request failed. This does not identify the cause.',
  };
  return `${configured} ${typeof outcome === 'string' && Object.hasOwn(descriptions, outcome)
    ? descriptions[outcome] : 'Provider operation is unconfirmed.'}`;
}
