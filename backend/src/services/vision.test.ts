import assert from "node:assert/strict";
import test from "node:test";

import { distanceMeters, getVisionCandidates } from "./vision";

test("vision candidates prioritize landmarks nearest the user's coordinates", () => {
  const candidates = getVisionCandidates("missouri-s-and-t", {
    latitude: 37.954821574023576,
    longitude: -91.77634294571274,
  });

  assert.equal(candidates[0]?.id, "havener-center");
  assert.ok(candidates.some(candidate => candidate.id === "computer-science-building"));
  assert.ok(candidates.length <= 24);
});

test("campus distance calculation returns a useful meter estimate", () => {
  const distance = distanceMeters(
    { latitude: 37.954821574023576, longitude: -91.77634294571274 },
    { latitude: 37.95591160630769, longitude: -91.77463592273608 },
  );

  assert.ok(distance > 150 && distance < 250);
});
