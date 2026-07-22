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
