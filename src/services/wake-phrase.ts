export {
  addWakePhraseCommandListener,
  addWakePhraseDetectedListener,
  addWakePhraseDiagnosticListener,
  addWakePhraseStateListener,
  getWakePhraseState,
  initialWakePhraseState,
  prepareWakePhrasePlaybackRoute,
  requestWakePhrasePermissions,
  startWakePhraseListening,
  stopWakePhraseListening,
  type NativeSpeechKind,
  type NativeSpeechStage,
  type WakePhraseMode,
  type WakePhraseDiagnosticEvent,
  type WakePhrasePlaybackRoute,
  type WakePhraseState,
} from '../../modules/clio-meta-wearables';

import * as native from '../../modules/clio-meta-wearables';
import { getVoiceOwner, setVoiceOwner, voiceIsBusy, type VoiceOwner } from './voiceFocus';
import { createSpeechEventGate } from './speechEventGate';
export type NativeSpeechStateEvent = native.NativeSpeechStateEvent & { owner: VoiceOwner };
const listeners = new Set<(event: NativeSpeechStateEvent) => void>();
let subscribed = false;
let generation = 0;
let playbackGeneration = 0;
const speechEvents = createSpeechEventGate();
let stopping: Promise<boolean> | null = null;
let lastSpeechEvent: native.NativeSpeechStateEvent | null = null;
let watchdog: ReturnType<typeof setTimeout> | undefined;
function ensureSpeechEvents() {
  if (subscribed) return;
  subscribed = true;
  native.addNativeSpeechStateListener(event => {
    if (event.kind === 'answer' && !speechEvents.accepts(event.requestId)) return;
    if (event.kind === 'answer') lastSpeechEvent = event;
    const owner = event.kind === 'answer' ? getVoiceOwner() : null;
    if (event.kind === 'answer' && (event.stage === 'finished' || event.stage === 'cancelled')) {
      speechEvents.finish(event.requestId);
      clearTimeout(watchdog);
      setVoiceOwner(null);
    }
    for (const listener of listeners) listener({ ...event, owner });
  });
}
export function addNativeSpeechStateListener(listener: (event: NativeSpeechStateEvent) => void) {
  ensureSpeechEvents(); listeners.add(listener);
  return { remove: () => { listeners.delete(listener); } };
}
async function speak(text: string, owner: Exclude<VoiceOwner, null>, allowed = () => true) {
  ensureSpeechEvents();
  const preparationGeneration = playbackGeneration;
  if (stopping) await stopping;
  if (preparationGeneration !== playbackGeneration || !allowed()) throw new Error('Speech was cancelled before preparation');
  if (getVoiceOwner()) throw new Error('Another Clio response is still speaking');
  const playback = ++playbackGeneration;
  const requestId = `clio-${Date.now()}-${playback}`;
  speechEvents.begin(requestId);
  setVoiceOwner(owner);
  try {
    await native.stopWakePhraseListening();
    if (playback !== playbackGeneration) throw new Error('Speech was cancelled before playback');
    const route = await native.startNativeAnswerSpeech(text, requestId);
    if (playback !== playbackGeneration) throw new Error('Speech was cancelled');
    clearTimeout(watchdog);
    if (speechEvents.accepts(requestId)) watchdog = setTimeout(() => { void stopNativeSpeech().catch(() => undefined); }, Math.max(45000, Math.min(300000, text.length * 90 + 20000)));
    return route;
  } catch (error) { if (playback === playbackGeneration) { speechEvents.cancel(); setVoiceOwner(null); } throw error; }
}
export function startNativeAnswerSpeech(text: string) { return speak(text, 'answer'); }
/** One replaceable pending tour utterance. Never play stale directions after a question. */
export async function startTourSpeech(text: string, valid: () => boolean = () => true) {
  const token = ++generation, expires = Date.now() + 30000;
  while (voiceIsBusy()) {
    if (token !== generation || !valid() || Date.now() >= expires) return null;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (token !== generation || !valid() || Date.now() >= expires) return null;
  return speak(text, 'tour', () => token === generation && valid() && Date.now() < expires);
}
export function cancelPendingTourSpeech() { generation++; }
export function stopNativeSpeech() {
  const requestId = speechEvents.current();
  const owner = getVoiceOwner();
  const cancelledEvent: NativeSpeechStateEvent | null = requestId && owner ? {
    ...(lastSpeechEvent?.requestId === requestId ? lastSpeechEvent : { input: '', outputs: [], bluetoothAvailable: false, bluetoothSelected: false }),
    requestId, owner, kind: 'answer', stage: 'cancelled', message: 'Playback cancelled by the app.',
  } : null;
  playbackGeneration++;
  cancelPendingTourSpeech(); clearTimeout(watchdog);
  if (stopping) return stopping;
  stopping = native.stopNativeSpeech().then(result => {
    // Native cancellation may arrive much later (or never for a queued utterance).
    // Tell the original owner once, only after the native stop succeeds. If stop
    // fails, retain focus and accept its eventual terminal event or a retry.
    if (cancelledEvent && speechEvents.finish(requestId)) {
      setVoiceOwner(null);
      for (const listener of listeners) listener(cancelledEvent);
    }
    return result;
  }).finally(() => { stopping = null; });
  return stopping;
}
