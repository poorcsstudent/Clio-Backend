import { useEffect, useRef, useState } from 'react';
import { generateInterestTour, getInterestCatalog, type TourSession, type CampusWalkingRoute } from './api';
import type { InterestCatalog, InterestPlan } from './interestSelection';

/** Root-provider owned: changing tabs must not discard the user's selection. */
export function useInterestPlanner() {
  const [catalog,setCatalog]=useState<InterestCatalog|null>(null);
  const [selected,setSelected]=useState<string[]>([]);
  const [excluded,setExcluded]=useState<string[]>([]);
  const [plan,setPlan]=useState<InterestPlan|null>(null);
  const [loading,setLoading]=useState(true);
  const [planning,setPlanning]=useState(false);
  const [error,setError]=useState('');
  const generation=useRef(0);
  useEffect(()=>{let alive=true;getInterestCatalog().then(value=>{if(alive)setCatalog(value);}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;generation.current++;};},[]);
  function invalidate(){generation.current++;setPlan(null);setPlanning(false);setError('');}
  function toggleInterest(id:string){invalidate();setSelected(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);setExcluded([]);}
  function toggleStop(id:string){invalidate();setExcluded(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);}
  function reset(){invalidate();setSelected([]);setExcluded([]);}
  function restore(session:TourSession,route:CampusWalkingRoute|null){
    if(!session.interestIds||!session.illustration)return;
    invalidate();setSelected(session.interestIds);setExcluded(session.excludedIds??[]);
    setPlan({session,walkingRoute:route,artwork:session.illustration,interestIds:session.interestIds,excludedIds:session.excludedIds??[],routingError:route?null:'Saved geographic route is unavailable. Preview again before starting a replacement tour.',orderExplanation:'Saved personalized tour. Restored paused; route and campus information may have changed.'});
  }
  async function generate(){
    const ticket=++generation.current;setPlanning(true);setError('');setPlan(null);
    try { const result=await generateInterestTour(selected,excluded);if(ticket===generation.current)setPlan(result); }
    catch(e){if(ticket===generation.current)setError(e instanceof Error?e.message:'Could not generate your tour.');}
    finally{if(ticket===generation.current)setPlanning(false);}
  }
  return {catalog,selected,excluded,plan,loading,planning,error,toggleInterest,toggleStop,reset,generate,restore};
}
