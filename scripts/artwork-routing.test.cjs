const assert=require('node:assert/strict');
const test=require('node:test');
const {createArtworkRoute}=require('./artwork-routing.cjs');
const graph={width:1000,height:1000,nodes:[{id:'a',x:0,y:0},{id:'b',x:100,y:0},{id:'c',x:200,y:0},{id:'d',x:300,y:0}],edges:[
 {id:'ab',from:'a',to:'b',frame:'main',points:[[0,0],[50,20],[100,0]],status:'visible-path-draft',reviewKey:'ab'},
 {id:'cd',from:'c',to:'d',frame:'main',points:[[200,0],[300,0]],status:'visible-path-draft',reviewKey:'cd'}]};
const layout={buildings:{one:{imageX:10,imageY:4},two:{imageX:90,imageY:4},three:{imageX:290,imageY:0}}};
const stop=id=>({id,name:id});

test('Havener residential routes use the underground passage in both directions',()=>{
 const ids=['havener-center','residential-commons-1'];
 const layout={buildings:{'havener-center':{imageX:1799.3595,imageY:825.8595},'residential-commons-1':{imageX:1760.8695,imageY:700.6275}}};
 for(const order of [ids,[...ids].reverse()]){
  const route=createArtworkRoute(order.map(stop),layout);
  assert.equal(route.status,'complete');
  const tunnel=route.legs[0].parts.find(p=>p.structure==='tunnel');
  assert.equal(tunnel.reviewKey,'preview-havener-underpass');assert.equal(tunnel.level,-1);
  assert(route.anchors.every(a=>a.edgeId!=='preview-havener-underpass'),'Buildings must not snap inside tunnels');
 }
});

test('Thomas Jefferson tunnel is traversable without hiding the separate approach gap',()=>{
 const route=createArtworkRoute(['havener-center','thomas-jefferson-residence-hall'].map(stop),{buildings:{'havener-center':{imageX:1799.3595,imageY:825.8595},'thomas-jefferson-residence-hall':{imageX:2945.7495,imageY:673.8505}}});
 const tunnel=route.legs[0].parts.find(p=>p.structure==='tunnel');
 assert.equal(tunnel.label,'Thomas Jefferson pedestrian tunnel');assert.equal(tunnel.level,-1);
 assert.equal(route.status,'incomplete');assert.equal(route.legs[0].gapPoints.length,2);
 const {graph}=require('./artwork-preview-network.cjs');
 const edges=graph.edges.filter(e=>e.structure==='tunnel');assert.equal(edges.length,2);
 assert(edges.every(e=>e.accessibility==='unverified'&&e.routingEligible===false));
});
test('preserves traced bends in the artwork frame and splits anchors on one edge',()=>{
 const route=createArtworkRoute(['one','two'].map(stop),layout,graph);
 assert.equal(route.status,'complete');assert.equal(route.coordinateSpace,'artwork-pixels');
 assert(route.legs[0].parts.some(p=>p.points.some(([x,y])=>x===50&&y===20)));
});
test('multiple interests retain every requested stop and report disconnected legs',()=>{
 const route=createArtworkRoute(['one','two','three'].map(stop),layout,graph);
 assert.equal(route.status,'incomplete');assert.deepEqual(route.stopOrder,['one','two','three']);
 assert.equal(route.legs[0].error,null);assert.match(route.legs[1].error,/two → three/);
 assert.equal(route.legs[1].gapPoints.length,2);
 assert(!route.legs[1].parts.some(p=>p.points.some(([x])=>x>100)&&p.points.some(([x])=>x<200)));
});
test('unmatched buildings are explicit and never assigned fake artwork coordinates',()=>{
 const route=createArtworkRoute(['one','missing'].map(stop),layout,graph);
 assert.match(route.anchors[1].error,/No matched/);assert.equal(route.anchors[1].point,undefined);
});

test('large artwork selections retain all stops including missing approaches',()=>{
 const stops=Array.from({length:40},(_,i)=>({id:`stop-${i}`,name:`Stop ${i}`}));
 const layout={buildings:Object.fromEntries(stops.slice(0,39).map((s,i)=>[s.id,{imageX:i*2,imageY:0}]))};
 const route=createArtworkRoute(stops,layout,graph,true);
 assert.equal(route.stopOrder.length,40);assert.equal(new Set(route.stopOrder).size,40);
 assert.equal(route.legs.length,39);assert.equal(route.stopOrder[0],'stop-0');
 assert(route.warnings.some(w=>w.includes('Stop 39')));
 assert.match(route.orderBasis,/not guaranteed shortest/);
});

test('disconnected interest does not interrupt otherwise connected stops',()=>{
 const route=createArtworkRoute(['one','three','two'].map(stop),layout,graph,true);
 assert.deepEqual(route.stopOrder,['one','two','three']);assert.equal(route.legs.filter(l=>l.error).length,1);
});

test('CS to Kummer preview uses an explicitly disclosed crossing assumption',()=>{
 const ids=['havener-center','computer-science-building','kummer-student-design-center'];
 const positions=[[1799.3595,825.8595],[2206.0295,809.4095],[1253.7395,1059.7295]];
 const layout={buildings:Object.fromEntries(ids.map((id,i)=>[id,{imageX:positions[i][0],imageY:positions[i][1]}]))};
 const route=createArtworkRoute(ids.map(stop),layout);
 assert.equal(route.status,'complete');
 assert(route.legs[1].parts.some(p=>p.reviewKey==='preview-bishop-crossing-approaches'&&p.candidate));
 assert(route.warnings.some(w=>w.includes('crossing placement')&&w.includes('approximate')));
});

test('reviewed Havener to Computer Science approach stays connected on artwork',()=>{
 const source=require('../preview/path-review/graph-draft.json');const before=JSON.stringify(source);
 const route=createArtworkRoute([{id:'havener-center',name:'Havener'},{id:'computer-science-building',name:'Computer Science'}],{buildings:{'havener-center':{imageX:1799.3595,imageY:825.8595},'computer-science-building':{imageX:2206.0295,imageY:809.4095}}});
 assert.equal(route.status,'complete');
 assert(route.legs[0].parts.some(p=>p.reviewKey==='preview-library-west-plaza'&&p.candidate&&p.assumption));
 assert.equal(route.anchors[0].association,'explicit-preview-approach');
 assert.equal(JSON.stringify(source),before,'Review source must remain unchanged');
});

test('CS, Chemistry and Electrical Engineering retain all stops in a connected draft',()=>{
 const ids=['havener-center','computer-science-building','kummer-student-design-center','emerson-electric-company-hall','schrenk-hall','straumanis-james-hall'];
 const positions=[[1799.3595,825.8595],[2206.0295,809.4095],[1253.7395,1059.7295],[2510.6195,891.6775],[1931.5695,1149.1395],[2347.9995,816.0005]];
 const layout={buildings:Object.fromEntries(ids.map((id,i)=>[id,{imageX:positions[i][0],imageY:positions[i][1]}]))};
 const route=createArtworkRoute(ids.map(stop),layout,undefined,true);
 assert.equal(route.status,'complete');assert.equal(route.legs.length,5);
 assert.equal(route.stopOrder[0],'havener-center');assert.deepEqual([...route.stopOrder].sort(),[...ids].sort());
 assert(route.warnings.length>0,'Candidate joins must remain disclosed');
});
