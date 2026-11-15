import test from 'node:test';
import assert from 'node:assert/strict';
import { refineTourOrder } from './tourOrder';

test('large-tour refinement removes a zigzag without losing or renumbering destinations',()=>{
  const distances=Array.from({length:25},(_,a)=>Array.from({length:25},(_,b)=>Math.abs(a-b)));
  const initial=[0,1,5,4,3,2,...Array.from({length:19},(_,i)=>i+6)];
  const result=refineTourOrder(initial,distances);
  assert.deepEqual(result,Array.from({length:25},(_,i)=>i));
  assert.equal(result[0],0);assert.equal(new Set(result).size,25);
  assert.deepEqual(initial.slice(0,6),[0,1,5,4,3,2]);
});
test('refinement respects directed reachability and never worsens its starting route',()=>{
  for(const n of [11,12,20,40]){
    const distances=Array.from({length:n},(_,a)=>Array.from({length:n},(_,b)=>b<a?Infinity:b-a));
    const initial=Array.from({length:n},(_,i)=>i);
    assert.deepEqual(refineTourOrder(initial,distances),initial);
  }
});
