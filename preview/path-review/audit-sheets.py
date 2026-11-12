"""Paired source/trace sheets for systematic coverage inspection."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).parent
source=Image.open(root.parent/'campus-tracing-source.png').convert('RGBA')
base=Image.new('RGBA',source.size,'#f7faf9');base.alpha_composite(source)
source=base.convert('RGB')
overlay=Image.open(root/'overlay-review.png').convert('RGB')
regions=[
 ('A Academic core',(1650,800,2450,1120)),
 ('B Academic north',(1750,650,2450,900)),
 ('C South campus',(1400,1080,2450,1450)),
 ('D Eastern campus',(2400,750,3050,1400)),
 ('E Athletics north',(200,850,1300,1250)),
 ('F Athletics south',(150,1200,1150,1600)),
 ('G Residential / bridge',(1100,150,1900,750)),
 ('H Tower / northeast',(2550,570,3114,880)),
 ('I Far west',(0,500,850,1000)),
 ('J Far north',(200,0,1100,400)),
 ('K Mine inset',(850,1450,1880,1746)),
 ('L Industrial inset',(2450,1360,3114,1746)),
 ('M West core / roundabout',(1250,700,1750,1100)),
 ('N Athletics transition',(850,700,1400,1100)),
]
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
for start in range(0,len(regions),2):
    sheet=Image.new('RGB',(1520,960),'white');draw=ImageDraw.Draw(sheet)
    for row,(label,box) in enumerate(regions[start:start+2]):
        y=row*480
        for column,image in enumerate([source,overlay]):
            draw.text((column*760+12,y+8),label+(' — source' if column==0 else ' — draft overlay'),fill='#153447',font=font)
            crop=image.crop(box);crop.thumbnail((744,430))
            sheet.paste(crop,(column*760+(760-crop.width)//2,y+44+(430-crop.height)//2))
    sheet.save(root/f'audit-{start//2+1:02}.png')
print(f'Created {len(regions)//2} paired source/overlay audit sheets.')
