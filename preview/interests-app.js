const $=id=>document.getElementById(id);
let data,map,markers,line,planned=false,plannedRoute=null,routeRequest=0;
const selected=new Set(),excluded=new Set();
const extra=[{id:'housing',name:'Student housing',pattern:/housing/i},{id:'life',name:'Student life',pattern:/student support|recreation|student life/i},{id:'history',name:'History & landmarks',pattern:/landmark|historic/i}];
function element(tag,text){const el=document.createElement(tag);el.textContent=text;return el;}
const routeStatus=element('p','Select interests, then preview the route.');routeStatus.id='route-status';routeStatus.setAttribute('role','status');routeStatus.setAttribute('aria-live','polite');routeStatus.className='notice';$('plan').after(routeStatus);
const details=document.createElement('details');details.id='route-details';details.append(element('summary','Route connections and assumptions'));const issues=element('ul','');details.append(issues);$('notice').after(details);details.hidden=true;
const toggleLabel=element('label',' Show traced path network');const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=true;toggle.style.width='auto';toggle.id='show-traces';toggleLabel.prepend(toggle);$('map').before(toggleLabel);toggle.onchange=()=>map&&drawArtworkRoute(plannedRoute,toggle.checked);

function reasons(place){const result=[];for(const id of selected){const program=data.programs.find(p=>p.id===id),link=program?.places.find(p=>p.placeId===place.id);if(link)result.push(program.name+': '+link.relevance);const category=extra.find(x=>x.id===id);if(category?.pattern.test(place.category))result.push(category.name+': '+place.category);}return result;}
function matches(){return data.places.map(p=>({...p,reasons:reasons(p)})).filter(p=>p.id!=='havener-center'&&p.reasons.length).sort((a,b)=>b.reasons.length-a.reasons.length||a.name.localeCompare(b.name));}
function chosen(){return matches().filter(p=>!excluded.has(p.id));}
function order(stops){const places=[data.places.find(p=>p.id==='havener-center'),...stops];return plannedRoute?plannedRoute.stopOrder.map(id=>places.find(p=>p.id===id)):places;}
function chips(){const q=$('search').value.toLowerCase();$('chips').replaceChildren();for(const item of [...extra,...data.programs].filter(p=>p.name.toLowerCase().includes(q))){const b=element('button',item.name);b.setAttribute('aria-pressed',String(selected.has(item.id)));b.onclick=()=>{selected.has(item.id)?selected.delete(item.id):selected.add(item.id);excluded.clear();planned=false;chips();render();};$('chips').append(b);}}
function render(){
  if(!planned){plannedRoute=null;routeRequest++;details.hidden=true;routeStatus.textContent='Select interests, then preview the route.';}
  const all=matches(),stops=chosen(),ids=new Set(stops.map(p=>p.id));
  $('selection').textContent=selected.size+' interests · '+stops.length+' stops + start';$('plan').disabled=!stops.length;$('plan').textContent='Preview my route →';$('heading').textContent=planned?'Your visit on the campus map':'Explore the campus';
  markers.clearLayers();
  for(const p of data.places){const root=p.id==='havener-center',r=reasons(p),active=ids.has(p.id),marker=L.circleMarker([p.latitude,p.longitude],{radius:root?10:active?8+Math.min(r.length,3):4,color:root?'#efca79':active?'#a2f4b8':'#64847b',weight:active?3:1,fillOpacity:active||root?.95:.35});const content=element('div','');content.append(element('strong',p.name),element('p',root?'Your tour starts here.':r.join(' ')||p.category));marker.bindPopup(content).addTo(markers);}
  $('cards').replaceChildren();if(!selected.size)$('cards').append(element('p','Select interests to reveal your campus matches.'));else if(!all.length)$('cards').append(element('p','No mapped matches for these interests yet.'));
  for(const [index,p] of (planned?order(stops).slice(1):all).entries()){
    const card=element('article','');card.className='card';card.append(element('span',planned?'STOP '+(index+2):ids.has(p.id)?'SUGGESTED STOP':excluded.has(p.id)?'REMOVED':'ADDITIONAL MATCH'),element('h3',p.name));const score=element('div',p.reasons.length+' matching interests');score.className='score';card.append(score);p.reasons.forEach(r=>card.append(element('p',r)));const b=element('button',excluded.has(p.id)?'Include stop':'Remove stop');b.onclick=()=>{excluded.has(p.id)?excluded.delete(p.id):excluded.add(p.id);planned=false;render();};card.append(b);$('cards').append(card);
  }
  drawArtworkRoute(plannedRoute,toggle.checked);
  if(plannedRoute){
    const missing=plannedRoute.legs.filter(l=>l.error),connected=plannedRoute.legs.length-missing.length;
    routeStatus.textContent=missing.length?`Preview shown on the map: ${connected} of ${plannedRoute.legs.length} legs connected. ${missing.length} connection gaps need tracing; this is not a complete walking route.`:'Route shown on the campus map. Review the dashed candidate paths and approach assumptions.';
    routeStatus.setAttribute('role',missing.length?'alert':'status');
    issues.replaceChildren(...plannedRoute.warnings.map(t=>element('li',t)),...plannedRoute.anchors.map(a=>element('li',a.error?`${a.name}: ${a.error}`:`${a.name}: ${a.association==='explicit-preview-approach'?'selected preview':'nearest traced'} approach is ${Math.round(a.gapPixels)} artwork pixels from the building label; the final entrance approach is unverified and not drawn.`)));
    issues.prepend(element('li',plannedRoute.orderBasis));
    if(plannedRoute.geographicError)issues.append(element('li','GPS reference network: '+plannedRoute.geographicError));
    details.hidden=false;details.open=missing.length>0;
    $('notice').textContent=plannedRoute.disclaimer+' Solid colored lines follow visible traced paths; dashed colored lines follow candidate traces. Red rings identify disconnected approaches. No selected stop was silently removed.';
  }else $('notice').textContent='Choose interests to highlight buildings. Paths and routes use the illustration’s own coordinates. Gray lines are traced network context, not a generated route. Candidate sections are dashed. Accessibility is unverified.';
}
fetch('/data').then(r=>{if(!r.ok)throw Error('Campus data unavailable');return r.json();}).then(d=>{data=d;if(!window.L)throw Error('Map library unavailable. Reload to retry.');map=L.map('map').setView([37.9545,-91.773],16);markers=L.layerGroup().addTo(map);chips();render();}).catch(e=>{$('selection').textContent='Preview unavailable';routeStatus.textContent=e.message;routeStatus.setAttribute('role','alert');});
$('search').oninput=()=>data&&chips();
$('plan').onclick=async()=>{
  const token=++routeRequest;$('plan').disabled=true;$('plan').textContent='Calculating…';routeStatus.textContent='Calculating paths for your selected interests…';
  try{
    const response=await fetch('/walking-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stopIds:['havener-center',...chosen().map(p=>p.id)]}),signal:AbortSignal.timeout(30000)});
    const result=await response.json();if(token!==routeRequest)return;if(!response.ok)throw Error(result.error||'Route unavailable');
    plannedRoute=result;planned=true;render();fitArtworkStops(result.stopOrder);
  }catch(error){if(token!==routeRequest)return;planned=false;render();routeStatus.textContent='Unable to preview: '+(error.name==='TimeoutError'?'The request timed out. Please retry.':error.message);routeStatus.setAttribute('role','alert');}
  finally{if(token===routeRequest){$('plan').disabled=!chosen().length;$('plan').textContent='Preview my route →';}}
};
$('reset').onclick=()=>{selected.clear();excluded.clear();planned=false;$('search').value='';if(data){chips();render();}};
