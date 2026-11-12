// Local review preview only. Never promotes artwork pixels to GPS coordinates.
const {project}=require('../preview/path-review/topology.cjs');
const {graph,approaches}=require('./artwork-preview-network.cjs');
const length=points=>points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);

function createArtworkRoute(stops,layout,source=graph,groupConnected=false){
  const edges=source.edges.filter(e=>e.frame==='main');
  const anchors=stops.map(stop=>{
    const b=layout.buildings[stop.id];
    if(!b)return {stopId:stop.id,name:stop.name,error:'No matched building marker on the illustration.'};
    // Insets do not share the main campus coordinate frame.
    if((b.imageY>1440&&b.imageX>850&&b.imageX<1880)||(b.imageY>1390&&b.imageX>2450))
      return {stopId:stop.id,name:stop.name,error:'Separate map inset; no main-campus walking connection.'};
    const override=source===graph&&approaches[stop.id]?source.nodes.find(n=>n.id===approaches[stop.id]):null;
    const target=override?[override.x,override.y]:[b.imageX,b.imageY];
    let best;
    for(const edge of edges){let offset=0;for(let i=1;i<edge.points.length;i++){
      const a=edge.points[i-1],z=edge.points[i],p=project(target,a,z);
      if(!best||p.distance<best.gapPixels)best={edgeId:edge.id,segment:i-1,point:p.point,gapPixels:p.distance,offset:offset+Math.hypot(p.point[0]-a[0],p.point[1]-a[1])};
      offset+=Math.hypot(z[0]-a[0],z[1]-a[1]);
    }}
    if(!best||best.gapPixels>160)return {stopId:stop.id,name:stop.name,error:'No traced approach near this building marker.'};
    return {stopId:stop.id,name:stop.name,...best,gapPixels:override?Math.hypot(override.x-b.imageX,override.y-b.imageY):best.gapPixels,association:override?'explicit-preview-approach':'nearest-trace'};
  });
  const adjacent=new Map();
  function link(from,to,points,edge){
    const item={to,points,length:length(points),reviewKey:edge.reviewKey,candidate:edge.status!=='visible-path-draft',assumption:edge.assumption?.rationale};
    if(!adjacent.has(from))adjacent.set(from,[]);adjacent.get(from).push(item);
    if(!adjacent.has(to))adjacent.set(to,[]);adjacent.get(to).push({...item,to:from,points:[...points].reverse()});
  }
  // Split only the selected existing edge, never snap separate components.
  for(const edge of edges){
    const cuts=anchors.filter(a=>a.edgeId===edge.id).sort((a,b)=>a.offset-b.offset);
    let from=edge.from,points=[edge.points[0]];
    for(let i=0;i<edge.points.length-1;i++){
      for(const cut of cuts.filter(c=>c.segment===i)){
        points.push(cut.point);link(from,'stop:'+cut.stopId,points,edge);from='stop:'+cut.stopId;points=[cut.point];
      }
      points.push(edge.points[i+1]);
    }
    link(from,edge.to,points,edge);
  }
  function shortest(from,to){
    const distances=new Map([[from,0]]),previous=new Map(),visited=new Set();
    while(true){let u,best=Infinity;for(const [id,d]of distances)if(!visited.has(id)&&d<best){u=id;best=d;}
      if(u===undefined)return null;if(u===to)break;visited.add(u);
      for(const e of adjacent.get(u)||[]){const cost=best+e.length;if(cost<(distances.get(e.to)??Infinity)){distances.set(e.to,cost);previous.set(e.to,{from:u,edge:e});}}
    }
    const parts=[];for(let u=to;u!==from;){const p=previous.get(u);parts.push(p.edge);u=p.from;}
    return {parts:parts.reverse(),lengthPixels:distances.get(to)};
  }
  const coordinates=new Map(source.nodes.map(n=>[n.id,[n.x,n.y]]));
  for(const a of anchors)if(a.point)coordinates.set('stop:'+a.stopId,a.point);
  function component(start){const result=new Set([start]),queue=[start];for(const u of queue)for(const e of adjacent.get(u)||[])if(!result.has(e.to)){result.add(e.to);queue.push(e.to);}return [...result];}
  function partial(from,to){
    // Show connected portions ending at the gap, but never add a proximity edge.
    const left=component(from),right=component(to);let best;
    for(const a of left)for(const b of right){const p=coordinates.get(a),q=coordinates.get(b);if(!p||!q)continue;const d=Math.hypot(p[0]-q[0],p[1]-q[1]);if(!best||d<best.d)best={a,b,d};}
    if(!best)return {parts:[],gapPoints:[]};
    return {parts:[...(shortest(from,best.a)?.parts||[]),...(shortest(best.b,to)?.parts||[])],gapPoints:[coordinates.get(best.a),coordinates.get(best.b)]};
  }
  const pairCache=new Map();
  const pair=(a,b)=>{const key=a+':'+b;if(!pairCache.has(key))pairCache.set(key,!anchors[a].error&&!anchors[b].error?shortest('stop:'+anchors[a].stopId,'stop:'+anchors[b].stopId):null);return pairCache.get(key);};
  let order=stops.map((_,i)=>i);
  if(groupConnected&&stops.length>2&&stops.length<=11){
    // Keep connected groups together, not a claim of fastest real-world walking.
    const n=stops.length-1,dp=new Map();
    const cost=(a,b)=>pair(a,b)?.lengthPixels??1e9;
    for(let j=0;j<n;j++)dp.set(`${1<<j}:${j}`,{cost:cost(0,j+1),order:[0,j+1]});
    for(let mask=1;mask<(1<<n);mask++)for(let last=0;last<n;last++){
      const state=dp.get(`${mask}:${last}`);if(!state)continue;
      for(let next=0;next<n;next++)if(!(mask&(1<<next))){const key=`${mask|(1<<next)}:${next}`,value=state.cost+cost(last+1,next+1);if(value<(dp.get(key)?.cost??Infinity))dp.set(key,{cost:value,order:[...state.order,next+1]});}
    }
    order=Array.from({length:n},(_,i)=>dp.get(`${(1<<n)-1}:${i}`)).sort((a,b)=>a.cost-b.cost)[0].order;
  }
  const orderedAnchors=order.map(i=>anchors[i]);
  const legs=order.slice(1).map((to,i)=>{
    const from=order[i],a=anchors[from],b=anchors[to],route=pair(from,to);
    return {fromStopId:a.stopId,toStopId:b.stopId,...(route||{...(!a.error&&!b.error?partial('stop:'+a.stopId,'stop:'+b.stopId):{parts:[]}),lengthPixels:null}),
      error:route?null:`${a.name} → ${b.name}: ${a.error||b.error||'the traced path sections are not connected yet.'}`};
  });
  return {coordinateSpace:'artwork-pixels',width:source.width,height:source.height,
    stopOrder:order.map(i=>stops[i].id),legs,anchors:orderedAnchors,status:legs.every(l=>!l.error)?'complete':'incomplete',
    orderBasis:groupConnected?'Connected artwork sections grouped first; not a shortest geographic route.':'GPS-reference stop order; artwork connections reviewed separately.',
    warnings:[...legs.filter(l=>l.error).map(l=>l.error),...new Set(legs.flatMap(l=>l.parts.filter(p=>p.assumption).map(p=>p.assumption)))],
    disclaimer:'Illustration-path review, not live walking directions. Dashed paths are candidate traces. Building approaches and accessibility are unverified. Missing connections are not replaced by straight lines.'};
}
module.exports={createArtworkRoute};
