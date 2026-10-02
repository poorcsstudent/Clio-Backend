export interface DiagnosticSnapshot {
  platform: string;
  paired: boolean;
  glassesConnected: boolean;
  wakeEnabled: boolean;
  nativeSpeechAvailable: boolean;
  phase: string;
  lastRequest: { kind: 'question' | 'camera'; succeeded: boolean; durationMs: number } | null;
}

/** Construct an allowlisted payload. Never serialize raw logs or spread input. */
export function diagnosticSummary(snapshot: DiagnosticSnapshot) {
  const phases = ['checking', 'ready', 'recording', 'pairing', 'thinking', 'speaking', 'transcribing', 'seeing'];
  const request = snapshot.lastRequest;
  return JSON.stringify({
    schema: 'clio-diagnostics-v1',
    platform: ['ios', 'android', 'web'].includes(snapshot.platform) ? snapshot.platform : 'other',
    paired: snapshot.paired === true,
    glassesConnected: snapshot.glassesConnected === true,
    wakeEnabled: snapshot.wakeEnabled === true,
    nativeSpeechAvailable: snapshot.nativeSpeechAvailable === true,
    phase: phases.includes(snapshot.phase) ? snapshot.phase : 'unknown',
    lastRequest: request ? {
      kind: request.kind === 'camera' ? 'camera' : 'question',
      succeeded: request.succeeded === true,
      durationMs: Number.isFinite(request.durationMs) ? Math.max(0, Math.round(request.durationMs)) : null,
    } : null,
    privacy: 'Excludes credentials, transcripts, answers, images, coordinates, device names, and raw logs.',
  }, null, 2);
}
