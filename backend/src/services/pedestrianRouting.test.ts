import assert from 'node:assert/strict';
import test from 'node:test';
import {createPedestrianRouter,PedestrianRouteError} from './pedestrianRouting';
const nodes=[{id:'a',latitude:0,longitude:0},{id:'b',latitude:0,longitude:.001},{id:'c',latitude:.001,longitude:0},{id:'isolated',latitude:.002,longitude:.002}];
const edge=(from:string,to:string,lengthMeters:number,direction='both')=>({id:from+to,from,to,lengthMeters,direction,steps:false,sourceId:'way/test'});
const router=createPedestrianRouter({nodes,edges:[edge('a','b',100),edge('a','c',10),edge('c','b',20)]});
const stop=(id:string)=>({...nodes.find(n=>n.id===id)!,name:id});
test('Dijkstra uses connected edge costs rather than straight-line distance',()=>{
 const route=router.shortest('a','b')!;assert.equal(route.distanceMeters,30);assert.deepEqual(route.edges.map(e=>e.id),['ac','cb']);
});
test('open tour ordering is shortest for fixed approaches and start',()=>{
 const p=router.plan([stop('a'),stop('b'),stop('c')],true);assert.deepEqual(p.order,['a','c','b']);assert.equal(p.distanceMeters,30);
});
test('disconnected and out-of-coverage stops fail without fallback',()=>{
 assert.equal(router.shortest('a','isolated'),null);
 assert.throws(()=>router.plan([stop('a'),stop('isolated')]),PedestrianRouteError);
 assert.throws(()=>router.anchor({id:'far',name:'far',latitude:10,longitude:10}),PedestrianRouteError);
});
test('foot-specific one-way constraints respected',()=>{
 const r=createPedestrianRouter({nodes:nodes.slice(0,2),edges:[edge('a','b',100,'forward')]});assert(r.shortest('a','b'));assert.equal(r.shortest('b','a'),null);
});
test('duplicate stops rejected',()=>{
 assert.throws(()=>router.plan([stop('a'),stop('a')]),PedestrianRouteError);
});

test('nearby connected approach wins over a closer isolated fragment without inventing edges',()=>{
 const ns=[{id:'start',latitude:0,longitude:0},{id:'connected',latitude:0,longitude:.001},{id:'fragment',latitude:.0001,longitude:.001}];
 const r=createPedestrianRouter({nodes:ns,edges:[edge('start','connected',111)]});
 const p=r.plan([{...ns[0],name:'Start'},{...ns[2],id:'building',name:'Building'}],true);
 assert.equal(p.anchors[1].nodeId,'connected');assert(p.anchors[1].gapMeters>0);
 assert.deepEqual(p.legs[0].edges.map(e=>e.id),['startconnected']);
});

test('large selections retain every stop without the former cap',()=>{
 const nodes=Array.from({length:40},(_,i)=>({id:`n${i}`,latitude:0,longitude:i*.0001}));
 const r=createPedestrianRouter({nodes,edges:nodes.slice(1).map((n,i)=>edge(nodes[i].id,n.id,10))});
 const stops=nodes.map(n=>({...n,name:n.id}));
 const p=r.plan([stops[0],...stops.slice(1).reverse()],true);
 assert.deepEqual(p.order,stops.map(s=>s.id));assert.equal(p.legs.length,39);assert.equal(p.distanceMeters,390);
});

test('unknown path endpoints fail without dereferencing missing coordinates',()=>{
 assert.equal(router.shortest('missing','missing'),null);
 assert.equal(router.shortest('missing','a'),null);
});

test('a long existing sidewalk can provide an approach between its endpoints',()=>{
 const ns=[{id:'west',latitude:0,longitude:0},{id:'east',latitude:0,longitude:.004}];
 const r=createPedestrianRouter({nodes:ns,edges:[edge('west','east',444)]});
 const stops=[{...ns[0],name:'Start'},{id:'middle',name:'Middle',latitude:.0001,longitude:.002}];
 const p=r.plan(stops,true);
 assert(Math.abs(p.distanceMeters-222)<1);assert(p.anchors[1].gapMeters<12);
 assert.equal(p.legs[0].path.at(-1)!.latitude,0);
 assert.equal(r.shortest('west','east')!.distanceMeters,444);
});
