import test from 'node:test';
import assert from 'node:assert/strict';
import {matchInterests,interestCategory,validInterestPlan} from './interestSelection';
import {interestCatalog,planInterestTour} from '../../backend/src/services/interestTours';
import {validTourProgress} from './tourProgressValidation';
test('client relevance agrees with backend union and explicit removals',()=>{
  const selected=['computer-science','electrical-engineering'];
  const matches=matchInterests(interestCatalog,selected,[]);
  assert.equal(matches.length,3);assert.equal(matches[0].id,'kummer-student-design-center');assert.equal(matches[0].reasons.length,2);
  assert.equal(interestCategory(matches[0],interestCatalog,selected),'academics');
  assert.equal(matchInterests(interestCatalog,selected,[matches[0].id]).filter(p=>p.included).length,2);
});
test('generated plans and paused checkpoints preserve the personalized stops and illustration',()=>{
  const plan=planInterestTour(['computer-science','electrical-engineering']);
  assert(validInterestPlan(plan));
  assert(validTourProgress({origin:'local',savedAt:Date.now(),session:plan.session,stopIndex:2},'local'));
  assert(!validInterestPlan({...plan,walkingRoute:{...plan.walkingRoute,stopOrder:['havener-center']}}));
  assert(!validInterestPlan({...plan,artwork:{...plan.artwork,legs:[{}]}}));
  assert(!validInterestPlan({...plan,artwork:{...plan.artwork,legs:plan.artwork.legs.map((leg:any)=>({...leg,toStopId:'wrong-stop'}))}}));
});
test('incomplete multi-interest plan is reviewable but has no walking route',()=>{
  const plan=planInterestTour(['computer-science','life','campus-history']);
  assert(validInterestPlan(plan));assert.equal(plan.walkingRoute,null);assert(plan.session.stops.length>12);
});
