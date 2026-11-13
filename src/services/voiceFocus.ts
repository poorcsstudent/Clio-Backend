/** Shared focus for question capture, answers and tour narration. No audio is stored. */
export type VoiceOwner = 'answer' | 'tour' | null;
let owner: VoiceOwner = null;
let questionBusy = false;
const listeners = new Set<() => void>();
function notify() { for (const listener of listeners) listener(); }
export function getVoiceOwner() { return owner; }
export function voiceIsBusy() { return questionBusy || owner !== null; }
export function setQuestionBusy(value: boolean) { questionBusy = value; notify(); }
export function setVoiceOwner(value: VoiceOwner) { owner = value; notify(); }
export function subscribeVoiceFocus(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
