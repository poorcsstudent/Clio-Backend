"""Render review sheets from graph geometry, without modifying source artwork."""
from pathlib import Path
import json
from PIL import Image, ImageDraw

root = Path(__file__).parent
graph = json.loads((root / 'graph-draft.json').read_text())
source = Image.open(root.parent / 'campus-tracing-source.png').convert('RGBA')
size = (graph['width'], graph['height'])

def render(overlay, candidates):
    canvas = Image.new('RGBA', size, '#f7faf9')
    if overlay:
        base = Image.new('RGBA', size, '#f7faf9')
        base.alpha_composite(source)
        canvas = Image.blend(canvas, base, .7)
    draw = ImageDraw.Draw(canvas)
    nodes = set()
    for edge in graph['edges']:
        candidate = edge['status'] == 'needs-geometry-review'
        if candidate and not candidates:
            continue
        points = [tuple(p) for p in edge['points']]
        color = '#c86200' if candidate else '#007e85'
        if not candidate:
            draw.line(points, fill=color, width=4, joint='curve')
        else:
            # Per-segment dash pattern; candidate paths are visually distinct.
            for a, b in zip(points, points[1:]):
                dx, dy = b[0]-a[0], b[1]-a[1]
                length = (dx*dx+dy*dy)**.5
                for start in range(0, int(length), 15):
                    end = min(start+9, length)
                    draw.line([(a[0]+dx*start/length,a[1]+dy*start/length),
                               (a[0]+dx*end/length,a[1]+dy*end/length)], fill=color,width=4)
        nodes.update([edge['from'], edge['to']])
    for node in graph['nodes']:
        if node['id'] in nodes:
            x,y=node['x'],node['y']
            draw.ellipse((x-5,y-5,x+5,y+5),fill='white',outline='#143e58',width=2)
    return canvas.convert('RGB')

for overlay in (False, True):
    name = 'overlay' if overlay else 'network'
    rendered = render(overlay, True)
    rendered.save(root / f'{name}-review.png')
    rendered.crop((1650,800,2450,1120)).resize((1200,480)).save(root / f'{name}-core.png')
render(False,False).save(root / 'visible-network.png')
print('Rendered full-size and core review PNGs; no geospatial claims.')
