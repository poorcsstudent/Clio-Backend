// Image-space adapter: only explicit official marker/name matches are plotted.
// Geographic coordinates are retained separately for the prototype ordering metric.
const originalFetch = window.fetch.bind(window);
const originalMap = L.map;
const originalCircle = L.circleMarker;
const originalPolyline = L.polyline;
let mstLayout, mstPlaces;
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
  const [dataResponse, layoutResponse] = await Promise.all([originalFetch(url, options), originalFetch('/map-layout')]);
  if (!layoutResponse.ok) throw Error('Official S&T map could not load. Reload to retry.');
  mstLayout = await layoutResponse.json();
  const data = await dataResponse.json(); mstPlaces = data.places;
  // Keep unmatched places in the interest cards, never guess their artwork position.
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
};
L.map = (id, options) => {
  const map = originalMap(id, { ...options, crs: L.CRS.Simple, minZoom: -3, maxZoom: 2 });
  const bounds = [[0, 0], [mstLayout.height, mstLayout.width]];
  L.imageOverlay(mstLayout.image, bounds, { attribution: 'Map artwork © Missouri S&T · <a href="https://www.mst.edu/map/overlay-map/" target="_blank" rel="noopener">Official map</a>' }).addTo(map);
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
L.polyline = (coordinates, options) => originalPolyline(coordinates.map(artworkPoint).filter(Boolean), options);
