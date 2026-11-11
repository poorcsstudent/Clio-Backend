const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const g = require('./graph-draft.json');
const nodes = new Map(g.nodes.map(n=>[n.id,n]));
assert.equal(nodes.size,g.nodes.length);
const adjacency = new Map(g.nodes.map(n=>[n.id,new Set()]));
const signatures = new Set();
const nodeFrames=new Map();
for(const e of g.edges){
 for(const id of [e.from,e.to]){if(nodeFrames.has(id))assert.equal(nodeFrames.get(id),e.frame,'Coordinate frames must not share junctions');nodeFrames.set(id,e.frame);}
 assert(nodes.has(e.from)&&nodes.has(e.to),`Missing endpoint ${e.id}`);
 assert.notEqual(e.from,e.to,`Self loop ${e.id}`);
 assert(e.points.length>=2);
 for(const p of e.points)assert(p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=g.width&&p[1]>=0&&p[1]<=g.height);
 assert.deepEqual(e.points[0],[nodes.get(e.from).x,nodes.get(e.from).y]);
 assert.deepEqual(e.points.at(-1),[nodes.get(e.to).x,nodes.get(e.to).y]);
 const key=[JSON.stringify(e.points),JSON.stringify([...e.points].reverse())].sort()[0];
 assert(!signatures.has(key),`Duplicate ${e.id}`);signatures.add(key);
 for(const p of e.points.slice(1,-1))assert(!g.nodes.some(n=>n.x===p[0]&&n.y===p[1]),`Unsplit node in ${e.id}`);
 assert.equal(e.distanceMeters,null);assert.equal(e.accessibility,'unverified');assert.equal(e.routingEligible,false);
 adjacency.get(e.from).add(e.to);adjacency.get(e.to).add(e.from);
}
const visited=new Set(),components=[];
for(const id of nodes.keys())if(!visited.has(id)){
 const stack=[id],component=[];visited.add(id);
 while(stack.length){const current=stack.pop();component.push(current);for(const next of adjacency.get(current))if(!visited.has(next)){visited.add(next);stack.push(next);}}
 components.push(component);
}
// Report crossings for human review; never manufacture junctions automatically.
const crossings=[];
function intersection(a,b,c,d){
 const rx=b[0]-a[0],ry=b[1]-a[1],sx=d[0]-c[0],sy=d[1]-c[1],den=rx*sy-ry*sx;
 if(Math.abs(den)<1e-8)return null;
 const t=((c[0]-a[0])*sy-(c[1]-a[1])*sx)/den,u=((c[0]-a[0])*ry-(c[1]-a[1])*rx)/den;
 return t>1e-6&&t<1-1e-6&&u>1e-6&&u<1-1e-6?[+(a[0]+t*rx).toFixed(2),+(a[1]+t*ry).toFixed(2)]:null;
}
for(let i=0;i<g.edges.length;i++)for(let j=i+1;j<g.edges.length;j++){
 const a=g.edges[i],b=g.edges[j];
 for(let p=1;p<a.points.length;p++)for(let q=1;q<b.points.length;q++){
  const point=intersection(a.points[p-1],a.points[p],b.points[q-1],b.points[q]);
  if(point)crossings.push({edges:[a.id,b.id],point,status:'review-junction-or-grade-separation'});
 }
}
const report={structuralChecks:'passed',nodes:g.nodes.length,edges:g.edges.length,components:components.map(n=>({size:n.length,nodes:n})),unresolvedCrossings:crossings,geometryApproved:false,geographicAccuracyValidated:false};
const visible=g.edges.filter(e=>e.status==='visible-path-draft');
report.quality={
 accuracyPercent:null,
 targetAccuracyPercent:90,
 targetAchieved:false,
 reason:'No independent reference centerlines, approved entrance associations, or per-segment user review. Trace counts and pixel lengths are not accuracy measurements.',
 visibleDraftEdges:visible.length,
 uncertainCandidateEdges:g.edges.length-visible.length,
 visibleLengthPixels:+visible.reduce((sum,e)=>sum+e.lengthPixels,0).toFixed(2),
 campusCoveragePercent:null,
 requiredBeforeRouting:['Complete coverage inventory','Review each retained trace against artwork','Approve building entrance connections','Resolve disconnected destinations','Calibrate GPS distances independently','User approval to integrate'],
};
fs.writeFileSync(path.join(__dirname,'validation.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({nodes:report.nodes,edges:report.edges,components:components.length,unresolvedCrossings:crossings.length,structuralChecks:'passed'}));
