"""'Torn-paper article' layout (Now-You-Know style).
Shot keys (layout:"article"):
  title: "JORDAN & THE|PALESTINIANS"   heavy chroma-split heading at top (optional)
  paras: [{"t":0.2,"text":"In 1970, Jordan housed *1 million Palestinians.*","dur":1.6}, ...]
         words ink in grey->black over dur; *spans* get a yellow marker sweep after they appear
  strips: [{"t":0,"src":"img.jpg"}, ...]   photo in a torn strip at the bottom, orange duotone
  strip_tone: "orange" | "sepia" | "grey"; strip_top: 0.66
  center: true  -> paragraph block vertically centred (question cards)
layout:"title": big heading centred over a faded photo (bg = image), chroma split + settle
Global spec key  "watermark": {"text":"Now you know"}  tilted tag drawn on every frame.
"""
import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
def F(name, size, w=None):
    f = ImageFont.truetype(os.path.join(FD, name), size)
    if w:
        try: f.set_variation_by_axes([w])
        except Exception: pass
    return f
SERIF = lambda s: F("InstrumentSerif-Regular.ttf", s)
HEAVY = lambda s: F("ArchivoBlack-Regular.ttf", s)
WM = lambda s: F("Montserrat.ttf", s, 900)
def ease(x): x = max(0., min(1., x)); return x*x*(3-2*x)

_paper = {}
def paper(W, H):
    if (W, H) in _paper: return _paper[(W, H)].copy()
    rng = np.random.default_rng(7)
    a = np.zeros((H, W, 3), np.float32) + [241, 237, 228]
    yy, xx = np.mgrid[0:H, 0:W]
    a[(xx % 26 == 0) | (yy % 26 == 0)] -= [18, 18, 14]
    a += rng.normal(0, 3, (H, W, 1))
    for _ in range(40):  # specks
        x, y = rng.integers(0, W), rng.integers(0, H); a[y:y+2, x:x+3] -= 60
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)); _paper[(W, H)] = im
    return im.copy()

TONES = {"orange": ((52, 22, 6), (236, 150, 70)), "sepia": ((40, 28, 18), (226, 205, 170)),
         "grey": ((30, 30, 30), (225, 222, 215))}
def duotone(img, tone="orange"):
    d, l = TONES.get(tone, TONES["orange"])
    g = ImageOps.autocontrast(ImageOps.grayscale(img), 2)
    return ImageOps.colorize(g, d, l)

def torn_mask(W, H, top, seed):
    rng = random.Random(seed); m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m)
    pts = [(0, H)]; x = 0; y = top
    while x < W:
        pts.append((x, y)); x += rng.randint(8, 26)
        y = top + rng.gauss(0, 9) + 18*math.sin(x/90 + seed)
    pts += [(W, top), (W, H)]; d.polygon(pts, fill=255)
    return m, pts

def chroma_text(text_lines, W, size, center=True):
    """heavy heading; '&' and 'THE' rendered smaller; magenta/yellow offset shadows"""
    fb = HEAVY(size); fs = HEAVY(int(size*.55))
    rows = []
    for ln in text_lines:
        toks = []
        for w in ln.split():
            small = w in ("&", "THE", "OF", "AND")
            toks.append((w, fs if small else fb))
        rows.append(toks)
    lh = int(size*1.02); Hh = lh*len(rows) + 30
    out = Image.new("RGBA", (W, Hh))
    for col, off in (((236, 60, 200, 230), (-4, 3)), ((250, 225, 40, 230), (4, -2)), ((10, 10, 10, 255), (0, 0))):
        lay = Image.new("RGBA", (W, Hh)); d = ImageDraw.Draw(lay)
        for i, toks in enumerate(rows):
            widths = [f.getlength(w) for w, f in toks]; tot = sum(widths) + 6*(len(toks)-1)
            x = (W - tot)/2 if center else 40
            for (w, f), wl in zip(toks, widths):
                yo = 0 if f is fb else int(size*.06)
                d.text((x+off[0], 10 + i*lh + yo + off[1]), w, font=f, fill=col); x += wl + 6
        out = Image.alpha_composite(out, lay)
    return out

def layout_words(paras, W, size, x0, maxw):
    f = SERIF(size); sp = f.getlength(" "); lh = int(size*1.05)
    items = []; y = 0
    for pi, p in enumerate(paras):
        words = []; mode = False
        for w in p["text"].split():
            st = w.startswith("*"); en = w.rstrip(".,!?:;").endswith("*")
            if st: mode = True
            words.append((w.replace("*", ""), mode))
            if en: mode = False
        n = len(words); x = x0
        for i, (w, hl) in enumerate(words):
            wl = f.getlength(w)
            if x + wl > x0 + maxw and x > x0: x = x0; y += lh
            t = p["t"] + p.get("dur", n*.12) * i / max(1, n)
            items.append(dict(w=w, hl=hl, x=x, y=y, wl=wl, t=t, pi=pi)); x += wl + sp
        y += lh + int(size*.45)
    return items, y, f, lh

def draw_paras(fr, paras, tl, W, y0, size=44, center=False, maxw=None):
    maxw = maxw or int(W*.84); x0 = (W - maxw)//2
    items, th, f, lh = layout_words(paras, W, size, x0, maxw)
    if center:  # centre each line
        pass
    base = y0 - (th//2 if center else 0)
    hl_l = Image.new("RGBA", fr.size); hd = ImageDraw.Draw(hl_l)
    tx = Image.new("RGBA", fr.size); td = ImageDraw.Draw(tx)
    if center:  # re-centre rows
        rows = {}
        for it in items: rows.setdefault(it["y"], []).append(it)
        for r in rows.values():
            ln = r[-1]["x"] + r[-1]["wl"] - r[0]["x"]; sh = (W - ln)/2 - r[0]["x"]
            for it in r: it["x"] += sh
    for it in items:
        k = ease((tl - it["t"]) / .22)
        if k <= 0: continue
        y = base + it["y"]
        if it["hl"]:
            hk = ease((tl - it["t"] - .25) / .25)
            if hk > 0:
                hd.rectangle([it["x"]-3, y + size*.22, it["x"]-3 + (it["wl"]+9)*hk, y + size*1.0], fill=(250, 232, 40, 235))
        g = int(205 - 190*k)
        td.text((it["x"], y + (1-k)*6), it["w"], font=f, fill=(g, g, g-4, int(255*min(1, k*2))))
    fr.alpha_composite(hl_l); fr.alpha_composite(tx)

def watermark(fr, wm, W, H):
    f = WM(int(wm.get("size", 46)))
    t = wm["text"]; w = int(f.getlength(t)) + 30
    el = Image.new("RGBA", (w, 80)); ImageDraw.Draw(el).text((10, 6), t, font=f, fill=(12, 12, 12, 255))
    el = el.rotate(wm.get("angle", 24), expand=True, resample=Image.BICUBIC)
    x, y = wm.get("pos", [.58, .86]); fr.alpha_composite(el, (int(x*W - el.width/2), int(y*H - el.height/2)))

_cache = {}
def render_article(sh, idx, t, p, W, H):
    fr = paper(W, H).convert("RGBA")
    strips = sh.get("strips", [])
    cur = None
    for s in strips:
        if t >= s.get("t", 0): cur = s
    if cur:
        key = (cur["src"], sh.get("strip_tone", "orange"))
        if key not in _cache:
            im = Image.open(cur["src"]).convert("RGB"); _cache[key] = duotone(im, key[1])
        top = int(H*sh.get("strip_top", .66)); sh_h = H - top + 40
        im = _cache[key]; s_ = max(W/im.width, sh_h/im.height)*(1.06 + .05*p)
        big = im.resize((int(im.width*s_)+1, int(im.height*s_)+1), Image.LANCZOS)
        crop = big.crop(((big.width-W)//2, (big.height-sh_h)//2, (big.width-W)//2 + W, (big.height-sh_h)//2 + sh_h))
        k = ease((t - cur.get("t", 0)) / .35) if cur is strips[0] and sh.get("strip_in", True) else 1
        yoff = int((1-k)*sh_h*.6)
        m, pts = torn_mask(W, sh_h, 30, idx*7 + strips.index(cur))
        # paper-edge highlight
        edge = Image.new("RGBA", (W, sh_h)); ImageDraw.Draw(edge).line(pts[1:-2], fill=(250, 245, 235, 255), width=5)
        layer = crop.convert("RGBA"); layer.putalpha(m)
        sha = Image.new("RGBA", (W, sh_h), (0, 0, 0, 0)); sha.putalpha(m.filter(ImageFilter.GaussianBlur(8)).point(lambda v: v*.35))
        fr.alpha_composite(sha, (0, top - 40 + yoff - 6))
        fr.alpha_composite(edge.filter(ImageFilter.GaussianBlur(1)), (0, top - 40 + yoff - 3))
        fr.alpha_composite(layer, (0, top - 40 + yoff))
        d = ImageDraw.Draw(fr)  # crease
        cx = int(W*.42); d.line([(cx, top + yoff), (cx + 90, H)], fill=(255, 225, 190, 40), width=2)
    y = int(H*.07)
    if sh.get("title"):
        tt = chroma_text(sh["title"].split("|"), W, int(sh.get("title_size", 50)))
        fr.alpha_composite(tt, (0, y)); y += tt.height + 18
    if sh.get("paras"):
        if sh.get("center"): draw_paras(fr, sh["paras"], t, W, int(H*sh.get("cy", .42)), int(sh.get("size", 50)), True)
        else: draw_paras(fr, sh["paras"], t, W, y, int(sh.get("size", 52)))
    return fr

def render_title(sh, idx, t, p, W, H):
    fr = paper(W, H).convert("RGBA")
    if sh.get("bg_img"):
        key = ("t", sh["bg_img"])
        if key not in _cache:
            im = Image.open(sh["bg_img"]).convert("RGB"); g = duotone(im, sh.get("tone", "sepia"))
            s_ = max(W/g.width, H/g.height); g = g.resize((int(g.width*s_)+1, int(g.height*s_)+1))
            _cache[key] = g.crop(((g.width-W)//2, (g.height-H)//2, (g.width-W)//2+W, (g.height-H)//2+H))
        fr = Image.blend(fr.convert("RGB"), _cache[key], .38).convert("RGBA")
    k = ease(t/.35)
    tt = chroma_text(sh["title"].split("|"), W, int(sh.get("title_size", 72)))
    s = 1.25 - .25*k; tt = tt.resize((int(tt.width*s), int(tt.height*s)), Image.LANCZOS)
    if k < 1: tt = tt.filter(ImageFilter.GaussianBlur((1-k)*8))
    a = tt.split()[3].point(lambda v: int(v*k)); tt.putalpha(a)
    fr.alpha_composite(tt, ((W-tt.width)//2, int(H*.42 - tt.height/2)))
    return fr
