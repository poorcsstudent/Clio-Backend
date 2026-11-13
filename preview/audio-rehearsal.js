/* Local simulation using the same pure guidance, command and arrival code as the app. */
const $ = id => document.getElementById(id);
let route, stops, legIndex = 0, stepIndex = 0, clock = Date.now(), tracker, arrival;
let active = false, paused = false, fix = null, onRoute = true, lastCue = '', uncertain = false;
function log(text) { const li = document.createElement('li'); li.textContent = text; $('events').prepend(li); while ($('events').children.length > 30) $('events').lastChild.remove(); }
function say(text) { lastCue = text; $('cue').textContent = text; log(text); if ($('audio').checked && 'speechSynthesis' in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } }
function currentLeg() { return route.legs[legIndex]; }
function resetLeg() { tracker = ClioRehearsal.createGuidanceTracker(); arrival = ClioRehearsal.createArrivalTracker(); stepIndex = 0; uncertain = false; onRoute = true; fix = null; render(); }
function render() {
  $('status').textContent = !active ? 'Rehearsal ended · no device sensors used' : paused ? 'Paused · simulated location updates stopped' : uncertain ? 'Position uncertain · turn prompts held' : !fix ? 'Waiting for a fresh simulated GPS fix' : `Leg ${legIndex + 1}/${route.legs.length} · simulated GPS ±5 m`;
  $('destination').textContent = active ? `Next: ${stops.find(s => s.id === currentLeg().toStopId).name}` : 'Ready at Havener';
  for (const id of ['next','uncertain','recover','offroute','arrive']) $(id).disabled = !active || paused;
  $('send').disabled = !active;
  $('steps').replaceChildren();
  if (active) for (const step of currentLeg().steps) { const li = document.createElement('li'); li.textContent = `${step.kind || 'path'} · ${step.distanceMeters} m · ${step.instruction}`; $('steps').append(li); }
}
function checkpoint(advance = false) {
  if (!active || paused) return;
  if (advance) stepIndex = Math.min(stepIndex + 1, currentLeg().steps.length - 1);
  const step = currentLeg().steps[stepIndex];
  const point = step.path[Math.min(step.path.length - 1, Math.max(1, Math.floor(step.path.length / 2)))];
  clock += 15000; fix = { ...point, accuracy: uncertain ? 90 : 5, timestamp: clock };
  const result = tracker(currentLeg().steps, fix, clock);
  if (result.cue) say(result.cue); else log(result.uncertain ? 'Uncertain fix: no turn cue, no route advancement.' : 'Quiet checkpoint: no repeated cue.');
  render();
}
$('start').onclick = async () => {
  $('start').disabled = true;
  try {
    const response = await fetch('/rehearsal-route?tour=' + encodeURIComponent($('tour').value));
    if (!response.ok) throw Error(await response.text());
    ({ route, stops } = await response.json()); active = true; paused = false; legIndex = 0; clock = Date.now(); resetLeg();
    log(`Loaded real geographic route: ${route.distanceMeters} m; illustration not used for turns. Havener arrival is assumed for this simulation.`); checkpoint();
  } catch (error) { say(error.message); } finally { $('start').disabled = false; }
};
$('next').onclick = () => checkpoint(true);
$('uncertain').onclick = () => { uncertain = true; checkpoint(); say('Position is uncertain. Walking turn prompts are on hold. Follow posted pedestrian signs and wait for GPS to recover after leaving a tunnel.'); };
$('recover').onclick = () => { uncertain = false; onRoute = true; checkpoint(); };
$('offroute').onclick = () => {
  onRoute = false; uncertain = false;
  for (let n = 0; n < 3; n++) { clock += 15000; fix = { ...currentLeg().path[0], latitude: currentLeg().path[0].latitude + .01, accuracy: 5, timestamp: clock }; const result = tracker(currentLeg().steps, fix, clock); if (result.cue) say(result.cue); }
  $('status').textContent = 'Off-route simulation · no shortcut or automatic road crossing';
};
function nextLeg(skipped = false) {
  if (legIndex + 1 >= route.legs.length) { active = false; say(skipped ? 'Last stop skipped. Tour ended.' : 'Rehearsal tour complete. Physical walking tests are still required.'); render(); return; }
  legIndex++; resetLeg(); say(skipped ? 'Stop skipped, not recorded as an arrival. Waiting for a fresh location.' : 'Arrival confirmed by simulated dwell. The next leg is ready.');
}
$('arrive').onclick = () => {
  if (uncertain || !onRoute) { say('Arrival held: reliable on-route position is required.'); return; }
  let arrived = false;
  for (let n = 0; n < 3; n++) { clock += 4000; arrived = arrival(5, 5, clock, clock); log(`Arrival sample ${n + 1}: ${arrived ? 'eight-second dwell confirmed' : 'not enough dwell yet'}`); }
  if (arrived) nextLeg();
};
function context() { return { active, paused, tourId: route.tourId, destinationId: currentLeg().toStopId, instruction: currentLeg().steps[stepIndex].instruction, position: fix, onRoute }; }
function command() {
  if (!active) return;
  const parsed = ClioRehearsal.parseTourCommand($('command').value); $('command').value = '';
  if (!parsed) { say('That is a campus question, not a tour command. AI requests are disabled in this local rehearsal.'); return; }
  if (parsed === 'pause') { paused = true; arrival = ClioRehearsal.createArrivalTracker(); say('Tour paused. Location tracking and automatic cues are stopped.'); }
  else if (parsed === 'resume') { paused = false; fix = null; tracker = ClioRehearsal.createGuidanceTracker(stepIndex); say('Tour resumed. Waiting for a fresh, precise location before walking cues.'); }
  else if (parsed === 'end') { active = false; say('Tour ended. Location tracking stopped.'); }
  else if (parsed === 'skip') { nextLeg(true); return; }
  else if (parsed === 'camera-directions') { say('Mock camera result — no image captured. ' + ClioRehearsal.cameraDirectionAnswer('Havener Center', route.tourId, context(), clock)); }
  else if (paused) say('The tour is paused. Say resume the tour when ready.');
  else if (!fix || !ClioRehearsal.reliableGuidanceFix(fix, clock) || !onRoute) say('Position is uncertain or off the mapped path. I will not guess a turn. Check posted signs from a suitable place.');
  else if (parsed === 'repeat') say(lastCue);
  else if (parsed === 'distance') say(`This full geographic leg is approximately ${currentLeg().distanceMeters} meters. This rehearsal does not measure your live remaining distance.`);
  else say(currentLeg().steps[stepIndex].instruction + ' Left and right refer to travel along the mapped path, not a measured facing direction.');
  render();
}
$('send').onclick = command; $('command').onkeydown = event => { if (event.key === 'Enter') command(); };
