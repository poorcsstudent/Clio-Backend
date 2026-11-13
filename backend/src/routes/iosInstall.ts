import { Router } from "express";

const router = Router();

const iosArtifactUrl =
  "https://expo.dev/artifacts/eas/qzu-cG8wPOZbpoLcrv4VkW2nx_M5PLmdByjlUKaxAsE.ipa";

router.get("/manifest.plist", (_req, res) => {
  res.set({
    "Cache-Control": "no-store",
    "Content-Disposition": "inline; filename=ClioVision-manifest.plist",
  });
  res.type("application/x-plist").send(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>items</key>
  <array>
    <dict>
      <key>assets</key>
      <array>
        <dict>
          <key>kind</key>
          <string>software-package</string>
          <key>url</key>
          <string>${iosArtifactUrl}</string>
        </dict>
      </array>
      <key>metadata</key>
      <dict>
        <key>bundle-identifier</key>
        <string>com.cliovision.guide</string>
        <key>bundle-version</key>
        <string>2</string>
        <key>kind</key>
        <string>software</string>
        <key>title</key>
        <string>ClioVision</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>`);
});

router.get("/install", (req, res) => {
  const host = req.get("host") ?? "api-production-66a9.up.railway.app";
  const safeHost = /^[a-z0-9.-]+(?::\d+)?$/i.test(host)
    ? host
    : "api-production-66a9.up.railway.app";
  const manifestUrl = `https://${safeHost}/ios/manifest.plist`;
  const installUrl = `itms-services://?action=download-manifest&amp;url=${encodeURIComponent(manifestUrl)}`;

  res.set("Cache-Control", "no-store");
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Install ClioVision</title>
</head>
<body>
  <main>
    <h1>Install ClioVision</h1>
    <p>This Meta-enabled preview is signed for the registered Clio iPhone.</p>
    <p><a href="${installUrl}">Install ClioVision</a></p>
    <p>If iOS asks for confirmation, tap <strong>Install</strong>.</p>
  </main>
</body>
</html>`);
});

export default router;
