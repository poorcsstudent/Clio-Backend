"""Lossless inspection crops; never alter the source artwork or graph."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).parent
image = Image.open(root.parent / 'campus-tracing-source.png')
regions = {
    'core': (1650, 800, 2450, 1120),
    'east': (2400, 750, 3050, 1400),
    'north': (1100, 150, 1900, 750),
    'west': (200, 850, 1300, 1600),
    'south': (1400, 1080, 2450, 1450),
    'inset-west': (850,1450,1880,1746),
    'inset-east': (2450,1360,3114,1746),
    'far-north': (200,0,1100,400),
    'northeast': (2550,570,3114,880),
    'far-west': (0,500,850,1000),
    'academic-north': (1750,650,2450,900),
    'west-core': (1250,700,1750,1100),
    'middle-west': (850,700,1400,1100),
    'inner-quad': (1850,850,2050,1000),
    'inner-east': (2180,920,2440,1110),
    'havener-court': (1800,810,1950,920),
}
for name, box in regions.items():
    image.crop(box).save(root / f'inspect-{name}.png')
    if name in ('inner-quad', 'inner-east', 'havener-court'):
        crop = image.crop(box)
        crop.resize((crop.width*3, crop.height*3)).save(root / f'inspect-{name}-zoom.png')
        grid = crop.resize((crop.width*3, crop.height*3)).convert('RGB')
        draw = ImageDraw.Draw(grid)
        for x in range(0, crop.width, 20):
            draw.line((x*3, 0, x*3, grid.height), fill='#727d87', width=1)
            draw.text((x*3+2, 2), str(box[0]+x), fill='#b00045', stroke_width=1, stroke_fill='white')
        for y in range(0, crop.height, 20):
            draw.line((0, y*3, grid.width, y*3), fill='#727d87', width=1)
            draw.text((2, y*3+12), str(box[1]+y), fill='#b00045', stroke_width=1, stroke_fill='white')
        grid.save(root / f'inspect-{name}-grid.png')
