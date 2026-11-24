#!/usr/bin/env python3
"""Documentary-reel renderer (9:16 "AI-photo documentary" style).
Usage: python3 docu_render.py shots.json out.mp4 [voiceover.mp3]
shots.json = {"fps":30,"w":720,"h":1280,"shots":[{...}]}
Shot keys:
  dur (s), bg: image path | "paper" | "dark" | "grid" | "wood"
  grade: "bw" | "warm" | "color" | "bw_accent"  (bw_accent keeps reds/yellows)
  move: "push_in" | "pull_out" | "drift_up" | "frame_pull" | "static"
  caption: [{"t":start_s,"text":"two words","pos":[x,y] frac,"style":"serif"|"bold"|"box"}]
  highlight: {"t":s,"word_box":[x0,y0,x1,y1] frac,"color":"#e8d84a"}   hand-drawn ellipse
  tag: {"t":s,"text":"EDVARD MUNCH"}    yellow torn label
  year: {"t":s,"text":"1892"}           big number + red underline
  transition: "cut" | "blur" | "flash" | "whip"   (into this shot)
"""
import json, sys, math, subprocess, os, random
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import textfx, article
WATERMARK = None
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageEnhance

F = "/usr/share/fonts/truetype/"
FONTS = {"serif": F+"liberation/LiberationSerif-Italic.ttf",
         "bold": F+"liberation/LiberationSans-Bold.ttf",
         "box": F+"liberation/LiberationSerif-BoldItalic.ttf"}
for k, v in list(FONTS.items()):
    if not os.path.exists(v): FONTS[k] = F+"dejavu/DejaVuSerif-Italic.ttf"

def ease(x): x = max(0, min(1, x)); return x*x*(3-2*x)
def back(x):  # overshoot pop
    x = max(0, min(1, x)); c = 1.7; return 1 + (c+1)*(x-1)**3 + c*(x-1)**2

def make_bg(kind, W, H, seed=0):
    rng = np.random.default_rng(seed)
    if kind == "dark":
        a = np.full((H, W, 3), 18, np.float32)
    elif kind == "wood":
        y = np.linspace(0, 40, H)[:, None]; x = np.linspace(0, 6, W)[None]
        g = np.sin(y + 3*np.sin(x*2 + y*.3)) * 18
        a = np.stack([110+g, 68+g*.7, 40+g*.5], -1).repeat(1, 0)
        a = np.broadcast_to(a, (H, W, 3)).astype(np.float32)
    else:  # paper / grid
        a = np.full((H, W, 3), 222, np.float32)
        yy, xx = np.mgrid[0:H, 0:W]
        a -= (((xx-W/2)/W)**2 + ((yy-H/2)/H)**2)[..., None] * 90  # vignette
        if kind == "grid":
            m = ((xx % 24 == 0) | (yy % 24 == 0)); a[m] -= 22
    a += rng.normal(0, 5, a.shape)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def grade(img, mode):
    if mode == "color": return img
    if mode == "warm":
        a = np.asarray(img, np.float32); a *= [1.08, .96, .80]
        return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    g = ImageOps.grayscale(img).convert("RGB")
    g = ImageEnhance.Contrast(g).enhance(1.15)
    if mode == "bw_accent":  # keep saturated reds/yellows (brand colour pops)
        a = np.asarray(img, np.float32); b = np.asarray(g, np.float32)
        r, gg, bb = a[..., 0], a[..., 1], a[..., 2]
        sat = (a.max(-1) - a.min(-1)) / 255
        warm = ((r > gg*1.25) | ((r > 150) & (gg > 130) & (bb < 90))).astype(np.float32)
        m = np.clip((sat - .35) * 4, 0, 1) * warm
        return Image.fromarray((a*m[..., None] + b*(1-m[..., None])).astype(np.uint8))
    return g

def cover(img, W, H, scale):
    iw, ih = img.size; s = max(W/iw, H/ih) * scale
    return img.resize((max(W, int(iw*s)), max(H, int(ih*s))), Image.LANCZOS)

def place(big, W, H, ox=0.5, oy=0.5):
    bw, bh = big.size; x = int((bw-W)*ox); y = int((bh-H)*oy)
    return big.crop((x, y, x+W, y+H))

def text_img(text, style, size, ink=(255,255,255,255)):
    font = ImageFont.truetype(FONTS[style], size)
    lines = text.split("\\n") if "\\n" in text else [text]
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    ws = [d.textbbox((0, 0), l, font=font) for l in lines]
    w = max(b[2]-b[0] for b in ws) + 40; h = int(size*1.15*len(lines)) + 30
    w += 60; h += 40
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
    if style != "box" and ink[0] > 128:  # soft dark scrim so white text reads on busy photos
        sc = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(sc).rounded_rectangle([30, 22, w-30, h-18], 20, fill=(0, 0, 0, 150))
        im = sc.filter(ImageFilter.GaussianBlur(14)); dr = ImageDraw.Draw(im)
    if style == "box":
        dr.rectangle([4, 8, w-4, h-6], fill=(10, 10, 10, 235))
    for i, l in enumerate(lines):
        b = ws[i]; x = (w-(b[2]-b[0]))//2 - b[0]; y = (32 if w > 0 else 12) + i*int(size*1.15)
        col = ink if style != "box" else (255,255,255,255)
        if style != "box" and ink[0] > 128:  # soft glow/shadow like the reference captions
            sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
            ImageDraw.Draw(sh).text((x, y+2), l, font=font, fill=(0, 0, 0, 170))
            im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(5)))
            dr = ImageDraw.Draw(im)
        dr.text((x, y), l, font=font, fill=col)
    return im

def paste_c(frame, el, cx, cy, alpha=1.0, scale=1.0, blur=0):
    if scale != 1.0:
        el = el.resize((max(1, int(el.width*scale)), max(1, int(el.height*scale))), Image.LANCZOS)
    if blur > 0.3: el = el.filter(ImageFilter.GaussianBlur(blur))
    if alpha < 1:
        a = el.split()[3].point(lambda v: int(v*alpha)); el.putalpha(a)
    frame.alpha_composite(el, (int(cx - el.width/2), int(cy - el.height/2)))

def render_shot(sh, idx, W, H, fps, outdir, start_frame):
    dur = sh["dur"]; n = int(round(dur*fps))
    src = sh.get("bg", "paper")
    if sh.get("layout") in ("article", "title"): src = "paper"
    base = make_bg(src, W, H, idx) if src in ("paper", "dark", "grid", "wood") \
        else Image.open(src).convert("RGB")
    base = grade(base, sh.get("grade", "bw" if src not in ("paper", "dark", "grid", "wood") else "color"))
    big = cover(base, W, H, 1.18)
    move = sh.get("move", "push_in")
    caps = sh.get("caption", [])
    rng = random.Random(idx)
    light = src in ("paper", "grid")
    for f in range(n):
        p = f / max(1, n-1); t = f / fps
        if move == "push_in": z = 1/1.18*(1 + .12*ease(p)); fr = place(cover(base, W, H, 1.0+.12*p), W, H)
        elif move == "pull_out": fr = place(cover(base, W, H, 1.14-.12*p), W, H)
        elif move == "drift_up": fr = place(big, W, H, .5, .8-.6*p)
        elif move == "frame_pull":  # image starts as small framed picture, grows to fill
            k = ease(min(1, p*2.2)); fr = make_bg("paper", W, H, idx)
            s = .45 + .65*k; pic = cover(base, W, H, 1.0).resize((int(W*s), int(H*s)))
            if k < .95:
                bd = int(18*(1-k)) + 2
                pic = ImageOps.expand(pic, border=bd, fill=(176, 138, 52))
            fr.paste(pic, ((W-pic.width)//2, (H-pic.height)//2))
        else: fr = place(big, W, H)
        fr = fr.convert("RGBA")
        lay = sh.get("layout")
        if lay == "article": fr = article.render_article(sh, idx, t, p, W, H); light = True
        elif lay == "title": fr = article.render_title(sh, idx, t, p, W, H); light = True
        # transition in
        tr = sh.get("transition", "blur")
        # captions: word groups pop in with blur-to-sharp + slight scale
        cu = sh.get("cutout")
        if cu:
            if "_im" not in cu:
                ci = Image.open(cu["src"]).convert("RGBA")
                if cu.get("grade", "bw") != "color":
                    rgb = grade(ci.convert("RGB"), cu.get("grade", "bw")); rgb.putalpha(ci.split()[3]); ci = rgb
                cu["_im"] = ci
            ci = cu["_im"]; tl = t - cu.get("t", 0)
            if tl >= 0:
                k = ease(tl/.45); hgt = int(H*cu.get("h", .6)*(1 + .05*p))
                el = ci.resize((int(ci.width*hgt/ci.height), hgt), Image.LANCZOS)
                al = el.split()[3]
                sh_ = Image.new("RGBA", el.size, (0, 0, 0, 0)); sh_.putalpha(al.point(lambda v: int(v*.55)))
                sh_ = sh_.filter(ImageFilter.GaussianBlur(18))
                cx = cu.get("x", .5)*W; by = cu.get("y", 1.0)*H + (1-k)*H*.25
                if cu.get("outline"):  # white sticker edge like the references' cut-outs
                    ol = Image.new("RGBA", el.size, (255, 255, 255, 0))
                    ol.putalpha(al.filter(ImageFilter.MaxFilter(9)))
                    fr.alpha_composite(ol, (int(cx-el.width/2), int(by-el.height)))
                fr.alpha_composite(sh_, (int(cx-el.width/2)+10, int(by-el.height)+14))
                el2 = el.copy(); el2.putalpha(al.point(lambda v: int(v*k)))
                fr.alpha_composite(el2, (int(cx-el.width/2), int(by-el.height)))
        for c in caps:
            if t < c["t"] or t > c.get("end", 1e9): continue
            tl = t - c["t"]
            el, anim = textfx.render(c, tl, light, int(c.get("base", 46)))
            a_, sc, bl, dy = textfx.entrance(anim, tl)
            cx, cy = c.get("pos", [.5, .62]); paste_c(fr, el, cx*W, cy*H + dy, a_, sc, bl)
        hl = sh.get("highlight")
        if hl and t >= hl["t"]:
            k = ease((t-hl["t"])/.45); x0, y0, x1, y1 = [v*s for v, s in zip(hl["word_box"], (W, H, W, H))]
            ov = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(ov)
            pts = [(( x0+x1)/2 + (x1-x0)*.62*math.cos(a), (y0+y1)/2 + (y1-y0)*.75*math.sin(a)+ 4*math.sin(a*3))
                   for a in np.linspace(-.6, -.6 + 2*math.pi*1.08*k, 60)]
            if len(pts) > 1: d.line(pts, fill=hl.get("color", "#e8d84a"), width=4, joint="curve")
            fr.alpha_composite(ov)
        tg = sh.get("tag")
        if tg and t >= tg["t"]:
            k = back((t-tg["t"])/.3); font = ImageFont.truetype(FONTS["bold"], 22)
            el = Image.new("RGBA", (len(tg["text"])*15+40, 52)); d = ImageDraw.Draw(el)
            d.polygon([(4, 6), (el.width-2, 2), (el.width-6, 46), (2, 50)], fill=(245, 205, 30))
            d.text((20, 13), tg["text"], font=font, fill=(200, 20, 20))
            el = el.rotate(-4, expand=True, resample=Image.BICUBIC)
            paste_c(fr, el, tg.get("pos", [.7, .5])[0]*W, tg.get("pos", [.7, .5])[1]*H, 1, max(.01, k))
        yr = sh.get("year")
        if yr and t >= yr["t"]:
            k = ease((t-yr["t"])/.3); el = text_img(yr["text"], "bold", yr.get("size", 96))
            d = ImageDraw.Draw(el); ww = int(el.width*.9*k)
            d.rectangle([(el.width-ww)//2, el.height-14, (el.width+ww)//2, el.height-6], fill=(210, 25, 25))
            paste_c(fr, el, W/2, H*.33, k)
        if WATERMARK and not sh.get("no_wm"): article.watermark(fr, WATERMARK, W, H)
        fr = fr.convert("RGB")
        if tr != "cut" and f < 6:
            k = 1 - f/6
            if tr == "blur": fr = fr.filter(ImageFilter.GaussianBlur(14*k))
            elif tr == "flash": fr = Image.blend(fr, Image.new("RGB", (W, H), "white"), k)
            elif tr == "whip":
                fr = fr.filter(ImageFilter.BoxBlur(int(20*k)+0)) if k > .1 else fr
        # film grain + flicker + soft vignette
        a = np.asarray(fr, np.float32)
        a += np.random.default_rng(start_frame+f).normal(0, 7, a.shape[:2])[..., None]
        a *= 1 + .02*math.sin((start_frame+f)*1.7)
        Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(f"{outdir}/{start_frame+f:06d}.jpg", quality=92)
    return n

def main():
    spec = json.load(open(sys.argv[1])); out = sys.argv[2]
    vo = sys.argv[3] if len(sys.argv) > 3 else None
    global WATERMARK; WATERMARK = spec.get("watermark")
    W, H, fps = spec.get("w", 720), spec.get("h", 1280), spec.get("fps", 30)
    d = out + "_frames"; os.makedirs(d, exist_ok=True)
    fno = 0
    for i, sh in enumerate(spec["shots"]):
        fno += render_shot(sh, i, W, H, fps, d, fno); print(f"shot {i+1}/{len(spec['shots'])}", flush=True)
    cmd = ["ffmpeg", "-y", "-v", "error", "-framerate", str(fps), "-i", f"{d}/%06d.jpg"]
    if vo: cmd += ["-i", vo, "-c:a", "aac", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", out]
    subprocess.run(cmd, check=True); print("wrote", out)

if __name__ == "__main__": main()
