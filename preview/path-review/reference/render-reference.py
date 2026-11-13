"""Static visual QA: geographic OSM paths over the downloaded aerial extent."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
root=Path(__file__).parent
meta=json.loads((root/'aerial-manifest.json').read_text())
extent=meta['extent']; image=Image.open(root/'aerial.jpg').convert('RGB')
canvas=Image.new('RGB',(image.width,image.height+65),'white');canvas.paste(image)
draw=ImageDraw.Draw(canvas)
def point(p):
    return ((p[0]-extent['xmin'])/(extent['xmax']-extent['xmin'])*image.width,
            (extent['ymax']-p[1])/(extent['ymax']-extent['ymin'])*image.height)
for feature in json.loads((root/'osm-features.geojson').read_text())['features']:
    if feature['properties']['reviewClass']=='pedestrian-reference-unverified' and feature['geometry']['type']=='LineString':
        draw.line([point(p) for p in feature['geometry']['coordinates']],fill='#ec9100' if feature['properties']['tags']['highway']=='steps' else '#00bfc8',width=2)
for feature in json.loads((root/'mst-features.geojson').read_text())['features']:
    if 'Entrances' in feature['properties']['folders'] and feature['geometry']['type']=='Point':
        x,y=point(feature['geometry']['coordinates'])
        if 0<=x<=image.width and 0<=y<=image.height:
            draw.ellipse((x-4,y-4,x+4,y+4),fill='#3478ff',outline='white',width=1)
draw.rectangle((0,image.height,image.width,canvas.height),fill='white')
draw.text((12,image.height+8),'REFERENCE ONLY | Teal: OSM pedestrian geometry | Orange: steps | Blue: S&T entrance records',fill='#153447')
draw.text((12,image.height+26),'Aerial: USGS / USDA / The National Map. Entrance reference: Missouri S&T Facilities. Capture date unconfirmed.',fill='#153447')
draw.text((12,image.height+44),'© OpenStreetMap contributors — https://www.openstreetmap.org/copyright (ODbL). No route approval implied.',fill='#153447')
canvas.save(root/'comparison.png')
print('Rendered geographic reference comparison; illustration graph unchanged.')
