"""Rich caption renderer for docu_render.
Caption dict keys:
  text: words; wrap a word in *stars* for accent colour, ~tildes~ for 2nd accent; "|" = line break
  style: serif | serif_big | sans | condensed | bebas | heavy | box | sticker | stack | glow | type
  anim: pop | type | rise | slam        (default per style)
  accent / accent2: colour name or hex (yellow, orange, red, gold, white, cream, cyan, green, pink)
  ink: "dark" to force dark text (auto on paper/grid)
  hl: {"type": circle|underline|marker|box|strike|scribble|arrow, "word": "million", "color": "yellow", "t": 0.3}
      (or a list of them)
"""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
SYS = "/usr/share/fonts/truetype/"
def _f(name, fallback):
    p = os.path.join(FD, name); return p if os.path.exists(p) else fallback
FONT = {
    "playfair_i": _f("PlayfairDisplay-Italic.ttf", SYS+"liberation/LiberationSerif-Italic.ttf"),
    "playfair":   _f("PlayfairDisplay.ttf", SYS+"liberation/LiberationSerif-Regular.ttf"),
    "dmserif_i":  _f("DMSerifDisplay-Italic.ttf", SYS+"liberation/LiberationSerif-BoldItalic.ttf"),
    "anton":      _f("Anton-Regular.ttf", SYS+"liberation/LiberationSans-Bold.ttf"),
    "bebas":      _f("BebasNeue-Regular.ttf", SYS+"liberation/LiberationSans-Bold.ttf"),
    "archivo":    _f("ArchivoBlack-Regular.ttf", SYS+"liberation/LiberationSans-Bold.ttf"),
    "inter":      _f("Inter.ttf", SYS+"liberation/LiberationSans-Bold.ttf"),
}
PAL = {"yellow": (242, 210, 60), "orange": (242, 150, 46), "red": (226, 48, 40), "gold": (214, 178, 92),
       "white": (255, 255, 255), "cream": (244, 236, 214), "cyan": (90, 210, 235), "green": (80, 200, 120),
       "pink": (240, 110, 160), "black": (15, 15, 15)}
def col(c, a=255):
    if isinstance(c, (list, tuple)): return tuple(c[:3]) + (a,)
    if isinstance(c, str) and c.startswith("#"):
        return tuple(int(c[i:i+2], 16) for i in (1, 3, 5)) + (a,)
    return PAL.get(c, (255, 255, 255)) + (a,)

_cache = {}
def font(key, size, wght=None):
    k = (key, size, wght)
    if k not in _cache:
        f = ImageFont.truetype(FONT[key], size)
        if wght:
            try: f.set_variation_by_axes([wght] if key != "inter" else [32, wght])
            except Exception:
                try: f.set_variation_by_axes([wght])
                except Exception: pass
        _cache[k] = f
    return _cache[k]

# style -> (font key, weight, size mult, upper, default anim, default accent)
STY = {
    "serif":     ("playfair_i", 500, 1.0, False, "pop", "yellow"),
    "serif_big": ("dmserif_i", None, 1.5, False, "slam", "yellow"),
    "sans":      ("inter", 700, .95, False, "type", "orange"),
    "condensed": ("anton", None, 1.05, False, "slam", "yellow"),
    "bebas":     ("bebas", None, 1.35, True, "rise", "yellow"),
    "heavy":     ("archivo", None, 1.0, True, "slam", "yellow"),
    "box":       ("playfair_i", 600, 1.0, False, "pop", "yellow"),
    "sticker":   ("archivo", None, .82, False, "slam", "black"),
    "stack":     ("dmserif_i", None, 1.0, False, "rise", "red"),
    "glow":      ("inter", 700, 1.0, False, "type", "orange"),
    "type":      ("playfair_i", 500, 1.0, False, "type", "yellow"),
}

def ease(x): x = max(0., min(1., x)); return x*x*(3-2*x)
def back(x):
    x = max(0., min(1., x)); c = 1.7; return 1 + (c+1)*(x-1)**3 + c*(x-1)**2

def _parse(text):
    """*a span* -> accent, ~a span~ -> accent2; spans may cover several words."""
    lines = []; mode = None
    for ln in text.split("|"):
        ws = []
        for w in ln.strip().split():
            tag = mode
            for ch, m in (("*", "a"), ("~", "b")):
                if w.startswith(ch) and mode is None: mode = m; tag = m; w = w[1:]
                if ch in w and mode == m:
                    w = w.replace(ch, ""); tag = m; mode = None
            if w: ws.append((w, tag))
        lines.append(ws)
    return lines

def _layout(c, base):
    style = c.get("style", "serif")
    fk, wg, mult, upper, _, _ = STY.get(style, STY["serif"])
    lines = _parse(c["text"])
    out = []; y = 0
    for li, ws in enumerate(lines):
        m = mult
        if style == "stack": m = .75 if (li == 0 and len(lines) > 1) else 1.7
        size = int(c.get("size", base) * m)
        f = font(fk, size, wg)
        words = [((w.upper() if upper else w), tg) for w, tg in ws]
        sp = f.getlength(" ")
        x = 0; row = []
        for w, tg in words:
            wl = f.getlength(w); row.append([w, tg, x, wl]); x += wl + sp
        lh = int(size * (1.05 if style in ("condensed", "bebas", "heavy", "stack") else 1.22))
        out.append({"font": f, "size": size, "row": row, "w": x - sp if row else 0, "y": y, "h": lh, "li": li})
        y += lh
    return out, y

def render(c, tl, light, base=46):
    """c caption dict, tl seconds since caption start, light=background is light. Returns RGBA, or None."""
    style = c.get("style", "serif"); st = STY.get(style, STY["serif"])
    anim = c.get("anim", st[4])
    dark = light or c.get("ink") == "dark"
    ink = col("black") if dark else col(c.get("color", "white"))
    acc = col(c.get("accent", st[5])); acc2 = col(c.get("accent2", "orange"))
    if style == "stack" and "accent" not in c: acc = col("red")
    if style == "sticker": ink = col(c.get("color", "black"))
    L, th = _layout(c, base)
    tw = max(l["w"] for l in L); P = 60
    W, H = int(tw + 2*P), int(th + 2*P)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # word list with absolute boxes
    words = []
    for l in L:
        x0 = P + (tw - l["w"]) / 2
        for w, tg, x, wl in l["row"]:
            asc = l["font"].getbbox(w)
            words.append(dict(w=w, tg=tg, x=x0+x, y=P+l["y"], wl=wl, f=l["font"], size=l["size"],
                              box=(x0+x+asc[0], P+l["y"]+asc[1], x0+x+asc[2], P+l["y"]+asc[3])))
    n = len(words)
    # per-word reveal for type anim
    def wvis(i):
        if anim != "type": return 1.0
        return ease((tl - i*0.075) / 0.12)
    # ---- backgrounds
    if style == "box":
        d = ImageDraw.Draw(im); d.rectangle([P-18, P-10, P+tw+18, P+th+4], fill=(10, 10, 10, 235))
    elif style == "sticker":
        bg = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(bg)
        x0, y0, x1, y1 = P-22, P-8, P+tw+22, P+th+6
        pts = [(x0, y0+3), (x0+(x1-x0)*.3, y0-2), (x0+(x1-x0)*.7, y0+2), (x1, y0-1),
               (x1+3, y1-2), (x0+(x1-x0)*.6, y1+3), (x0+(x1-x0)*.2, y1-1), (x0-2, y1+2)]
        d.polygon(pts, fill=col(c.get("bg", "yellow")))
        sh = bg.filter(ImageFilter.GaussianBlur(6)).point(lambda v: v)  # drop shadow
        sa = np.asarray(sh).copy(); sa[..., :3] = 0; sa[..., 3] = (sa[..., 3]*.5).astype(np.uint8)
        im = Image.alpha_composite(im, Image.fromarray(sa).transform((W, H), Image.AFFINE, (1, 0, -4, 0, 1, -6)))
        im = Image.alpha_composite(im, bg)
    elif not dark and style in ("serif", "type", "sans", "glow", "stack", "serif_big", "heavy", "condensed", "bebas"):
        sc = Image.new("RGBA", (W, H)); ImageDraw.Draw(sc).rounded_rectangle(
            [P-26, P-14, P+tw+26, P+th+8], 22, fill=(0, 0, 0, 140))
        im = Image.alpha_composite(im, sc.filter(ImageFilter.GaussianBlur(16)))
    # ---- highlights
    hls = c.get("hl", []); hls = hls if isinstance(hls, list) else [hls]
    def target(h):
        key = h.get("word", "").lower().strip(".,!?:")
        ks = key.split()
        for i, wd in enumerate(words):
            if wd["w"].lower().strip(".,!?:;") == (ks[0] if ks else ""):
                j = i + len(ks) - 1
                if j < n:
                    a, b = words[i]["box"], words[j]["box"]
                    return (a[0], min(a[1], b[1]), b[2], max(a[3], b[3])), i
        b = [w["box"] for w in words]
        return (min(x[0] for x in b), min(x[1] for x in b), max(x[2] for x in b), max(x[3] for x in b)), 0
    under, over = Image.new("RGBA", (W, H)), Image.new("RGBA", (W, H))
    for h in hls:
        (x0, y0, x1, y1), wi = target(h)
        k = ease((tl - h.get("t", 0.25 + wi*.075*(anim == "type"))) / h.get("dur", .4))
        if k <= 0: continue
        hc = col(h.get("color", "yellow")); typ = h.get("type", "circle")
        lw = int(h.get("width", max(3, (y1-y0)*.09)))
        if typ == "marker":
            d = ImageDraw.Draw(under); mc = hc[:3] + (int(h.get("alpha", 200)),)
            d.rounded_rectangle([x0-8, y0+(y1-y0)*.15, x0-8+(x1-x0+16)*k, y1+6], 6, fill=mc)
        elif typ == "box":
            d = ImageDraw.Draw(over); per = 2*((x1-x0)+(y1-y0)+40)*k
            pts = [(x0-12, y0-10), (x1+12, y0-10), (x1+12, y1+10), (x0-12, y1+10), (x0-12, y0-10)]
            _poly_partial(d, pts, per, hc, lw)
        elif typ == "underline":
            d = ImageDraw.Draw(over); yy = y1 + 8
            pts = [(x0 + (x1-x0+10)*u*k - 5, yy + 5*math.sin(u*k*3.2) - 6*u*k) for u in np.linspace(0, 1, 40)]
            d.line(pts, fill=hc, width=lw+1, joint="curve")
        elif typ == "strike":
            d = ImageDraw.Draw(over); ym = (y0+y1)/2 + 2
            d.line([(x0-6, ym+3), (x0-6+(x1-x0+12)*k, ym-3)], fill=hc, width=lw+1)
        elif typ == "scribble":
            d = ImageDraw.Draw(over); yy = y1 + 6
            pts = [(x0 + (x1-x0)*u*k, yy + 7*math.sin(u*k*30)) for u in np.linspace(0, 1, 90)]
            d.line(pts, fill=hc, width=max(2, lw-1), joint="curve")
        elif typ == "arrow":
            d = ImageDraw.Draw(over); ax, ay = (x0+x1)/2, y1 + 10
            sx, sy = ax + 70, ay + 80; ex = sx + (ax-sx)*k; ey = sy + (ay-sy)*k
            d.line([(sx, sy), (ex, ey)], fill=hc, width=lw)
            if k > .9: d.line([(ax-12, ay+14), (ax, ay), (ax+16, ay+8)], fill=hc, width=lw)
        else:  # circle
            d = ImageDraw.Draw(over); cx, cy = (x0+x1)/2, (y0+y1)/2 + 2
            rx, ry = (x1-x0)/2 + 22, (y1-y0)/2 + 16
            pts = [(cx + rx*math.cos(a), cy + ry*math.sin(a) + 3*math.sin(a*2.5))
                   for a in np.linspace(-2.3, -2.3 + 2*math.pi*1.1*k, 70)]
            d.line(pts, fill=hc, width=lw, joint="curve")
        if h.get("glow", typ in ("circle",) and not dark):
            g = over.filter(ImageFilter.GaussianBlur(6)); over = Image.alpha_composite(g, over)
    im = Image.alpha_composite(im, under)
    # ---- text
    txt = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(txt)
    glow_l = Image.new("RGBA", (W, H)); gd = ImageDraw.Draw(glow_l)
    shadow = Image.new("RGBA", (W, H)); sd = ImageDraw.Draw(shadow)
    for i, wd in enumerate(words):
        v = wvis(i)
        if v <= 0: continue
        fill = acc if wd["tg"] == "a" else acc2 if wd["tg"] == "b" else ink
        if style == "stack" and len(L) > 1 and wd["size"] == max(l["size"] for l in L) and wd["tg"] is None:
            fill = acc
        if style == "box": fill = acc if wd["tg"] else col("white")
        a = int(255*v); f = fill[:3] + (a,)
        dy = (1-v)*14 if anim == "type" else 0
        pos = (wd["x"], wd["y"] + dy)
        sw = max(2, wd["size"]//22) if style in ("heavy", "condensed", "bebas") and not dark else 0
        if not dark and style not in ("box", "sticker"):
            sd.text((pos[0], pos[1]+3), wd["w"], font=wd["f"], fill=(0, 0, 0, int(170*v)))
        has_marker = any(h.get("type") == "marker" for h in hls)
        if not has_marker and (style == "glow" or wd["tg"]) and style in ("glow", "sans", "serif_big", "stack") and not dark:
            gd.text(pos, wd["w"], font=wd["f"], fill=fill[:3] + (int(230*v),))
        d.text(pos, wd["w"], font=wd["f"], fill=f, stroke_width=sw, stroke_fill=(0, 0, 0, int(200*v)))
    im = Image.alpha_composite(im, shadow.filter(ImageFilter.GaussianBlur(5)))
    g = glow_l.filter(ImageFilter.GaussianBlur(10)); im = Image.alpha_composite(im, g); im = Image.alpha_composite(im, g)
    im = Image.alpha_composite(im, txt)
    im = Image.alpha_composite(im, over)
    if style == "sticker": im = im.rotate(c.get("tilt", 3), expand=True, resample=Image.BICUBIC)
    elif "tilt" in c: im = im.rotate(c["tilt"], expand=True, resample=Image.BICUBIC)
    return im, anim

def _poly_partial(d, pts, length, colr, w):
    left = length
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        seg = math.hypot(bx-ax, by-ay)
        if left <= 0: break
        k = min(1, left/seg); d.line([(ax, ay), (ax+(bx-ax)*k, ay+(by-ay)*k)], fill=colr, width=w); left -= seg

def entrance(anim, tl):
    """returns alpha, scale, blur, dy for the whole element"""
    if anim == "type": return 1.0, 1.0, 0, 0
    if anim == "rise":
        k = ease(tl/.3); return k, 1.0, (1-k)*4, (1-k)*30
    if anim == "slam":
        k = ease(tl/.16); return k, 1 + .45*(1-back(tl/.22)) if tl < .22 else 1.0, (1-k)*3, 0
    k = ease(tl/.18); return k, .92 + .08*back(tl/.25), (1-k)*6, 0
