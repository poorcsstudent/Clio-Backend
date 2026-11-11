"""Lossless inspection crops; never alter the source artwork or graph."""
from pathlib import Path
from PIL import Image

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
}
for name, box in regions.items():
    image.crop(box).save(root / f'inspect-{name}.png')
