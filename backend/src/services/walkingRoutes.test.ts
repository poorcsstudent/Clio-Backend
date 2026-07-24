import assert from "node:assert/strict";
import test from "node:test";

import { getTourStopsForTour } from "../data/campuses";
import { createFallbackWalkingRoute } from "./walkingRoutes";

test("fallback walking routes preserve degree-tour stop order", () => {
  const stops = getTourStopsForTour("computer-science");
  const route = createFallbackWalkingRoute("computer-science", stops);

  assert.equal(route.provider, "clio-coordinate-fallback");
  assert.equal(route.legs.length, stops.length - 1);
  assert.equal(route.legs[0].fromStopId, "havener-center");
  assert.equal(route.legs[0].toStopId, "computer-science-building");
  assert.equal(route.legs[1].toStopId, "kummer-student-design-center");
  assert.ok(route.distanceMeters > 0);
});
