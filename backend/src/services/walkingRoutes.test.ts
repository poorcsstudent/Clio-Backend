import assert from "node:assert/strict";
import test from "node:test";

import { getTourStopsForTour } from "../data/campuses";
import {
  createFallbackWalkingRoute,
  getCampusWalkingRoute,
} from "./walkingRoutes";

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

test("Computer Science pilot follows curated pedestrian geometry", async () => {
  const stops = getTourStopsForTour("computer-science");
  const route = await getCampusWalkingRoute("computer-science");

  assert.ok(route);
  assert.equal(route.provider, "clio-campus-pilot");
  assert.equal(route.providerConfigured, true);
  assert.equal(route.fieldVerified, false);
  assert.equal(route.legs.length, stops.length - 1);
  assert.equal(route.legs[0].fromStopId, "havener-center");
  assert.equal(route.legs[0].toStopId, "computer-science-building");
  assert.equal(route.legs[1].toStopId, "kummer-student-design-center");
  assert.ok(route.path.length > 50);
  assert.ok(route.distanceMeters > 900);
  assert.ok(route.distanceMeters < 1_100);
  assert.ok(route.legs.every(leg => leg.steps.length >= 4));
  assert.deepEqual(route.legs[0].path[0], {
    latitude: stops[0].latitude,
    longitude: stops[0].longitude,
  });
  assert.deepEqual(route.legs[1].path.at(-1), {
    latitude: stops[2].latitude,
    longitude: stops[2].longitude,
  });
});

test("non-pilot tours retain the coordinate fallback", async () => {
  const route = await getCampusWalkingRoute("general-campus-life");

  assert.ok(route);
  assert.equal(route.provider, "clio-coordinate-fallback");
  assert.equal(route.providerConfigured, false);
  assert.equal(route.fieldVerified, false);
});
