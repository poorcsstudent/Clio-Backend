// Publish only the ODbL OSM layer. Never package S&T KML or aerial imagery.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),dir=path.join(root,'preview/path-review/reference');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'source-manifest.json')));
const source=manifest.sources.find(s=>s.id==='osm');
const raw=fs.readFileSync(path.join(dir,'osm.json'));
if(source.status!=='downloaded'||crypto.createHash('sha256').update(raw).digest('hex')!==source.sha256)throw Error('OSM snapshot checksum mismatch');
const graph=JSON.parse(fs.readFileSync(path.join(dir,'reference-graph.json')));
const allow=new Set(['yes','designated','permissive']);
const permitted=tags=>!Object.keys(tags).some(k=>k.includes('conditional'))&&(!tags.access||allow.has(tags.access))&&(!tags.foot||allow.has(tags.foot))&&tags.indoor!=='yes'&&(!tags['oneway:foot']||['yes','no','-1'].includes(tags['oneway:foot']));
const blockedNodes=new Set(graph.nodes.filter(n=>!permitted(n.tags||{})||((n.tags||{}).barrier&&!['bollard','cycle_barrier'].includes(n.tags.barrier)&&!allow.has(n.tags.foot))).map(n=>n.id));
const edges=graph.edges.filter(e=>permitted(e.tags)&&!blockedNodes.has(e.from)&&!blockedNodes.has(e.to)).map(e=>({id:e.id,from:e.from,to:e.to,lengthMeters:e.lengthMeters,sourceId:e.sourceId,steps:e.tags.highway==='steps',direction:e.tags['oneway:foot']==='yes'?'forward':e.tags['oneway:foot']==='-1'?'reverse':'both'}));
const used=new Set(edges.flatMap(e=>[e.from,e.to]));
const nodes=graph.nodes.filter(n=>used.has(n.id)).map(n=>({id:n.id,longitude:n.coordinate[0],latitude:n.coordinate[1]}));
const output={version:'osm-campus-2026-11-12',sourceUrl:'https://www.openstreetmap.org/copyright',sourceTimestamp:JSON.parse(raw).osm3s.timestamp_osm_base,sourceSha256:source.sha256,license:'ODbL-1.0',attribution:'© OpenStreetMap contributors — Open Database License (ODbL)',fieldVerified:false,nodes,edges};
fs.writeFileSync(path.join(root,'backend/src/data/pedestrian-network.json'),JSON.stringify(output));
console.log(`Exported ${nodes.length} geographic nodes and ${edges.length} edges; no KML or imagery included.`);
