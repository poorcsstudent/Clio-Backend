// Image-space adapter: only explicit official marker/name matches are plotted.
// GPS reference ordering stays separate from traced artwork path geometry.
const originalFetch = window.fetch.bind(window);
const originalMap = L.map;
const originalCircle = L.circleMarker;
const originalPolyline = L.polyline;
let mstLayout, mstPlaces, mstGraph, artworkLayers;
const tourCategories = {
  start: { label: 'Start / Welcome', color: '#e5b94f' },
  academics: { label: 'Academics', color: '#3978d4' },
  life: { label: 'Campus life', color: '#16825d' },
  housing: { label: 'Housing', color: '#9253bd' },
  landmarks: { label: 'History & landmarks', color: '#bd6330' },
};
function categoryFor(place) {
  if (place.id === 'havener-center') return tourCategories.start;
  if (/housing/i.test(place.category)) return tourCategories.housing;
  if (/landmark|historic/i.test(place.category)) return tourCategories.landmarks;
  if (data.programs.some(program => selected.has(program.id)
    && program.places.some(link => link.placeId === place.id))) return tourCategories.academics;
  return tourCategories.life;
}
const markerStyle = document.createElement('style');
markerStyle.textContent = '.tour-stop-icon{background:none;border:0}.tour-stop-dot{display:grid;place-items:center;width:28px;height:28px;border:2px solid white;border-radius:50%;color:white;font:bold 13px system-ui;box-shadow:0 2px 7px #0007}.legend{flex-wrap:wrap}';
document.head.append(markerStyle);
const artworkPoint = coordinate => {
  const place = mstPlaces.find(p => p.latitude === coordinate[0] && p.longitude === coordinate[1]);
  return place && mstLayout.positions[place.id];
};
window.fetch = async (url, options) => {
  if (url !== '/data') return originalFetch(url, options);
  const [dataResponse, layoutResponse, graphResponse] = await Promise.all([originalFetch(url, options), originalFetch('/map-layout'),originalFetch('/artwork-network')]);
  if (!layoutResponse.ok) throw Error('Official S&T map could not load. Reload to retry.');
  mstLayout = await layoutResponse.json();
  if(!graphResponse.ok)throw Error('Traced path data could not load. Reload to retry.');
  mstGraph=await graphResponse.json();
  const data = await dataResponse.json(); mstPlaces = data.places;
  // Keep unmatched places in the interest cards, never guess their artwork position.
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
};
L.map = (id, options) => {
  const map = originalMap(id, { ...options, crs: L.CRS.Simple, minZoom: -3, maxZoom: 2 });
  const bounds = [[0, 0], [mstLayout.height, mstLayout.width]];
  L.imageOverlay(mstLayout.image, bounds, { attribution: 'Map artwork © Missouri S&T · <a href="https://www.mst.edu/map/overlay-map/" target="_blank" rel="noopener">Official map</a> · GPS reference © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap / ODbL</a>' }).addTo(map);
  // Existing initial GPS view is replaced with the illustration extent.
  const setView = map.setView;
  map.setView = () => { map.setView = setView; map.fitBounds(bounds); return map; };
  return map;
};
L.tileLayer = () => ({ addTo: () => {} });
L.circleMarker = (coordinate, options) => {
  const point = artworkPoint(coordinate);
  const place = mstPlaces.find(p => p.latitude === coordinate[0] && p.longitude === coordinate[1]);
  const legend = document.querySelector('.legend');
  legend.replaceChildren();
  for (const category of Object.values(tourCategories)) {
    const item = document.createElement('span');
    const dot = document.createElement('i'); dot.className = 'dot'; dot.style.background = category.color;
    item.append(dot, document.createTextNode(category.label)); legend.append(item);
  }
  const tunnelLegend=document.createElement('span');tunnelLegend.textContent='◉ Underground pedestrian passage';tunnelLegend.style.color='#66e3f0';legend.append(tunnelLegend);
  if (point && planned) {
    const index = order(chosen()).findIndex(stop => stop.id === place.id);
    if (index >= 0) {
      const category = categoryFor(place);
      const marker = L.marker(point, { icon: L.divIcon({ className: 'tour-stop-icon',
        html: '<span class="tour-stop-dot" style="background:' + category.color + '">' + (index + 1) + '</span>',
        iconSize: [28, 28], iconAnchor: [14, 14] }),
        title: 'Stop ' + (index + 1) + ': ' + place.name + ' · ' + category.label,
        alt: 'Stop ' + (index + 1) + ': ' + place.name + ' · ' + category.label });
      marker.bindTooltip(category.label, { direction: 'top' });
      return marker;
    }
  } else if (point && !planned && options.weight === 3) {
    // Before confirmation show interest highlights, never the internal building IDs.
    return originalCircle(point, { ...options, radius: 8, color: categoryFor(place).color,
      fillColor: categoryFor(place).color, fillOpacity: 0.7 });
  }
  return { bindPopup() { return this; }, addTo() { return this; } };
};
function drawArtworkRoute(route,showNetwork){
  if(artworkLayers)map.removeLayer(artworkLayers);
  artworkLayers=L.layerGroup().addTo(map);
  const point=p=>[mstGraph.height-p[1],p[0]];
  if(showNetwork)for(const edge of mstGraph.edges.filter(e=>e.frame==='main'))originalPolyline(edge.points.map(point),{color:'#56756d',weight:2,opacity:.55,dashArray:edge.status==='visible-path-draft'?undefined:'4 6',interactive:false}).addTo(artworkLayers);
  // Keep tunnel entrances discoverable even when the background traces are hidden.
  for(const edge of mstGraph.edges.filter(e=>e.structure==='tunnel')){
    const description=edge.label+' — underground pedestrian passage. Access and accessibility unverified.';
    originalPolyline(edge.points.map(point),{color:'#66e3f0',weight:5,opacity:.95,dashArray:'3 6'}).bindTooltip(description).addTo(artworkLayers);
    for(const entrance of [edge.points[0],edge.points.at(-1)])originalCircle(point(entrance),{color:'#113c43',fillColor:'#66e3f0',fillOpacity:1,radius:5,weight:2}).bindTooltip(description+' Entrance.').addTo(artworkLayers);
  }
  if(!route)return;
  for(const leg of route.legs){
    const place=mstPlaces.find(p=>p.id===leg.toStopId),color=categoryFor(place).color;
    for(const part of leg.parts){
      originalPolyline(part.points.map(point),{color:'#fff',weight:7,opacity:.75,interactive:false}).addTo(artworkLayers);
      originalPolyline(part.points.map(point),{color:part.structure==='tunnel'?'#66e3f0':color,weight:4,opacity:1,dashArray:part.structure==='tunnel'?'3 6':part.candidate?'7 5':undefined}).bindTooltip((part.structure==='tunnel'?part.label+' — underground pedestrian passage. ':'')+(part.assumption||part.reviewKey)).addTo(artworkLayers);
    }
    if(leg.error)for(const p of leg.gapPoints||route.anchors.filter(a=>[leg.fromStopId,leg.toStopId].includes(a.stopId)&&a.point).map(a=>a.point))originalCircle(point(p),{color:'#ff876f',fillOpacity:.1,radius:9,weight:3}).bindTooltip(leg.error).addTo(artworkLayers);
  }
}
function fitArtworkStops(ids){const points=ids.map(id=>mstLayout.positions[id]).filter(Boolean);if(points.length)map.fitBounds(points,{padding:[65,65],maxZoom:1,animate:false});}
