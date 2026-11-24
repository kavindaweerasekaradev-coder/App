#!/usr/bin/env python3
"""Remove the background from a photo of a person and save a tight transparent PNG.
Usage: python3 cutout.py input.(jpg|png|avif|webp) output.png
If the input already has a transparent background it is only cropped.
Needs: pip install --break-system-packages "rembg[cpu]" pillow-avif-plugin
"""
import sys
from PIL import Image
try:
    import pillow_avif  # noqa: F401  (enables .avif)
except ImportError:
    pass

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src)
if im.mode == "RGBA" and im.split()[3].getextrema()[0] < 10:
    res = im
else:
    from rembg import remove, new_session
    res = remove(im.convert("RGB"), session=new_session("isnet-general-use"), post_process_mask=True)
res = res.crop(res.getbbox())
res.save(out)
print("saved", out, res.size)
