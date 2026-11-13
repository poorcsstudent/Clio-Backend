import assert from "node:assert/strict";
import test from "node:test";

import { campusPlaces } from "./campusPlaces";
import { getTourStopsForTour, tours } from "./campuses";
import {
  buildDegreeTourGraph,
  DEGREE_TOUR_ROOT_PLACE_ID,
  degreeTourPrograms,
  type DegreeTourGraphNode,
} from "./degreeTours";

test("catalog defines one route for every undergraduate degree field", () => {
  assert.equal(degreeTourPrograms.length, 33);
  assert.equal(new Set(degreeTourPrograms.map(program => program.id)).size, 33);
  assert.equal(
    tours.filter(tour => tour.audience === "undergraduate-degree").length,
    33,
  );
  for (const program of degreeTourPrograms) {
    assert.match(program.catalogUrl, /^https:\/\/catalog\.mst\.edu\//);
    assert.ok(program.description.length > 40);
    assert.ok(program.places.length > 0);
  }
});

test("every degree building resolves to an official campus-map place", () => {
  const campusPlaceIds = new Set(campusPlaces.map(place => place.id));
  for (const program of degreeTourPrograms) {
    for (const programPlace of program.places) {
      assert.ok(
        campusPlaceIds.has(programPlace.placeId),
        `${program.id} references missing place ${programPlace.placeId}`,
      );
      assert.ok(programPlace.relevance.length > 30);
    }
  }
});

test("every degree graph starts at Havener and reaches only permitted nodes", () => {
  for (const program of degreeTourPrograms) {
    const graph = buildDegreeTourGraph(program.id);
    assert.ok(graph);
    assert.equal(graph.rootNodeId, DEGREE_TOUR_ROOT_PLACE_ID);
    assert.equal(graph.route[0], DEGREE_TOUR_ROOT_PLACE_ID);
    assert.equal(graph.route.length, program.places.length + 1);
    assert.deepEqual(
      new Set(graph.route),
      new Set([
        DEGREE_TOUR_ROOT_PLACE_ID,
        ...program.places.map(place => place.placeId),
      ]),
    );
    for (const node of graph.nodes) {
      assert.ok(
        node.accessProgramIds.includes(program.id),
        `${node.id} does not grant access to ${program.id}`,
      );
      for (const neighbor of node.neighbors) {
        const reverseNode: DegreeTourGraphNode | undefined = graph.nodes.find(
          (candidate: DegreeTourGraphNode) => candidate.id === neighbor.nodeId,
        );
        assert.ok(reverseNode);
        assert.ok(
          reverseNode.neighbors.some(
            (candidate: { nodeId: string }) => candidate.nodeId === node.id,
          ),
          `${node.id} -> ${neighbor.nodeId} is not reciprocal`,
        );
      }
    }
  }
});

test("program-specific stop order is contiguous and uses contextual relevance", () => {
  const computerScienceStops = getTourStopsForTour("computer-science");
  assert.equal(computerScienceStops[0]?.id, DEGREE_TOUR_ROOT_PLACE_ID);
  assert.deepEqual(
    computerScienceStops.map(stop => stop.order),
    [1, 2, 3],
  );
  assert.deepEqual(
    new Set(computerScienceStops.map(stop => stop.id)),
    new Set([
      "havener-center",
      "computer-science-building",
      "kummer-student-design-center",
    ]),
  );
  assert.match(
    computerScienceStops.find(stop => stop.id === "computer-science-building")
      ?.relevance ?? "",
    /Computer Science Department/i,
  );
  assert.ok(
    !computerScienceStops.some(stop => stop.id === "emerson-electric-company-hall"),
  );
});

test("cross-disciplinary programs unlock multiple relevant departments", () => {
  const semiconductorStops = new Set(
    getTourStopsForTour("semiconductor-engineering").map(stop => stop.id),
  );
  for (const placeId of [
    "havener-center",
    "emerson-electric-company-hall",
    "mcnutt-hall",
    "bertelsmeyer-hall",
    "physics-building",
    "straumanis-james-hall",
  ]) {
    assert.ok(semiconductorStops.has(placeId));
  }
});
