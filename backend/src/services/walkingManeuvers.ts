type Point={latitude:number;longitude:number};
type Edge={lengthMeters:number;tunnel?:boolean;steps:boolean;crossing?:boolean};
const radians=(n:number)=>n*Math.PI/180;
function bearing(a:Point,b:Point){const x=Math.sin(radians(b.longitude-a.longitude))*Math.cos(radians(b.latitude));const y=Math.cos(radians(a.latitude))*Math.sin(radians(b.latitude))-Math.sin(radians(a.latitude))*Math.cos(radians(b.latitude))*Math.cos(radians(b.longitude-a.longitude));return Math.atan2(x,y)*180/Math.PI;}
/** Maneuvers use graph geometry only, never illustration coordinates or image guesses. */
export function walkingManeuvers(path:Point[],edges:Edge[],destination:string){
 if(path.length!==edges.length+1)throw Error('Walking geometry and edges do not align');
 if(!edges.length)return [{instruction:`The mapped approach is shared with ${destination}. Check signs for the correct entrance; this is not confirmation of arrival.`,maneuver:'continue' as const,kind:'continue' as const,offsetMeters:0,distanceMeters:0,durationSeconds:0,path}];
 const offsets=[0];for(const edge of edges)offsets.push(offsets.at(-1)!+edge.lengthMeters);
 const boundaries:Array<{index:number;instruction:string;kind:'depart'|'turn'|'tunnel'|'crossing'|'stairs'|'continue'}>=[];
 let lastTurn=-Infinity;
 for(let i=0;i<edges.length;i++){
  const edge=edges[i],previous=edges[i-1];let instruction='',kind:typeof boundaries[number]['kind']='continue';
  if(edge.tunnel&&!previous?.tunnel){instruction='Use the pedestrian tunnel entrance and follow the passage beneath the road. GPS may be unreliable underground; follow posted signs.';kind='tunnel';}
  else if(edge.crossing&&!previous?.crossing){instruction='Use the marked pedestrian crossing. Check traffic and crossing signals yourself; Clio cannot determine when it is safe to cross.';kind='crossing';}
  else if(edge.steps&&!previous?.steps){instruction='The mapped path includes stairs. Use an alternative if stairs are unsuitable.';kind='stairs';}
  else if(previous?.tunnel&&!edge.tunnel){instruction='Leave the tunnel through the pedestrian exit and continue on the mapped path. Wait for a reliable GPS fix before following the next turn.';}
  else if(i===0){instruction=`Follow the mapped pedestrian path toward ${destination}.`;kind='depart';}
  else if(!edge.tunnel&&edge.lengthMeters>=8&&previous.lengthMeters>=8&&offsets[i]-lastTurn>=12){
   const delta=((bearing(path[i],path[i+1])-bearing(path[i-1],path[i])+540)%360)-180;
   if(Math.abs(delta)>=35){instruction=Math.abs(delta)>145?'The mapped route doubles back here. Check the path and your direction before continuing.':`Turn ${delta>0?'right':'left'} onto the continuing pedestrian path.`;kind='turn';lastTurn=offsets[i];}
  }
  if(instruction)boundaries.push({index:i,instruction,kind});
 }
 return boundaries.map((b,i)=>{const end=boundaries[i+1]?.index??edges.length;const distanceMeters=Math.round(offsets[end]-offsets[b.index]);return {instruction:b.instruction,maneuver:b.kind==='turn'?'turn' as const:b.index===0?'depart' as const:'continue' as const,kind:b.kind,offsetMeters:offsets[b.index],distanceMeters,durationSeconds:Math.max(1,Math.round(distanceMeters/1.35)),path:path.slice(b.index,end+1)};});
}
