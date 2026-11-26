"""Silhouette / shadow-puppet style for respectful storytelling (Buddha series).

Dark figures against glowing skies, soft light, lotuses and sacred symbols.
No cartoon faces: people are calm silhouettes; the Buddha is shown through light and symbols."""
import math, random
import cairo
from studio import W, H, TAU, INK, lerp, seg, pop, ease, rrect, glow, line

SIL = (0.07, 0.05, 0.08)

def sky(c, stops):
    """stops: [(pos 0..1, (r,g,b)), ...] top to bottom, painted beyond the frame for camera moves."""
    g = cairo.LinearGradient(0, -300, 0, H + 300)
    for p, col in stops: g.add_color_stop_rgb(p, *col)
    c.rectangle(-600, -600, W + 1200, H + 1200); c.set_source(g); c.fill()

SUNSET = [(0, (0.16, 0.10, 0.28)), (0.35, (0.55, 0.22, 0.35)), (0.62, (0.96, 0.52, 0.28)), (0.8, (1.0, 0.80, 0.45)), (1, (1.0, 0.88, 0.6))]
NIGHT = [(0, (0.02, 0.03, 0.10)), (0.5, (0.07, 0.10, 0.25)), (0.85, (0.16, 0.20, 0.40)), (1, (0.22, 0.26, 0.45))]
DAWN = [(0, (0.30, 0.38, 0.62)), (0.4, (0.80, 0.62, 0.62)), (0.7, (1.0, 0.82, 0.55)), (1, (1.0, 0.93, 0.75))]
HEAVEN = [(0, (0.10, 0.12, 0.30)), (0.45, (0.32, 0.30, 0.55)), (0.8, (0.75, 0.62, 0.75)), (1, (0.95, 0.85, 0.85))]

def stars(c, t, n=90, seed=1, a=1.0, ymax=800):
    rnd = random.Random(seed)
    for i in range(n):
        x = rnd.uniform(-100, W + 100); y = rnd.uniform(-200, ymax); r = rnd.uniform(0.8, 2.4)
        tw = 0.55 + 0.45 * math.sin(t * rnd.uniform(1, 3) + i)
        c.arc(x, y, r, 0, TAU); c.set_source_rgba(1, 1, 0.95, a * tw * rnd.uniform(0.4, 1)); c.fill()

def moon(c, x, y, r, a=1.0):
    glow(c, x, y, r * 4.5, (0.85, 0.9, 1.0), 0.35 * a)
    g = cairo.RadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
    g.add_color_stop_rgba(0, 1, 1, 0.97, a); g.add_color_stop_rgba(1, 0.86, 0.88, 0.92, a)
    c.arc(x, y, r, 0, TAU); c.set_source(g); c.fill()
    for dx, dy, rr in ((-0.3, -0.1, 0.18), (0.25, 0.25, 0.12), (0.1, -0.35, 0.09)):
        c.arc(x + dx * r, y + dy * r, rr * r, 0, TAU); c.set_source_rgba(0.75, 0.78, 0.85, 0.35 * a); c.fill()

def sun(c, x, y, r, a=1.0):
    glow(c, x, y, r * 6, (1, 0.75, 0.4), 0.45 * a)
    glow(c, x, y, r * 2.2, (1, 0.9, 0.6), 0.7 * a)
    c.arc(x, y, r, 0, TAU); c.set_source_rgba(1, 0.96, 0.8, a); c.fill()

def mountains(c, base, height, col, seed=0, snow=None, a=1.0, xs=(-300, W + 300)):
    rnd = random.Random(seed); x = xs[0]; c.move_to(x, base + 400); c.line_to(x, base)
    peaks = []
    while x < xs[1]:
        w = rnd.uniform(120, 260); h = rnd.uniform(0.45, 1.0) * height
        c.line_to(x + w / 2, base - h); peaks.append((x + w / 2, base - h, w)); c.line_to(x + w, base - rnd.uniform(0, 0.25) * height); x += w
    c.line_to(x, base + 400); c.close_path(); c.set_source_rgba(*col, a); c.fill()
    if snow:
        for px, py, w in peaks:
            if py < base - height * 0.6:
                c.move_to(px, py); c.line_to(px - w * 0.16, py + w * 0.18); c.line_to(px - w * 0.05, py + w * 0.12)
                c.line_to(px + w * 0.03, py + w * 0.2); c.line_to(px + w * 0.15, py + w * 0.16); c.close_path()
                c.set_source_rgba(*snow, a); c.fill()

def ground(c, y, col=SIL):
    c.rectangle(-600, y, W + 1200, H + 900); c.set_source_rgb(*col); c.fill()

def palm(c, x, y, h, col=SIL, t=0, seed=0):
    rnd = random.Random(seed); sway = math.sin(t * 0.8 + seed) * 6
    c.move_to(x - 7, y); c.curve_to(x - 4, y - h * 0.5, x + sway * 0.5, y - h * 0.8, x + sway, y - h)
    c.line_to(x + sway + 6, y - h); c.curve_to(x + 6 + sway * 0.5, y - h * 0.8, x + 5, y - h * 0.5, x + 7, y); c.close_path()
    c.set_source_rgb(*col); c.fill()
    tx, ty = x + sway + 3, y - h
    for k in range(9):
        ang = -math.pi / 2 + (k - 4) * 0.42 + rnd.uniform(-0.1, 0.1); L = h * rnd.uniform(0.35, 0.5)
        ex, ey = tx + math.cos(ang) * L, ty + math.sin(ang) * L * 0.6 + L * 0.35
        c.move_to(tx, ty); c.curve_to(tx + math.cos(ang) * L * 0.5, ty + math.sin(ang) * L * 0.6 - 12, ex, ey - 8, ex, ey)
        c.curve_to(ex - 4, ey - 4, tx + math.cos(ang) * L * 0.5, ty + math.sin(ang) * L * 0.6, tx, ty + 6)
        c.set_source_rgb(*col); c.fill()

def palace(c, x, base, s=1.0, col=SIL, lit=0.0):
    """Palace silhouette with domes, stupa spires and lit windows. x = centre."""
    c.save(); c.translate(x, base); c.scale(s, s)
    c.set_source_rgb(*col)
    c.rectangle(-260, -150, 520, 150); c.fill()                                   # main hall
    for tx, tw, th in ((-230, 70, 260), (160, 70, 260), (-60, 120, 330)):
        c.rectangle(tx, -th, tw, th); c.fill()
        cx = tx + tw / 2; c.save(); c.translate(cx, -th); c.scale(1, 0.9)
        c.arc(0, 0, tw * 0.55, math.pi, TAU); c.restore(); c.fill()                  # dome
        c.move_to(cx - 5, -th - tw * 0.48); c.line_to(cx, -th - tw * 0.48 - 60); c.line_to(cx + 5, -th - tw * 0.48); c.close_path(); c.fill()
        for k in range(3): c.arc(cx, -th - tw * 0.48 - 12 - k * 13, 7 - k * 1.6, 0, TAU); c.fill()
    for k in range(-5, 6):                                                          # roof crenels
        c.rectangle(k * 46 - 10, -170, 20, 22); c.fill()
    c.rectangle(-300, -30, 600, 30); c.fill()
    if lit > 0:
        for wx, wy in ((-195, -200), (195, -200), (0, -250), (-120, -100), (-40, -100), (40, -100), (120, -100)):
            c.save(); c.translate(wx, wy); c.move_to(-9, 18); c.line_to(-9, 0); c.arc(0, 0, 9, math.pi, TAU); c.line_to(9, 18); c.close_path()
            c.set_source_rgba(1, 0.78, 0.4, lit); c.fill(); c.restore()
            glow(c, wx, wy + 6, 40, (1, 0.7, 0.35), 0.25 * lit)
    c.restore()

def reflection(c, top, col_top, col_bot, t, streak_x=None, streak_col=(1, 0.9, 0.7), a=1.0):
    g = cairo.LinearGradient(0, top, 0, H + 300); g.add_color_stop_rgb(0, *col_top); g.add_color_stop_rgb(1, *col_bot)
    c.rectangle(-600, top, W + 1200, H + 900); c.set_source(g); c.fill()
    if streak_x is not None:
        rnd = random.Random(3)
        for k in range(26):
            y = top + 10 + k * 22; w = (60 + rnd.uniform(0, 80)) * (1 + k * 0.05)
            x = streak_x + math.sin(t * 2 + k) * 12
            rrect(c, x - w / 2, y, w, 5, 2.5); c.set_source_rgba(*streak_col, a * (0.6 - k * 0.02)); c.fill()

def cloud(c, x, y, s, col=(1, 1, 1), a=0.8):
    c.save(); c.translate(x, y); c.scale(s, s)
    for bx, by, r in ((-70, 10, 45), (-25, -18, 60), (35, -10, 55), (80, 12, 40), (0, 20, 50)):
        c.new_sub_path(); c.arc(bx, by, r, 0, TAU)
    c.set_source_rgba(*col, a); c.fill(); c.restore()

def birds(c, t, n=6, y0=300, seed=2, col=SIL, speed=40):
    rnd = random.Random(seed)
    for i in range(n):
        x = (rnd.uniform(-200, W) + t * speed * rnd.uniform(0.7, 1.2)) % (W + 300) - 150
        y = y0 + rnd.uniform(-80, 80) + math.sin(t + i) * 8; s = rnd.uniform(0.6, 1.1); f = math.sin(t * 7 + i) * 6 * s
        c.move_to(x - 16 * s, y - f); c.curve_to(x - 8 * s, y - 6 * s, x - 2 * s, y - 2 * s, x, y + 2 * s)
        c.curve_to(x + 2 * s, y - 2 * s, x + 8 * s, y - 6 * s, x + 16 * s, y - f)
        c.set_source_rgb(*col); c.set_line_width(2.6 * s); c.stroke()

def figure(c, x, y, h, kind="queen", col=SIL, dir=1, aura=0.0, lying=False):
    """Calm silhouette person standing at (x, y feet). kind: king, queen, sage, guardian, attendant."""
    c.save(); c.translate(x, y)
    if lying: c.rotate(-math.pi / 2 * dir)
    s = h / 300.0; c.scale(s * dir, s)
    if aura > 0: glow(c, 0, -170, 260, (1, 0.85, 0.5), 0.5 * aura)
    c.set_source_rgb(*col)
    hr = 26; hy = -300 + hr
    if kind in ("queen", "attendant"):
        c.move_to(-26, -230); c.curve_to(-40, -150, -70, -60, -80, 0); c.line_to(80, 0)
        c.curve_to(70, -60, 40, -150, 26, -230); c.close_path(); c.fill()                 # long dress
        c.move_to(-30, -232); c.curve_to(-60, -180, -70, -120, -55, -60); c.line_to(-46, -60)
        c.curve_to(-55, -120, -40, -180, -18, -225); c.close_path(); c.fill()              # flowing shawl
        c.arc(14, hy + 12, 16, 0, TAU); c.fill()                                           # hair bun
    elif kind == "sage":
        c.move_to(-34, -225); c.curve_to(-48, -140, -60, -60, -66, 0); c.line_to(66, 0)
        c.curve_to(60, -60, 48, -140, 34, -225); c.close_path(); c.fill()
        c.move_to(-hr, hy + 10); c.curve_to(-hr, hy + 70, hr, hy + 70, hr, hy + 10); c.fill()  # beard
        line(c, [(52, -10), (60, -320)], 7, col)                                         # staff
    else:  # king / guardian
        c.move_to(-36, -232); c.line_to(36, -232); c.line_to(44, -110); c.line_to(-44, -110); c.close_path(); c.fill()
        c.move_to(-44, -112); c.line_to(44, -112); c.line_to(60, 0); c.line_to(-60, 0); c.close_path(); c.fill()
        c.move_to(-54, -228); c.curve_to(-80, -190, -84, -140, -70, -100); c.line_to(-60, -104); c.curve_to(-70, -150, -64, -190, -40, -220); c.close_path(); c.fill()
    c.rectangle(-9, hy + hr - 6, 18, 18); c.fill()                                          # neck
    c.arc(0, hy, hr, 0, TAU); c.fill()
    if kind in ("king", "guardian", "queen"):                                              # crown / tiara
        ch = 34 if kind != "queen" else 18
        c.move_to(-hr + 2, hy - hr * 0.55)
        for k in range(5):
            px = -hr + 2 + k * (2 * hr - 4) / 4
            c.line_to(px, hy - hr * 0.55 - (ch if k % 2 == 0 else ch * 0.45))
        c.line_to(hr - 2, hy - hr * 0.55); c.close_path(); c.fill()
        if kind == "guardian":
            c.move_to(-hr - 10, hy - hr * 0.9); c.arc(0, hy - hr * 0.3, hr + 26, math.pi * 1.15, math.pi * 1.85)
            c.set_line_width(5); c.set_source_rgba(1, 0.85, 0.5, 0.9); c.stroke()
    elif kind == "sage":
        c.save(); c.translate(0, hy - hr * 0.5); c.scale(1.2, 0.6); c.arc(0, 0, hr, math.pi, TAU); c.restore(); c.fill()
    c.restore()

def seated_figure(c, x, y, h, col=SIL, kind="sage"):
    """Cross-legged seated silhouette (wise men)."""
    c.save(); c.translate(x, y); s = h / 200.0; c.scale(s, s); c.set_source_rgb(*col)
    c.save(); c.scale(1, 0.38); c.arc(0, -20, 95, math.pi, TAU); c.restore(); c.fill()
    c.move_to(-50, -40); c.curve_to(-56, -100, -40, -140, -24, -150); c.line_to(24, -150); c.curve_to(40, -140, 56, -100, 50, -40); c.close_path(); c.fill()
    c.arc(0, -172, 24, 0, TAU); c.fill()
    c.save(); c.translate(0, -186); c.scale(1.25, 0.7); c.arc(0, 0, 24, math.pi, TAU); c.restore(); c.fill()
    if kind == "sage":
        c.move_to(-20, -165); c.curve_to(-20, -120, 20, -120, 20, -165); c.fill()
    c.restore()

def bed(c, x, y, w, col=SIL, canopy=True):
    c.set_source_rgb(*col)
    rrect(c, x - w / 2, y - 40, w, 40, 8); c.fill()
    for lx in (x - w / 2 + 10, x + w / 2 - 26): c.rectangle(lx, y, 16, 60); c.fill()
    if canopy:
        for lx in (x - w / 2 + 4, x + w / 2 - 12): c.rectangle(lx, y - 260, 8, 230); c.fill()
        c.move_to(x - w / 2 - 20, y - 260); c.curve_to(x - w / 4, y - 300, x + w / 4, y - 300, x + w / 2 + 20, y - 260)
        c.line_to(x + w / 2 + 20, y - 248); c.line_to(x - w / 2 - 20, y - 248); c.close_path(); c.fill()
        for sd in (-1, 1):
            cx = x + sd * w / 2
            c.move_to(cx, y - 250); c.curve_to(cx - sd * 40, y - 180, cx - sd * 10, y - 100, cx - sd * 30, y - 40)
            c.set_line_width(10); c.stroke()

def sleeping_queen(c, x, y, w, col=SIL):
    """Queen lying on her side on a bed top at y."""
    c.set_source_rgb(*col)
    c.move_to(x - w * 0.42, y - 40); c.curve_to(x - w * 0.2, y - 95, x + w * 0.2, y - 85, x + w * 0.36, y - 60)
    c.curve_to(x + w * 0.42, y - 50, x + w * 0.42, y - 40, x + w * 0.42, y - 40); c.close_path(); c.fill()
    c.arc(x - w * 0.36, y - 70, 24, 0, TAU); c.fill()
    c.arc(x - w * 0.43, y - 62, 14, 0, TAU); c.fill()
    rrect(c, x - w * 0.5, y - 62, 70, 24, 10); c.fill()                                   # pillow

def lotus(c, x, y, s, open_amt=1.0, col=(1.0, 0.92, 0.95), edge=(0.85, 0.55, 0.65), a=1.0, glow_a=0.0):
    if s <= 0: return
    if glow_a > 0: glow(c, x, y - 20 * s, 120 * s, (1, 0.9, 0.7), glow_a)
    c.save(); c.translate(x, y); c.scale(s, s)
    for layer, (n, L, spread) in enumerate(((7, 70, 1.25), (5, 62, 0.85), (3, 50, 0.4))):
        for k in range(n):
            ang = -math.pi / 2 + (k - (n - 1) / 2) * spread / max(1, n - 1) * 2 * open_amt
            c.save(); c.rotate(ang + math.pi / 2)
            c.move_to(0, 0); c.curve_to(-20, -L * 0.4, -14, -L * 0.85, 0, -L); c.curve_to(14, -L * 0.85, 20, -L * 0.4, 0, 0)
            sh = 1 - layer * 0.05
            c.set_source_rgba(col[0] * sh, col[1] * sh, col[2] * sh, a); c.fill_preserve()
            c.set_source_rgba(*edge, a * 0.8); c.set_line_width(2); c.stroke(); c.restore()
    c.restore()

def white_elephant(c, x, y, s, t, a=1.0, dir=1, lotus_on=True):
    """Glowing white elephant (light, not silhouette) holding a lotus. (x, y) = feet line centre."""
    if s <= 0 or a <= 0: return
    glow(c, x, y - 150 * s, 320 * s, (1, 0.97, 0.9), 0.55 * a)
    c.save(); c.translate(x, y); c.scale(s * dir, s)
    body = (0.98, 0.97, 0.95); shade = (0.85, 0.84, 0.86)
    step = math.sin(t * 3) * 6
    def fillc(col): c.set_source_rgba(*col, a); c.fill()
    for lx, ph in ((-70, 0), (-30, 1), (40, 0), (80, 1)):                                  # legs
        off = step if ph else -step
        rrect(c, lx - 18 + off * 0.3, -110, 36, 110, 14); fillc(shade if lx in (-30, 80) else body)
    c.save(); c.translate(0, -150); c.scale(1.35, 0.85); c.arc(0, 0, 95, 0, TAU); c.restore(); fillc(body)  # body
    line(c, [(-125, -170), (-150, -110)], 6, shade, a)                                      # tail
    c.arc(118, -205, 62, 0, TAU); fillc(body)                                               # head
    c.save(); c.translate(92, -205); c.scale(0.8, 1.15); c.arc(0, 0, 48, 0, TAU); c.restore(); fillc(shade)  # ear
    c.arc(140, -215, 6, 0, TAU); c.set_source_rgba(0.35, 0.33, 0.38, a); c.fill()           # calm eye
    tk = math.sin(t * 1.5) * 0.08                                                           # trunk curls up
    c.move_to(160, -190)
    c.curve_to(205, -160, 215 + tk * 100, -110, 200, -60)
    c.curve_to(196, -40, 222, -40, 228, -62)
    c.curve_to(240, -120, 222, -175, 175, -215); c.close_path(); fillc(body)
    c.move_to(158, -178); c.curve_to(190, -168, 200, -150, 208, -130); c.set_source_rgba(1, 0.96, 0.85, a); c.set_line_width(7); c.stroke()  # tusk
    c.restore()
    if lotus_on:
        lx = x + dir * 214 * s; ly = y - 62 * s
        lotus(c, lx, ly - 10 * s, 0.55 * s, 0.9, a=a, glow_a=0.3 * a)

def petals(c, t, t0, n=24, seed=5, a=1.0):
    """Soft lotus petals drifting down after t0."""
    if t < t0: return
    rnd = random.Random(seed)
    for i in range(n):
        st = t0 + rnd.uniform(0, 1.5);
        if t < st: continue
        dt = t - st; x = rnd.uniform(40, W - 40) + math.sin(dt * 1.5 + i) * 30; y = -40 + dt * rnd.uniform(90, 160)
        if y > H + 40: continue
        c.save(); c.translate(x, y); c.rotate(dt * rnd.uniform(-2, 2))
        c.move_to(0, -10); c.curve_to(8, -4, 8, 6, 0, 12); c.curve_to(-8, 6, -8, -4, 0, -10)
        c.set_source_rgba(1, 0.86, 0.9, a * 0.9); c.fill(); c.restore()

def light_rays(c, x, y, r, t, a=1.0, n=14, col=(1, 0.9, 0.65)):
    if a <= 0: return
    for k in range(n):
        ang = k * TAU / n + t * 0.08
        c.move_to(x, y); c.arc(x, y, r, ang - 0.06, ang + 0.06); c.close_path()
        c.set_source_rgba(*col, 0.12 * a); c.fill()

def crown_symbol(c, x, y, s, a=1.0):
    if s <= 0.001: return
    c.save(); c.translate(x, y); c.scale(s, s)
    glow(c, 0, 0, 140, (1, 0.85, 0.4), 0.45 * a)
    c.move_to(-70, 40); c.line_to(-80, -30); c.line_to(-40, 5); c.line_to(0, -55); c.line_to(40, 5); c.line_to(80, -30); c.line_to(70, 40); c.close_path()
    c.set_source_rgba(1, 0.8, 0.3, a); c.fill_preserve(); c.set_source_rgba(0.5, 0.32, 0.05, a); c.set_line_width(4); c.stroke()
    for px, py in ((-80, -30), (0, -55), (80, -30)): c.arc(px, py, 9, 0, TAU); c.set_source_rgba(1, 0.95, 0.75, a); c.fill()
    rrect(c, -72, 34, 144, 18, 6); c.set_source_rgba(0.9, 0.65, 0.2, a); c.fill()
    c.restore()

def dharma_wheel(c, x, y, s, t, a=1.0, spin=0.15):
    if s <= 0.001: return
    c.save(); c.translate(x, y); c.scale(s, s)
    glow(c, 0, 0, 170, (1, 0.88, 0.5), 0.5 * a)
    c.rotate(t * spin)
    gold = (1, 0.8, 0.3); dark = (0.5, 0.32, 0.05)
    c.arc(0, 0, 80, 0, TAU); c.set_source_rgba(*gold, a); c.set_line_width(14); c.stroke()
    c.arc(0, 0, 80, 0, TAU); c.set_source_rgba(*dark, a); c.set_line_width(2); c.stroke()
    for k in range(8):
        ang = k * TAU / 8
        line(c, [(math.cos(ang) * 18, math.sin(ang) * 18), (math.cos(ang) * 78, math.sin(ang) * 78)], 7, gold, a)
        c.arc(math.cos(ang) * 92, math.sin(ang) * 92, 8, 0, TAU); c.set_source_rgba(*gold, a); c.fill()
    c.arc(0, 0, 20, 0, TAU); c.set_source_rgba(*gold, a); c.fill()
    c.restore()

def bodhi_leaf(c, x, y, s, a=1.0, col=(0.55, 0.78, 0.4)):
    if s <= 0.001: return
    c.save(); c.translate(x, y); c.scale(s, s)
    c.move_to(0, 70); c.curve_to(-70, 30, -80, -50, 0, -60); c.curve_to(80, -50, 70, 30, 0, 70); c.close_path()
    c.move_to(0, -60); c.curve_to(4, -80, 10, -100, 22, -118); c.line_to(18, -120); c.curve_to(6, -100, 0, -82, -4, -60)
    c.set_source_rgba(*col, a); c.fill()
    line(c, [(0, 64), (0, -56)], 3, (0.35, 0.55, 0.25), a)
    for k in range(5):
        yy = 40 - k * 22; line(c, [(0, yy), (-36 + k * 4, yy - 22)], 2, (0.35, 0.55, 0.25), a); line(c, [(0, yy), (36 - k * 4, yy - 22)], 2, (0.35, 0.55, 0.25), a)
    c.restore()

def title_card(c, t, t0, t1, top, main, sub=None):
    """Elegant title text in screen space."""
    a = seg(t, t0, t0 + 0.6) * (1 - seg(t, t1 - 0.6, t1))
    if a <= 0: return
    c.save(); c.identity_matrix()
    c.select_font_face("DejaVu Serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    c.set_font_size(24); e = c.text_extents(top); c.move_to(W / 2 - e.width / 2 - e.x_bearing, 300)
    c.set_source_rgba(1, 0.88, 0.6, a); c.show_text(top)
    c.select_font_face("DejaVu Serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    c.set_font_size(54); e = c.text_extents(main); c.move_to(W / 2 - e.width / 2 - e.x_bearing, 370)
    c.set_source_rgba(1, 0.97, 0.9, a); c.show_text(main)
    line(c, [(W / 2 - 90, 400), (W / 2 + 90, 400)], 2, (1, 0.85, 0.5), a)
    if sub:
        c.select_font_face("DejaVu Serif", cairo.FONT_SLANT_ITALIC, cairo.FONT_WEIGHT_NORMAL)
        c.set_font_size(26); e = c.text_extents(sub); c.move_to(W / 2 - e.width / 2 - e.x_bearing, 440)
        c.set_source_rgba(1, 0.92, 0.8, a); c.show_text(sub)
    c.restore()
