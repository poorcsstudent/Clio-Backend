// Image-space diagnostics only. Never mutate geometry or snap nearby paths.
function project(p,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
 if(!den)return {t:0,distance:Math.hypot(p[0]-a[0],p[1]-a[1]),point:a};
 const t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den;
 const clipped=Math.max(0,Math.min(1,t)),point=[a[0]+clipped*dx,a[1]+clipped*dy];
 return {t,point,distance:Math.hypot(p[0]-point[0],p[1]-point[1])};
}
function audit(graph){
 const nodeMap=new Map(graph.nodes.map(n=>[n.id,n]));
 const incident=new Map(graph.nodes.map(n=>[n.id,[]]));
 for(const e of graph.edges)for(const id of[e.from,e.to])incident.get(id).push(e);
 const nearEndpoints=[],endpointOnEdge=[];
 for(let i=0;i<graph.nodes.length;i++)for(let j=i+1;j<graph.nodes.length;j++){
  const a=graph.nodes[i],b=graph.nodes[j],ae=incident.get(a.id),be=incident.get(b.id);
  if(!ae.length||!be.length||ae[0].frame!==be[0].frame)continue;
  if(ae.some(e=>e.from===b.id||e.to===b.id))continue;
  const distance=Math.hypot(a.x-b.x,a.y-b.y);
  if(distance<=8)nearEndpoints.push({nodes:[a.id,b.id],distancePixels:+distance.toFixed(2),action:'inspect-only-no-snap'});
 }
 for(const n of graph.nodes){
  const own=incident.get(n.id);if(!own.length)continue;
  for(const e of graph.edges){
   if(e.frame!==own[0].frame||e.from===n.id||e.to===n.id)continue;
   let nearest=null;
   for(let i=1;i<e.points.length;i++){
    const candidate=project([n.x,n.y],e.points[i-1],e.points[i]);
    if(candidate.t<=0||candidate.t>=1)continue;
    if(!nearest||candidate.distance<nearest.distance)nearest={...candidate,segment:i-1};
   }
   if(nearest&&nearest.distance<=.25)endpointOnEdge.push({node:n.id,edge:e.id,reviewKey:e.reviewKey,segment:nearest.segment,distancePixels:+nearest.distance.toFixed(3),action:'review-junction-or-grade-separation'});
  }
 }
 return {nearEndpointThresholdPixels:8,exactTouchTolerancePixels:.25,nearEndpoints,endpointOnEdge,automaticChanges:false};
}
module.exports={project,audit};
