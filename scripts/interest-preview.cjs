// Local-only prototype. Uses the compiled repository data; no credentials or writes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { campusPlaces } = require('../backend/dist/data/campusPlaces');
const { degreeTourPrograms } = require('../backend/dist/data/degreeTours');
const { createNetworkWalkingRoute } = require('../backend/dist/services/walkingRoutes');
const pedestrianNetwork = require('../backend/dist/data/pedestrian-network.json');
const {createArtworkRoute}=require('./artwork-routing.cjs');
const {graph:artworkGraph}=require('./artwork-preview-network.cjs');
const html = fs.readFileSync(path.join(__dirname, '../preview/interests.html'), 'utf8');
let layout;
async function mapLayout() {
  if (layout) return layout;
  const fetchText = async url => {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error('Official map source unavailable');
    return response.text();
  };
  const [source, csv] = await Promise.all([
    fetchText('https://www.mst.edu/map/overlay-map/'),
    fetchText('https://docs.google.com/spreadsheets/d/1dqRfN1-iXPYBUU8HqviZLcqqDNpkJ6WD35vkQZMmsuw/gviz/tq?tqx=out:csv&gid=0'),
  ]);
  const svg = source.match(/<svg class="mapmap-overlay building-overlay"[\s\S]*?<\/svg>/)?.[0];
  if (!svg) throw Error('Official map layout changed');
  const normalize = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const names = new Map();
  for (const row of csv.split(/\r?\n/)) {
    const cells = [...row.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(m => m[1].replace(/""/g, '"'));
    if (/^\d+$/.test(cells[0])) names.set(cells[0], cells[1]);
  }
  const positions = {};
  const buildings = {};
  for (const match of svg.matchAll(/<g id="location-(\d+)"([\s\S]*?)(?=<g id="location-\d+"|$)/g)) {
    const rectangle = match[2].match(/<rect\b([^>]+)>/);
    if (!rectangle) continue;
    // Attribute boundaries matter: rx (corner radius) is NOT the x coordinate.
    const attrs = Object.fromEntries([...rectangle[1].matchAll(/(?:^|\s)(width|height|x|y)="([\d.]+)"/g)].map(m => [m[1], Number(m[2])]));
    const officialName = names.get(match[1]);
    if (!officialName || !['x','y','width','height'].every(k => Number.isFinite(attrs[k]))) continue;
    const place = campusPlaces.find(p => [p.name, ...(p.aliases || [])].some(n => normalize(n) === normalize(officialName)));
    if (place) {
      positions[place.id] = [1746 - attrs.y - attrs.height / 2, attrs.x + attrs.width / 2];
      buildings[place.id] = { mapNumber: Number(match[1]), officialName,
        latitude: place.latitude, longitude: place.longitude,
        imageX: attrs.x + attrs.width / 2, imageY: attrs.y + attrs.height / 2 };
    }
  }
  if (!positions['havener-center']) throw Error('Havener artwork alignment unavailable');
  layout = { positions, buildings, image: 'https://assets.codepen.io/220427/mapmap-bg_2.png', width: artworkGraph.width, height: artworkGraph.height };
  return layout;
}
http.createServer(async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  if(req.url==='/artwork-network'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(artworkGraph));return;}
  if(req.url==='/walking-network') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(pedestrianNetwork));return;}
  if(req.url==='/walking-route'&&req.method==='POST'){
    try{
      let body='';for await(const chunk of req){body+=chunk;if(body.length>4096){res.writeHead(413);res.end('Request too large');return;}}
      const {stopIds}=JSON.parse(body);
      if(!Array.isArray(stopIds)||stopIds.length<2||stopIds.length>11||stopIds[0]!=='havener-center'||new Set(stopIds).size!==stopIds.length)throw Error('Choose 2–11 distinct stops beginning at Havener.');
      const stops=stopIds.map(id=>campusPlaces.find(p=>p.id===id));if(stops.some(p=>!p))throw Error('Unknown stop.');
      // Routing failure must not erase the requested stops or prevent artwork review.
      let geographicRoute=null,geographicError=null;
      try{geographicRoute=createNetworkWalkingRoute('interest-tour',stops,true);}catch(error){geographicError=error.message;}
      const ordered=geographicRoute?geographicRoute.stopOrder.map(id=>stops.find(s=>s.id===id)):stops;
      const artworkRoute=createArtworkRoute(ordered,await mapLayout(),undefined,!!geographicError);
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify({...artworkRoute,geographicError,
        geographicDistanceMeters:geographicRoute?.distanceMeters??null}));
    }catch(error){res.writeHead(422,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}return;
  }
  if (req.url === '/map-layout') {
    try { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(await mapLayout())); }
    catch { res.writeHead(502); res.end('Official map alignment unavailable. Please retry later.'); }
    return;
  }
  if (req.url === '/data') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ places: campusPlaces, programs: degreeTourPrograms }));
  } else if (req.url === '/' || req.url === '/interests') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } else if (req.url === '/mst-map.js' || req.url === '/interests-app.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(fs.readFileSync(path.join(__dirname, '../preview',req.url.slice(1))));
  } else { res.writeHead(404); res.end('Not found'); }
}).listen(4174, '127.0.0.1', () => console.log('Interest preview: http://localhost:4174/interests'));
