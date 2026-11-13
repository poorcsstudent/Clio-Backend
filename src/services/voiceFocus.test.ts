import test from 'node:test';
import assert from 'node:assert/strict';
import { getVoiceOwner, setQuestionBusy, setVoiceOwner, subscribeVoiceFocus, voiceIsBusy } from './voiceFocus';
test('capture and playback independently keep shared voice focus busy',()=>{
  let changes=0;const remove=subscribeVoiceFocus(()=>changes++);
  setQuestionBusy(true);assert.equal(voiceIsBusy(),true);
  setVoiceOwner('answer');setQuestionBusy(false);assert.equal(voiceIsBusy(),true);
  setVoiceOwner(null);assert.equal(voiceIsBusy(),false);
  setVoiceOwner('tour');assert.equal(getVoiceOwner(),'tour');
  setVoiceOwner(null);remove();assert.equal(changes,6);
});
