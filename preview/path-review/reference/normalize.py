"""Local reference layers only: never imported by Clio routing.

OSM topology uses shared node IDs, not proximity. KML descriptions/HTML are
deliberately omitted. Official detours are historical references, not routes.
"""
import json, math, hashlib
from pathlib import Path
import xml.etree.ElementTree as ET
from collections import Counter

ROOT = Path(__file__).parent
NS = {'k':'http://www.opengis.net/kml/2.2'}
PEDESTRIAN = {'footway','path','pedestrian','steps','cycleway'}

def write(name, data):
    (ROOT/name).write_text(json.dumps(data, indent=2), encoding='utf-8')

def distance(a,b):
    lon1,lat1,lon2,lat2 = map(math.radians, [*a,*b])
    h=math.sin((lat2-lat1)/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 6371008.8*2*math.asin(min(1,math.sqrt(h)))

def classify(tags):
    if tags.get('area')=='yes': return 'area-not-centerline'
    if tags.get('highway') not in PEDESTRIAN: return 'background-not-pedestrian-centerline'
    if tags.get('foot') in ('no','private') or tags.get('access') in ('no','private'): return 'restricted-excluded'
    if tags.get('highway')=='cycleway' and tags.get('foot') not in ('yes','designated','permissive'): return 'cycleway-foot-access-unconfirmed'
    return 'pedestrian-reference-unverified'

def osm_layers(raw):
    features=[]; nodes={}; edges=[]; malformed=[]
    node_tags={item['id']:item.get('tags',{}) for item in raw['elements'] if item['type']=='node'}
    for item in raw['elements']:
        tags=item.get('tags',{})
        props={'source':'osm','sourceId':f"{item['type']}/{item['id']}", 'tags':tags,
               'sourceTimestamp':item.get('timestamp'), 'reviewClass':classify(tags), 'routingEligible':False}
        if item['type']=='node':
            geometry={'type':'Point','coordinates':[item['lon'],item['lat']]}
        elif item['type']=='way' and item.get('geometry'):
            if any('lon' not in p or 'lat' not in p for p in item['geometry']):
                malformed.append(props['sourceId']); continue
            coords=[[p['lon'],p['lat']] for p in item['geometry']]
            polygon=bool(tags.get('building') or tags.get('area')=='yes') and len(coords)>=4 and coords[0]==coords[-1]
            geometry={'type':'Polygon' if polygon else 'LineString','coordinates':[coords] if polygon else coords}
            if props['reviewClass']=='pedestrian-reference-unverified':
                if len(item.get('nodes',[]))!=len(coords):
                    malformed.append(props['sourceId']); continue
                for node_id,p in zip(item['nodes'],coords):
                    key=f'osm-node-{node_id}'
                    if key in nodes and nodes[key]['coordinate']!=p: raise ValueError('Conflicting OSM node coordinates')
                    nodes[key]={'id':key,'coordinate':p,'sourceId':f'node/{node_id}','tags':node_tags.get(node_id,{})}
                for index,(a,b) in enumerate(zip(coords,coords[1:])):
                    if item['nodes'][index]==item['nodes'][index+1] or a==b: continue
                    edges.append({'id':f"osm-way-{item['id']}-{index}",'from':f"osm-node-{item['nodes'][index]}",
                        'to':f"osm-node-{item['nodes'][index+1]}",'coordinates':[a,b],
                        'lengthMeters':round(distance(a,b),3),'distanceBasis':'geodesic estimate from OSM geometry',
                        'sourceId':props['sourceId'],'tags':tags,'routingEligible':False,'displayTraceKeys':[]})
        else: continue
        features.append({'type':'Feature','geometry':geometry,'properties':props})
    return {'type':'FeatureCollection','features':features}, {'coordinateSystem':'WGS84 longitude,latitude','status':'REFERENCE_ONLY_NOT_APPROVED','nodes':list(nodes.values()),'edges':edges}, malformed

def kml_layers(file):
    features=[]
    def coordinates(text):
        return [[float(v) for v in token.split(',')[:2]] for token in (text or '').split()]
    def visit(element,folders):
        tag=element.tag.split('}')[-1]
        if tag=='Folder': folders=folders+[element.findtext('k:name',default='',namespaces=NS)]
        if tag=='Placemark':
            name=element.findtext('k:name',default='',namespaces=NS)
            for part in element.iter():
                kind=part.tag.split('}')[-1]
                if kind not in ('Point','LineString','Polygon'): continue
                if kind=='Polygon':
                    rings=[coordinates(r.text) for r in part.findall('.//k:LinearRing/k:coordinates',NS)]
                    if not rings: continue
                    coord=rings
                else:
                    c=coordinates(part.findtext('k:coordinates',default='',namespaces=NS))
                    if not c: continue
                    coord=c[0] if kind=='Point' else c
                ident='mst-'+hashlib.sha256(json.dumps([folders,name,kind,coord]).encode()).hexdigest()[:16]
                features.append({'type':'Feature','geometry':{'type':kind,'coordinates':coord},'properties':{
                    'source':'mst-wayfinder','sourceId':ident,'name':name,'folders':folders,
                    'sourceClaimsADA':'ADA' in name,'accessibilityVerified':False,
                    'historicalDetour':'detour' in name.lower(),'routingEligible':False}})
            return
        for child in element: visit(child,folders)
    visit(ET.parse(file).getroot(),[])
    return {'type':'FeatureCollection','features':features}

def nearest(point,a,b):
    # Local equirectangular projection is adequate for a short-distance REVIEW
    # ranking. It is never used to create a graph link or navigation instruction.
    c=math.cos(math.radians(point[1])); scale=math.pi*6371008.8/180
    ax=(a[0]-point[0])*scale*c; ay=(a[1]-point[1])*scale
    bx=(b[0]-point[0])*scale*c; by=(b[1]-point[1])*scale
    dx=bx-ax;dy=by-ay;den=dx*dx+dy*dy
    t=max(0,min(1,-(ax*dx+ay*dy)/den)) if den else 0
    return math.hypot(ax+t*dx,ay+t*dy)

def main():
    manifest=json.loads((ROOT/'source-manifest.json').read_text(encoding='utf-8'))
    for source in manifest['sources']:
        if source['status']!='downloaded': raise ValueError('Source download incomplete: '+source['id'])
        if hashlib.sha256((ROOT/source['file']).read_bytes()).hexdigest()!=source['sha256']:
            raise ValueError('Source checksum mismatch: '+source['id'])
    raw=json.loads((ROOT/'osm.json').read_text(encoding='utf-8'))
    osm,graph,malformed=osm_layers(raw); mst=kml_layers(ROOT/'mst-wayfinder.kml')
    entrances=[f for f in mst['features'] if 'Entrances' in f['properties']['folders'] and f['geometry']['type']=='Point']
    suggestions=[]
    for entrance in entrances:
        # Group by way so three adjacent pieces of one way do not hide alternatives.
        candidates={}
        for edge in graph['edges']:
            gap=nearest(entrance['geometry']['coordinates'],*edge['coordinates'])
            if gap<=30 and (edge['sourceId'] not in candidates or gap<candidates[edge['sourceId']]['gapMeters']):
                candidates[edge['sourceId']]={'edgeId':edge['id'],'sourceId':edge['sourceId'],'gapMeters':round(gap,2)}
        suggestions.append({'entranceId':entrance['properties']['sourceId'],'name':entrance['properties']['name'],
            'candidates':sorted(candidates.values(),key=lambda c:c['gapMeters'])[:3],
            'status':'REVIEW_ONLY_DO_NOT_AUTO_CONNECT','warning':'Nearest geometry may be across a wall, road, steps, fence, or different level.'})
    write('osm-features.geojson',osm);write('mst-features.geojson',mst);write('reference-graph.json',graph);write('entrance-candidates.json',suggestions)
    summary={'osmBaseTimestamp':raw.get('osm3s',{}).get('timestamp_osm_base'),
        'osmFeatures':len(osm['features']),'osmWayClasses':dict(Counter(f['properties']['reviewClass'] for f in osm['features'] if f['properties']['sourceId'].startswith('way/'))),
        'referenceNodes':len(graph['nodes']),'referenceEdges':len(graph['edges']),
        'mstFeatures':len(mst['features']),'officialEntrances':len(entrances),
        'sourceLabeledADAEntrances':sum(f['properties']['sourceClaimsADA'] for f in entrances),
        'officialDetourLines':[f['properties']['name'] for f in mst['features'] if f['properties']['historicalDetour']],
        'entrancesWithGeometryWithin30m':sum(bool(s['candidates']) for s in suggestions),
        'malformedOSMWays':malformed,'automaticallyConnectedEntrances':0,'approvedDisplayMatches':0,
        'cautions':['KML filename is dated 2024-05-16; no current-condition guarantee.','Official detours are not imported into the walking graph.','OSM bbox includes surrounding streets and is not a campus ownership boundary.','All graph edges are locked out of production routing.','No distances are inferred from illustration pixels.']}
    write('summary.json',summary); print(json.dumps(summary,indent=2))

if __name__=='__main__': main()
