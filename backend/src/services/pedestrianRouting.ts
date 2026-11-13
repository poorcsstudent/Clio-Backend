import network from '../data/pedestrian-network.json';

export interface RouteStop { id:string; name:string; latitude:number; longitude:number }
type Point={latitude:number;longitude:number};
type Edge={id:string;from:string;to:string;lengthMeters:number;sourceId:string;steps:boolean;direction:string;tunnel?:boolean;level?:number;crossing?:boolean};
type Network={nodes:Array<Point&{id:string}>;edges:Edge[]};
export class PedestrianRouteError extends Error {
  readonly code='PEDESTRIAN_ROUTE_UNAVAILABLE';
  constructor(message:string,readonly stopIds:string[]=[]){super(message);}
}
export const pedestrianNetworkMetadata={version:network.version,attribution:network.attribution,sourceUrl:network.sourceUrl,sourceTimestamp:network.sourceTimestamp};
export function meters(a:Point,b:Point){const r=Math.PI/180;const h=Math.sin((b.latitude-a.latitude)*r/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin((b.longitude-a.longitude)*r/2)**2;return 6371008.8*2*Math.asin(Math.sqrt(Math.min(1,h)));}

export function createPedestrianRouter(data:Network){
 const nodes=new Map(data.nodes.map(n=>[n.id,n]));
 const adjacent=new Map(data.nodes.map(n=>[n.id,[] as Array<{to:string;edge:Edge}>]));
 for(const edge of data.edges){
  if(!nodes.has(edge.from)||!nodes.has(edge.to)||!Number.isFinite(edge.lengthMeters)||edge.lengthMeters<=0)throw Error('Invalid pedestrian edge');
  if(edge.direction!=='reverse')adjacent.get(edge.from)!.push({to:edge.to,edge});
  if(edge.direction!=='forward')adjacent.get(edge.to)!.push({to:edge.from,edge});
 }
 function anchor(stop:RouteStop){
  if(!Number.isFinite(stop.latitude)||!Number.isFinite(stop.longitude)||Math.abs(stop.latitude)>90||Math.abs(stop.longitude)>180)throw new PedestrianRouteError('Invalid stop coordinate',[stop.id]);
  let best: typeof data.nodes[number]|undefined, gap=Infinity;
  for(const node of data.nodes){const d=meters(stop,node);if(d<gap){gap=d;best=node;}}
  if(!best||gap>80)throw new PedestrianRouteError(`No mapped pedestrian approach within 80 m of ${stop.name}.`,[stop.id]);
  return {stopId:stop.id,nodeId:best.id,coordinate:{latitude:best.latitude,longitude:best.longitude},gapMeters:Math.round(gap),assumption:`${stop.name}: use the nearest mapped pedestrian node (${Math.round(gap)} m from the building reference point). The final entrance connection is not verified or drawn.`};
 }
 function search(from:string){
  const distances=new Map([[from,0]]),previous=new Map<string,{from:string;edge:Edge}>(),visited=new Set<string>();
  // Network is bounded (~2k nodes); deterministic Dijkstra with no geometric shortcuts.
  while(true){let current:string|undefined,best=Infinity;for(const [id,d]of distances)if(!visited.has(id)&&d<best){current=id;best=d;}
   if(current===undefined)break;visited.add(current);
   for(const next of adjacent.get(current)||[]){const d=best+next.edge.lengthMeters;if(d<(distances.get(next.to)??Infinity)){distances.set(next.to,d);previous.set(next.to,{from:current,edge:next.edge});}}
  }
  return {distances,previous};
 }
 function reconstruct(from:string,to:string,{distances,previous}:ReturnType<typeof search>){
  if(!nodes.has(from)||!nodes.has(to)||!distances.has(to))return null;
  const ids=[to],edges:Edge[]=[];let cursor=to;while(cursor!==from){const prev=previous.get(cursor)!;ids.push(prev.from);edges.push(prev.edge);cursor=prev.from;}
  return {distanceMeters:distances.get(to)!,path:ids.reverse().map(id=>({latitude:nodes.get(id)!.latitude,longitude:nodes.get(id)!.longitude})),edges:edges.reverse()};
 }
 function shortest(from:string,to:string){return reconstruct(from,to,search(from));}
 function plan(stops:RouteStop[],optimize=false){
  if(stops.length<2||new Set(stops.map(s=>s.id)).size!==stops.length)throw new PedestrianRouteError('Choose at least two distinct stops.');
  const anchors=stops.map(anchor),cache=new Map<string,ReturnType<typeof shortest>>();
  // One source search per distinct approach, rather than per pair of stops.
  const trees=new Map<string,ReturnType<typeof search>>();
  const tree=(a:number)=>{const id=anchors[a].nodeId;if(!trees.has(id))trees.set(id,search(id));return trees.get(id)!;};
  const leg=(a:number,b:number)=>{const key=a+':'+b;if(!cache.has(key))cache.set(key,reconstruct(anchors[a].nodeId,anchors[b].nodeId,tree(a)));return cache.get(key)!;};
  let order=stops.map((_,i)=>i);
  if(optimize&&stops.length<=11){
   // Exact open-tour ordering for at most ten destinations; fixed start, no return.
   const n=stops.length-1,dp=new Map<string,{cost:number;order:number[]}>();
   for(let j=0;j<n;j++){const first=leg(0,j+1);if(first)dp.set(`${1<<j}:${j}`,{cost:first.distanceMeters,order:[0,j+1]});}
   for(let mask=1;mask<(1<<n);mask++)for(let last=0;last<n;last++){const state=dp.get(`${mask}:${last}`);if(!state)continue;
    for(let next=0;next<n;next++)if(!(mask&(1<<next))){const link=leg(last+1,next+1);if(!link)continue;const key=`${mask|(1<<next)}:${next}`,cost=state.cost+link.distanceMeters;if(cost<(dp.get(key)?.cost??Infinity))dp.set(key,{cost,order:[...state.order,next+1]});}}
   const complete=Array.from({length:n},(_,i)=>dp.get(`${(1<<n)-1}:${i}`)).filter((v):v is {cost:number;order:number[]}=>!!v).sort((a,b)=>a.cost-b.cost)[0];
   if(!complete)throw new PedestrianRouteError('Selected stops are not connected by the available pedestrian network.',stops.map(s=>s.id));order=complete.order;
  }else if(optimize){
   // Scalable heuristic: preserve every stop without exponential subset search.
   order=[0];const remaining=new Set(stops.map((_,i)=>i).slice(1));
   while(remaining.size){const from=order[order.length-1],distances=tree(from).distances;let next:number|undefined,best=Infinity;
    for(const candidate of remaining){const cost=distances.get(anchors[candidate].nodeId)??Infinity;if(cost<best){best=cost;next=candidate;}}
    if(next===undefined)throw new PedestrianRouteError('No connected continuation through all selected stops; large-route ordering is heuristic.',[...remaining].map(i=>stops[i].id));
    order.push(next);remaining.delete(next);
   }
  }
  const legs=order.slice(1).map((to,index)=>{const from=order[index],route=leg(from,to);if(!route)throw new PedestrianRouteError(`No connected pedestrian path between ${stops[from].name} and ${stops[to].name}.`,[stops[from].id,stops[to].id]);return {fromStopId:stops[from].id,toStopId:stops[to].id,...route};});
  return {order:order.map(i=>stops[i].id),anchors:order.map(i=>anchors[i]),legs,distanceMeters:legs.reduce((n,l)=>n+l.distanceMeters,0)};
 }
 return {anchor,shortest,plan};
}
export const pedestrianRouter=createPedestrianRouter(network);
