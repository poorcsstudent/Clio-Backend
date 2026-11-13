// Bounded read-only public downloads. No API keys, uploads, or app integration.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname;
const bbox=[37.945,-91.787,37.965,-91.765]; // south, west, north, east; main campus only
const query=`[out:json][timeout:25];(way["highway"](${bbox.join(',')});way["building"](${bbox.join(',')});node["entrance"](${bbox.join(',')});node["highway"="crossing"](${bbox.join(',')});node["barrier"](${bbox.join(',')}););out meta geom;`;
const sources=[
 {id:'mst-wayfinder',file:'mst-wayfinder.kml',url:'https://facilities.mst.edu/media/campussupport/facilities/spaceplanning/240516-CampusWayfinder.kml',attribution:'Missouri University of Science and Technology, Facility Planning and Operations',license:'No redistribution license established; reference-only, not approved for production redistribution.'},
 {id:'osm',file:'osm.json',url:'https://overpass-api.de/api/interpreter',method:'POST',body:new URLSearchParams({data:query}).toString(),attribution:'© OpenStreetMap contributors',license:'ODbL 1.0 — https://www.openstreetmap.org/copyright'},
];
async function main(){
 const manifest={retrievedAt:new Date().toISOString(),bbox,coordinateOrder:'bbox south,west,north,east; GeoJSON longitude,latitude',query,sources:[]};
 for(const source of sources){
  try{
   const response=await fetch(source.url,{method:source.method||'GET',body:source.body,headers:{'User-Agent':'ClioVision campus-path review','Content-Type':source.body?'application/x-www-form-urlencoded':'application/octet-stream'},signal:AbortSignal.timeout(45000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=Buffer.from(await response.arrayBuffer());
   if(source.id==='osm'){const parsed=JSON.parse(data);if(!Array.isArray(parsed.elements)||parsed.remark)throw Error(parsed.remark||'Missing OSM elements');}
   else if(!data.toString().includes('<kml'))throw Error('Not a KML document');
   fs.writeFileSync(path.join(root,source.file),data);
   manifest.sources.push({id:source.id,url:source.url,file:source.file,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex'),attribution:source.attribution,license:source.license,status:'downloaded'});
   console.log(source.id+': downloaded '+data.length+' bytes');
  }catch(error){manifest.sources.push({id:source.id,url:source.url,status:'failed',error:error.message});console.log(source.id+': '+error.message);}
 }
 fs.writeFileSync(path.join(root,'source-manifest.json'),JSON.stringify(manifest,null,2));
 if(manifest.sources.some(s=>s.status==='failed'))process.exitCode=1;
}
main();
