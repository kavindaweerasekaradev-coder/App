"""Make lighter images for the site. Safe to re-run.

- Writes 600px and 1000px wide WebP copies (name-600.webp, name-1000.webp) next to every large
  image under assets/img/case-studies, dribbble and behance, for use in srcset.
- Converts Behance covers (PNG/JPG) to WebP next to the original.
Run: python3 -I scripts/optimize_images.py
"""
import glob
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIDTHS = (600, 1000)


def variants(path):
    base, ext = os.path.splitext(path)
    if base.endswith(("-600", "-1000")):
        return 0
    made = 0
    with Image.open(path) as im:
        im.load()
        mode = "RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB"
        for w in WIDTHS:
            out = f"{base}-{w}.webp"
            if im.width <= w * 1.15 or os.path.exists(out):
                continue
            h = round(im.height * w / im.width)
            im.convert(mode).resize((w, h), Image.LANCZOS).save(out, quality=78, method=6)
            made += 1
    return made


def main():
    made = 0
    for folder in ("case-studies", "dribbble"):
        for p in glob.glob(os.path.join(ROOT, "assets", "img", folder, "**", "*.webp"), recursive=True):
            made += variants(p)
    for p in glob.glob(os.path.join(ROOT, "assets", "img", "behance", "*")):
        base, ext = os.path.splitext(p)
        if ext.lower() in (".png", ".jpg", ".jpeg") and not os.path.exists(base + ".webp"):
            with Image.open(p) as im:
                im.convert("RGB").save(base + ".webp", quality=80, method=6)
            made += 1
    print("wrote", made, "files")


if __name__ == "__main__":
    main()
