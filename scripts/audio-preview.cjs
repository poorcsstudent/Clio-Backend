// Loopback-only rehearsal. No credentials, AI requests, deployment or real location.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('../backend/node_modules/esbuild');
const { createNetworkWalkingRoute } = require('../backend/dist/services/walkingRoutes');
const { campusPlaces } = require('../backend/dist/data/campusPlaces');
const root = path.resolve(__dirname, '..');
const bundle = esbuild.buildSync({ entryPoints: [path.join(root, 'preview/audio-rehearsal-core.ts')], bundle: true, write: false, format: 'iife', globalName: 'ClioRehearsal', platform: 'browser' }).outputFiles[0].text;
const tours = {
  cs: ['havener-center', 'computer-science-building', 'kummer-student-design-center'],
  residential: ['havener-center', 'residential-commons-1'],
  tj: ['havener-center', 'thomas-jefferson-residence-hall'],
};
const routes = new Map();
http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/rehearsal-route') {
    const id = url.searchParams.get('tour');
    if (!Object.hasOwn(tours, id)) { res.writeHead(400); res.end('Unknown rehearsal'); return; }
    try {
      if (!routes.has(id)) {
        const stops = tours[id].map(key => campusPlaces.find(p => p.id === key));
        routes.set(id, { route: createNetworkWalkingRoute(id, stops), stops });
      }
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(routes.get(id)));
    } catch { res.writeHead(422); res.end('The geographic route is unavailable; no straight-line route was substituted.'); }
    return;
  }
  if (url.pathname === '/rehearsal-core.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(bundle); return; }
  const files = { '/': ['preview/audio-rehearsal.html', 'text/html; charset=utf-8'], '/audio-test': ['preview/audio-rehearsal.html', 'text/html; charset=utf-8'], '/audio-rehearsal.js': ['preview/audio-rehearsal.js', 'application/javascript'], '/campus-illustration.png': ['preview/campus-tracing-source.png', 'image/png'] };
  const file = files[url.pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  res.setHeader('Content-Type', file[1]); fs.createReadStream(path.join(root, file[0])).pipe(res);
}).listen(4176, '127.0.0.1', () => console.log('Audio-first rehearsal: http://localhost:4176/audio-test'));
