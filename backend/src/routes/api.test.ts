import assert from "node:assert/strict";
import test from "node:test";
import type { Express } from "express";
import request from "supertest";

process.env.CLIO_JWT_SECRET = "test-jwt-secret-that-is-longer-than-32-chars";
process.env.CLIO_DEVICE_ENROLLMENT_CODE = "test-enrollment-code";
process.env.CLIO_ALLOWED_ORIGINS = "http://localhost:8081";

function getApp() {
  return require("../app").default as Express;
}

test("device enrollment protects the AI route", async () => {
  const app = getApp();

  const unauthenticated = await request(app)
    .post("/ai-guide/question")
    .send({ campusId: "missouri-s-and-t", question: "Where is Havener?" });
  assert.equal(unauthenticated.status, 401);

  const enrollment = await request(app).post("/auth/device-session").send({
    deviceId: "test-device-1234567890",
    enrollmentCode: "test-enrollment-code",
  });
  assert.equal(enrollment.status, 200);
  assert.equal(typeof enrollment.body.accessToken, "string");

  const answer = await request(app)
    .post("/ai-guide/question")
    .set("Authorization", `Bearer ${enrollment.body.accessToken}`)
    .send({ campusId: "missouri-s-and-t", question: "What is the Havener Center?" });
  assert.equal(answer.status, 200);
  assert.equal(answer.body.provider, "retrieval-only");
  assert.match(answer.body.answer, /Havener/i);
  assert.equal(answer.body.sources[0].id, "stop:havener-center");
});

test("invalid enrollment codes are rejected", async () => {
  const app = getApp();
  const response = await request(app).post("/auth/device-session").send({
    deviceId: "test-device-1234567890",
    enrollmentCode: "wrong-enrollment-code",
  });
  assert.equal(response.status, 401);
});

test("degree tour catalog and graph expose Havener-rooted routes", async () => {
  const app = getApp();
  const catalog = await request(app).get("/campuses/missouri-s-and-t/tours");
  assert.equal(catalog.status, 200);
  assert.equal(catalog.body.metadata.degreeProgramCount, 33);
  assert.equal(
    catalog.body.tours.filter(
      (tour: { audience: string }) => tour.audience === "undergraduate-degree",
    ).length,
    33,
  );

  const graph = await request(app).get(
    "/campuses/missouri-s-and-t/tour-graph/computer-science",
  );
  assert.equal(graph.status, 200);
  assert.equal(graph.body.rootNodeId, "havener-center");
  assert.equal(graph.body.route[0], "havener-center");
  assert.deepEqual(
    new Set(graph.body.route),
    new Set([
      "havener-center",
      "computer-science-building",
      "kummer-student-design-center",
    ]),
  );

  const route = await request(app).get(
    "/campuses/missouri-s-and-t/stops?tourId=computer-science",
  );
  assert.equal(route.status, 200);
  assert.equal(route.body[0].id, "havener-center");
  assert.equal(route.body.length, 3);
});

test("tour sessions start at Havener and can be ended", async () => {
  const app = getApp();
  const started = await request(app).post("/tour/start").send({
    campusId: "missouri-s-and-t",
    tourId: "computer-science",
  });

  assert.equal(started.status, 200);
  assert.match(started.body.sessionId, /^tour_/);
  assert.equal(started.body.tour.id, "computer-science");
  assert.equal(started.body.stops[0].id, "havener-center");
  assert.equal(started.body.stopCount, started.body.stops.length);

  const ended = await request(app)
    .post("/tour/end")
    .send({ sessionId: started.body.sessionId });
  assert.equal(ended.status, 200);
  assert.equal(ended.body.status, "ended");
  assert.equal(ended.body.sessionId, started.body.sessionId);
});

test("walking route pilot preserves the Computer Science tour order", async () => {
  const app = getApp();
  const response = await request(app).get(
    "/navigation/walking-route/computer-science?campusId=missouri-s-and-t",
  );

  assert.equal(response.status, 200);
  assert.equal(response.body.tourId, "computer-science");
  assert.equal(response.body.travelMode, "WALK");
  assert.equal(response.body.provider, "clio-campus-pilot");
  assert.equal(response.body.providerConfigured, true);
  assert.equal(response.body.fieldVerified, false);
  assert.ok(response.body.path.length > 50);
  assert.equal(response.body.legs[0].fromStopId, "havener-center");
  assert.equal(response.body.legs[0].toStopId, "computer-science-building");
  assert.equal(response.body.legs[1].toStopId, "kummer-student-design-center");
});

test("iOS installer exposes an Apple over-the-air manifest", async () => {
  const app = getApp();
  const installPage = await request(app)
    .get("/ios/install")
    .set("Host", "api-production-66a9.up.railway.app");

  assert.equal(installPage.status, 200);
  assert.match(installPage.text, /itms-services:\/\/\?action=download-manifest/);
  assert.match(installPage.text, /api-production-66a9\.up\.railway\.app%2Fios%2Fmanifest\.plist/);

  const manifest = await request(app).get("/ios/manifest.plist");
  assert.equal(manifest.status, 200);
  assert.match(manifest.headers["content-type"], /application\/x-plist/);
  assert.match(manifest.text, /com\.cliovision\.guide/);
  assert.match(manifest.text, /software-package/);
  assert.match(manifest.text, /qzu-cG8wPOZbpoLcrv4VkW2nx_M5PLmdByjlUKaxAsE\.ipa/);
  assert.match(manifest.text, /<key>bundle-version<\/key>\s*<string>2<\/string>/);
});
