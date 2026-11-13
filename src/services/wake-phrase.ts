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
export type NativeSpeechStateEvent = native.NativeSpeechStateEvent & { owner: VoiceOwner };
const listeners = new Set<(event: NativeSpeechStateEvent) => void>();
let subscribed = false;
let generation = 0;
let playbackGeneration = 0;
let watchdog: ReturnType<typeof setTimeout> | undefined;
function ensureSpeechEvents() {
  if (subscribed) return;
  subscribed = true;
  native.addNativeSpeechStateListener(event => {
    const owner = event.kind === 'answer' ? getVoiceOwner() : null;
    for (const listener of listeners) listener({ ...event, owner });
    if (event.kind === 'answer' && (event.stage === 'finished' || event.stage === 'cancelled')) {
      clearTimeout(watchdog);
      setVoiceOwner(null);
    }
  });
}
export function addNativeSpeechStateListener(listener: (event: NativeSpeechStateEvent) => void) {
  ensureSpeechEvents(); listeners.add(listener);
  return { remove: () => { listeners.delete(listener); } };
}
async function speak(text: string, owner: Exclude<VoiceOwner, null>) {
  ensureSpeechEvents();
  if (getVoiceOwner()) throw new Error('Another Clio response is still speaking');
  const playback = ++playbackGeneration;
  setVoiceOwner(owner);
  try {
    await native.stopWakePhraseListening();
    if (playback !== playbackGeneration) throw new Error('Speech was cancelled before playback');
    const route = await native.startNativeAnswerSpeech(text);
    if (playback !== playbackGeneration) throw new Error('Speech was cancelled');
    clearTimeout(watchdog);
    watchdog = setTimeout(() => { void stopNativeSpeech().catch(() => undefined); }, Math.max(45000, Math.min(300000, text.length * 90 + 20000)));
    return route;
  } catch (error) { if (playback === playbackGeneration) setVoiceOwner(null); throw error; }
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
  return speak(text, 'tour');
}
export function cancelPendingTourSpeech() { generation++; }
export async function stopNativeSpeech() {
  playbackGeneration++;
  cancelPendingTourSpeech(); clearTimeout(watchdog);
  try { return await native.stopNativeSpeech(); } finally { setVoiceOwner(null); }
}
