const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=__dirname;
const {project,audit}=require('./topology.cjs');
assert.deepEqual(project([5,3],[0,0],[10,0]),{t:.5,point:[5,0],distance:3});
const sample={nodes:[{id:'a',x:0,y:0},{id:'b',x:10,y:0},{id:'c',x:5,y:0},{id:'d',x:5,y:5}],edges:[{id:'ab',from:'a',to:'b',frame:'main',points:[[0,0],[10,0]]},{id:'cd',from:'c',to:'d',frame:'main',points:[[5,0],[5,5]]}]};
const untouched=JSON.stringify(sample);
assert.equal(audit(sample).endpointOnEdge.length,1);
sample.edges[1].frame='inset';assert.equal(audit(sample).endpointOnEdge.length,0);
sample.edges[1].frame='main';assert.equal(JSON.stringify(sample),untouched);
execFileSync(process.execPath,[path.join(root,'generate.cjs')]);
const first=fs.readFileSync(path.join(root,'graph-draft.json'),'utf8');
execFileSync(process.execPath,[path.join(root,'generate.cjs')]);
assert.equal(fs.readFileSync(path.join(root,'graph-draft.json'),'utf8'),first,'Generation must be deterministic');
execFileSync(process.execPath,[path.join(root,'validate.cjs')]);
const graph=JSON.parse(first),rejected=JSON.parse(fs.readFileSync(path.join(root,'rejected-traces.json'),'utf8'));
assert.equal(new Set(graph.edges.map(e=>e.reviewKey)).size,graph.edges.length);
assert(rejected.every(r=>!graph.edges.some(e=>e.trace===r.label)));
assert(graph.edges.every(e=>Number.isFinite(e.lengthPixels)&&e.lengthPixels>0));
assert(graph.edges.every(e=>e.routingEligible===false&&e.distanceMeters===null));
// Interior-path regression: explicit junctions must stay shared after edits.
for(const [x,y,traces] of [
 [1923,951,['quad-west','quad-west-triangle-base','quad-center-tree-link']],
 [1951,941,['quad-middle-west','quad-middle-east','quad-diagonal-se','quad-center-tree-link']],
 [1980,949,['quad-south','quad-east','quad-diagonal-se']],
 [2226,1002,['east-courtyard-south-link','east-courtyard-branch','east-garden-southwest-link']],
]){
 const node=graph.nodes.find(n=>n.x===x&&n.y===y);
 assert(node,`Missing reviewed junction ${x},${y}`);
 for(const trace of traces)assert(graph.edges.some(e=>e.trace===trace&&(e.from===node.id||e.to===node.id)),`${trace} must meet ${node.id}`);
}
assert(!graph.edges.some(e=>e.trace==='havener-east'),'Superseded overview duplicate must not return');
const html=fs.readFileSync(path.join(root,'review.html'),'utf8');
new (require('node:vm').Script)(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log('PASS: deterministic generation, structural checks, unique review keys, rejected-edge exclusion, pixel lengths, routing lock, reviewer syntax.');
