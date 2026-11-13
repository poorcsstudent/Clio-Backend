import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraDirectionAnswer } from './cameraDirections';
import type { TourVoiceContext } from './tourGuidance';
const context: TourVoiceContext = { active: true, paused: false, onRoute: true, tourId: 'cs', destinationId: 'cs-building', instruction: 'Use the marked pedestrian crossing.', position: { latitude: 37.95, longitude: -91.77, accuracy: 5, timestamp: 100000 } };
test('camera context never claims facing direction or crossing safety', () => {
  const answer = cameraDirectionAnswer('Havener Center', 'cs', context, 100000);
  assert.match(answer, /may show Havener/); assert.match(answer, /single photo does not establish/); assert.match(answer, /Separately, the mapped route/);
});
test('landmark recognition cannot reroute an off-path user',()=>assert.doesNotMatch(cameraDirectionAnswer('Library','cs',{...context,onRoute:false},100000),/Use the marked/));
test('stale GPS or changed tour cannot supply a turn from a photograph', () => {
  for (const c of [context, { ...context, paused: true }, { ...context, tourId: 'other' }]) assert.doesNotMatch(cameraDirectionAnswer('Havener', 'cs', c, 200000), /Use the marked/);
});
