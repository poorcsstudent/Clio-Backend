"""Coordinate-labeled inspection crop; never modifies the source artwork."""
from pathlib import Path
from PIL import Image, ImageDraw
import sys
root=Path(__file__).resolve().parents[1]
image=Image.open(root/'preview/campus-tracing-source.png').convert('RGB')
box=tuple(map(int,sys.argv[1:5])) if len(sys.argv)==5 else (1550,650,2650,1300)
crop=image.crop(box)
draw=ImageDraw.Draw(crop)
for x in range((box[0]//100+1)*100,box[2],100):
    draw.line((x-box[0],0,x-box[0],box[3]-box[1]),fill='#555555',width=1)
    draw.text((x-box[0]+2,2),str(x),fill='black',stroke_width=2,stroke_fill='white')
for y in range((box[1]//100+1)*100,box[3],100):
    draw.line((0,y-box[1],box[2]-box[0],y-box[1]),fill='#555555',width=1)
    draw.text((2,y-box[1]+2),str(y),fill='black',stroke_width=2,stroke_fill='white')
crop.save(root.parent/'artwork-core-inspection.png')
