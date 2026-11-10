// Local-only prototype. Uses the compiled repository data; no credentials or writes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { campusPlaces } = require('../backend/dist/data/campusPlaces');
const { degreeTourPrograms } = require('../backend/dist/data/degreeTours');
const html = fs.readFileSync(path.join(__dirname, '../preview/interests.html'));
http.createServer((req, res) => {
  if (req.url === '/data') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ places: campusPlaces, programs: degreeTourPrograms }));
  } else if (req.url === '/' || req.url === '/interests') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
  } else { res.writeHead(404); res.end('Not found'); }
}).listen(4174, '127.0.0.1', () => console.log('Interest preview: http://localhost:4174/interests'));
