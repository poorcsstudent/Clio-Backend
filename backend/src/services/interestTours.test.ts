import test from 'node:test';
import assert from 'node:assert/strict';
import {interestCatalog,planInterestTour} from './interestTours';
import {pedestrianRouter} from './pedestrianRouting';

test('housing plus CS and EE has a complete twelve-stop walking tour',()=>{
  const p=planInterestTour(['housing','computer-science','electrical-engineering']);
  assert.equal(p.session.stopCount,12);assert.equal(p.routingError,null);
  assert.equal(p.walkingRoute!.legs.length,11);
  assert.deepEqual(p.walkingRoute!.stopOrder,p.session.stops.map(s=>s.id));
  assert.deepEqual(p.session.stops.map(s=>s.order),Array.from({length:12},(_,i)=>i+1));
});

test('full campus approach audit does not regress to isolated sidewalk fragments',()=>{
  const root=interestCatalog.places.find(p=>p.id==='havener-center')!;
  const failures:string[]=[];
  for(const stop of interestCatalog.places.filter(p=>p.id!==root.id)){
    try{const route=pedestrianRouter.plan([root,stop],true);assert(route.legs.length===1);}
    catch{failures.push(stop.id);}
  }
  assert.deepEqual(failures.sort(),['209-e-8th-st','allgood-bailey-stadium','athletic-fields','general-services-building','kennedy-experimental-mine','miner-dome-indoor-practice-facility','missouri-protoplex'].sort());
});

test('campus landmarks and the History degree are separate interests',()=>{
  const ids=interestCatalog.interests.map(i=>i.id);
  assert.equal(new Set(ids).size,ids.length);
  const landmarks=planInterestTour(['campus-history']);
  assert(landmarks.session.stops.some(s=>s.id==='stonehenge'));
  assert(!landmarks.session.stops.some(s=>s.reasons.some(r=>r.interest==='History')));
});
test('multiple academic interests produce one unique Havener-rooted walking tour',()=>{
  const plan=planInterestTour(['computer-science','electrical-engineering']);
  assert.equal(plan.session.stops.length,4);assert.equal(plan.session.stops[0].id,'havener-center');
  assert.equal(new Set(plan.session.stops.map(s=>s.id)).size,4);
  assert.deepEqual(plan.walkingRoute?.stopOrder,plan.session.stops.map(s=>s.id));
  assert.equal(plan.artwork.status,'complete');
  assert.equal(plan.session.stops.find(s=>s.id==='kummer-student-design-center')!.reasons.length,2);
});
test('broad interest choices retain every match and expose geographic gaps',()=>{
  const ids=['computer-science','life','campus-history'];const plan=planInterestTour(ids);
  const expected=new Set(['havener-center',...interestCatalog.interests.filter(i=>ids.includes(i.id)).flatMap(i=>i.matches.map(m=>m.placeId))]);
  assert(expected.size>12);assert.deepEqual(new Set(plan.session.stops.map(s=>s.id)),expected);
  assert.equal(plan.walkingRoute,null);assert.match(plan.routingError!,/No mapped pedestrian approach/);
  assert.equal(plan.artwork.legs.length,expected.size-1);
});
test('explicit exclusions never remove Havener or silently add unrelated buildings',()=>{
  const plan=planInterestTour(['computer-science'],['kummer-student-design-center']);
  assert.deepEqual(plan.session.stops.map(s=>s.id),['havener-center','computer-science-building']);
  for(const ids of [[],['unknown'],['computer-science','computer-science']])assert.throws(()=>planInterestTour(ids));
  assert.throws(()=>planInterestTour(['computer-science'],['havener-center']));
  assert.throws(()=>planInterestTour(['computer-science'],['computer-science-building','kummer-student-design-center']));
});
test('official artwork positions remain separate from geographic coordinates',()=>{
  const root=interestCatalog.layout.buildings['havener-center'];
  assert(root.imageX>1000);assert(root.imageY>500);assert(root.latitude<90);
  const plan=planInterestTour(['computer-science']);
  assert(plan.artwork.legs.some((l:{parts:Array<{points:number[][]}>})=>l.parts.some(p=>p.points.some(point=>point[0]>1000))));
  assert(plan.walkingRoute!.path.every(p=>Math.abs(p.latitude)<90&&Math.abs(p.longitude)<180));
});
