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
}
for name, box in regions.items():
    image.crop(box).save(root / f'inspect-{name}.png')
