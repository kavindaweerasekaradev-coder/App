#!/usr/bin/env python3
"""Stick Animator studio: shared drawing library + renderer.

Usage:  python3 studio.py episodes/ep02_texting [out.mp4]
        python3 studio.py episodes/ep02_texting --still 4.5 frame.png

An episode folder holds episode.py with LINES (voiceover), SCENES ([(line_index, fn)])
and HIGHLIGHT (caption words that get the yellow box). Scene start times come from the
voiceover timing, so changing the script re-times the video automatically."""
import json, math, os, random, subprocess, sys
import numpy as np, cairo
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 720, 1280, 30
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "..", "..", ".claude", "skills", "kaz-documentary-2", "scripts", "fonts", "ArchivoBlack-Regular.ttf")
INK = (0.12, 0.12, 0.13)
TAU = 2 * math.pi

def ease(x): x = max(0, min(1, x)); return x * x * (3 - 2 * x)
def lerp(a, b, t): return a + (b - a) * t
def seg(t, a, b): return ease((t - a) / (b - a)) if b > a else float(t >= a)
def pop(t, t0, d=0.25):  # overshoot scale-in
    x = (t - t0) / d
    if x <= 0: return 0.0
    if x >= 1: return 1.0
    return 1 + 0.25 * math.sin(x * math.pi) - (1 - x) ** 3

# ------------------------------------------------------------------ primitives
def rrect(c, x, y, w, h, r):
    c.new_sub_path()
    c.arc(x + w - r, y + r, r, -math.pi / 2, 0); c.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    c.arc(x + r, y + h - r, r, math.pi / 2, math.pi); c.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    c.close_path()

def fill_stroke(c, fill, lw=4, stroke=INK, alpha=1):
    c.set_source_rgba(*fill, alpha); c.fill_preserve()
    c.set_source_rgba(*stroke, alpha); c.set_line_width(lw); c.stroke()

def line(c, pts, lw, col=INK, alpha=1):
    c.set_line_cap(cairo.LINE_CAP_ROUND); c.set_line_join(cairo.LINE_JOIN_ROUND)
    c.move_to(*pts[0])
    if len(pts) == 3: c.curve_to(*pts[1], *pts[1], *pts[2])
    else:
        for p in pts[1:]: c.line_to(*p)
    c.set_source_rgba(*col, alpha); c.set_line_width(lw); c.stroke()

def glow(c, x, y, r, col, a):
    g = cairo.RadialGradient(x, y, 0, x, y, r)
    g.add_color_stop_rgba(0, *col, a); g.add_color_stop_rgba(1, *col, 0)
    c.set_source(g); c.arc(x, y, r, 0, TAU); c.fill()

def shadow(c, x, y, w, a=0.18):
    c.save(); c.translate(x, y); c.scale(1, 0.18)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, w)
    g.add_color_stop_rgba(0, 0, 0, 0, a); g.add_color_stop_rgba(1, 0, 0, 0, 0)
    c.set_source(g); c.arc(0, 0, w, 0, TAU); c.fill(); c.restore()

# ------------------------------------------------------------------ faces
def face(c, cx, cy, r, expr, turn, look_down, blink, scale=1):
    ex = 0.30 * r; fx = cx + turn * 0.28 * r; ey = cy - 0.05 * r + look_down * 0.22 * r
    c.set_source_rgb(*INK)
    for s in (-1, 1):
        x = fx + s * ex
        if blink: line(c, [(x - 6 * scale, ey), (x + 6 * scale, ey)], 3 * scale)
        else:
            c.save(); c.translate(x, ey); c.scale(1, 1.35); c.arc(0, 0, 5.2 * scale, 0, TAU); c.restore(); c.fill()
            c.set_source_rgb(1, 1, 1); c.arc(x + 1.6 * scale, ey - 2.5 * scale, 1.5 * scale, 0, TAU); c.fill(); c.set_source_rgb(*INK)
        # brows
        by = ey - 0.24 * r
        if expr in ("sad", "worried"):   inner, outer = by - 7 * scale, by + 2 * scale
        elif expr == "angry":            inner, outer = by + 5 * scale, by - 4 * scale
        elif expr == "surprised":        inner, outer = by - 8 * scale, by - 8 * scale
        else:                            inner, outer = by - 1 * scale, by - 1 * scale
        line(c, [(x - s * 3 * scale, inner), (x + s * 11 * scale, outer)], 3 * scale)
    my = cy + 0.38 * r + look_down * 0.15 * r; mw = 0.22 * r
    if expr == "smile":
        c.arc(fx, my - 0.12 * r, mw, 0.15 * math.pi, 0.85 * math.pi); c.set_line_width(3.2 * scale); c.stroke()
    elif expr in ("sad", "angry"):
        c.arc(fx, my + 0.14 * r, mw * 0.8, 1.2 * math.pi, 1.8 * math.pi); c.set_line_width(3.2 * scale); c.stroke()
    elif expr == "surprised":
        c.save(); c.translate(fx, my); c.scale(1, 1.3); c.arc(0, 0, 0.07 * r, 0, TAU); c.restore(); c.fill()
    elif expr == "worried":
        pts = [(fx - mw + i * mw / 4, my + (2.5 if i % 2 else -1.5) * scale) for i in range(9)]
        line(c, pts, 3 * scale)
    else:
        line(c, [(fx - mw * 0.7, my), (fx + mw * 0.7, my)], 3.2 * scale)

def is_blink(t, seed):
    p = (t + seed * 1.37) % 3.3
    return p < 0.12

# ------------------------------------------------------------------ characters
HANDS = []   # world positions of the last drawn man's hands: [back, front]

def man(c, x, y, t, pose="sit", dir=1, expr="neutral", turn=None, tilt=0.0, look_down=0.0,
        arms="lap", s=1.0, alpha=1.0, walk=False):
    """Round white head, charcoal capsule body, thin limbs. (x,y)=hip for sit, feet for stand.
    Standing arms: down, carry, give, tool, wave, mask, head, both_head. walk=True swings the legs."""

    c.save(); c.translate(x, y); c.scale(s, s)
    br = math.sin(t * 2.2) * 2
    if walk: br = -abs(math.sin(t * 8)) * 8
    if turn is None: turn = 0.5 * dir
    if pose == "sit":
        hip = (0, 0); top = (dir * 6, -118 + br)
        knee = (dir * 88, 4); foot = (dir * 96, 112)
        shadow(c, dir * 45, 115, 95)
        line(c, [hip, knee, foot], 10)                        # leg (far)
        line(c, [(dir * -8, 0), (dir * 80, 8), (dir * 84, 114)], 10)
        line(c, [(dir * 96, 112), (dir * 116, 114)], 10); line(c, [(dir * 84, 114), (dir * 104, 116)], 10)
    else:
        hip = (0, -150 + br * 0.5); top = (0, -275 + br); shadow(c, 0, 0, 60)
        sw = math.sin(t * 8) * 38 if walk else 0
        for sd, k in ((-1, 1), (1, -1)):
            fx = sd * 16 + k * sw; lift = max(0, k * math.sin(t * 8)) * 14 if walk else 0
            line(c, [(sd * 8, hip[1]), (fx, -lift)], 10); line(c, [(fx, -lift), (fx + dir * 18, -lift)], 10)
    line(c, [hip, top], 48, INK)                              # torso capsule
    line(c, [(hip[0], hip[1] - 4), (top[0], top[1] + 2)], 38, (0.20, 0.20, 0.23))
    sh = (top[0], top[1] + 14)
    hr = 64; hc = (top[0] + dir * 4 + tilt * 30, top[1] - hr - 6 + abs(tilt) * 10)
    # arms
    if pose == "stand" or arms == "mask":
        A = {"down": ((-30, -200), (-42, -138), (30, -200), (42, -138)),
             "lap": ((-30, -200), (-42, -138), (30, -200), (42, -138)),
             "carry": ((-34, -196), (-50, -126), (34, -196), (50, -126)),
             "give": ((-30, -200), (-42, -138), (dir * 55, -228), (dir * 104, -214)),
             "tool": ((-30, -200), (-42, -138), (dir * 52, -214), (dir * 96, -232 + math.sin(t * 12) * 9)),
             "wave": ((-30, -200), (-42, -138), (dir * 78, -282), (dir * 84 + math.sin(t * 10) * 12, -372)),
             "mask": ((-30, -200), (-42, -138), (dir * 70, -232), (hc[0] + dir * 30, hc[1] + 52))}
        if pose == "sit" and arms == "mask":
            A["mask"] = ((dir * 30, sh[1] + 64), (dir * 70, -8), (dir * 72, sh[1] + 30), (hc[0] + dir * 30, hc[1] + 52))
        if arms in A:
            e1, h1, e2, h2 = A[arms]
            line(c, [sh, e1, h1], 8); line(c, [sh, e2, h2], 8)
            HANDS[:] = [(x + h1[0] * s, y + h1[1] * s), (x + h2[0] * s, y + h2[1] * s)]
    if arms == "mask" or (pose == "stand" and arms in ("down", "lap", "carry", "give", "tool", "wave")):
        pass                                                   # drawn above
    elif arms == "lap":
        for o in (0, 10):
            line(c, [sh, (sh[0] + dir * (22 + o), sh[1] + 62), (dir * (64 + o), -8)], 8)
    elif arms == "head":      # one hand on forehead, other on lap
        line(c, [sh, (dir * 30, sh[1] + 64), (dir * 70, -8)], 8)
        line(c, [sh, (sh[0] + dir * 62, sh[1] - 20), (hc[0] + dir * 22, hc[1] - hr * 0.78)], 8)
    elif arms == "both_head":
        for sd in (-1, 1):
            line(c, [sh, (sh[0] + sd * 62, sh[1] + 4), (hc[0] + sd * 58, hc[1] + 6)], 8)
    elif arms == "write":
        line(c, [sh, (dir * 40, sh[1] + 50), (dir * 92, -38 + math.sin(t * 9) * 3)], 8)
        line(c, [sh, (dir * 30, sh[1] + 60), (dir * 70, -40)], 8)
    elif arms == "hold":
        line(c, [sh, (dir * 28, sh[1] + 60), (dir * 76, -14)], 8)
    # head
    c.save(); c.translate(*hc); c.rotate(tilt)
    g = cairo.RadialGradient(-hr * 0.35, -hr * 0.4, hr * 0.1, 0, 0, hr * 1.05)
    g.add_color_stop_rgb(0, 1, 1, 1); g.add_color_stop_rgb(0.75, 0.93, 0.93, 0.94); g.add_color_stop_rgb(1, 0.80, 0.80, 0.82)
    c.arc(0, 0, hr, 0, TAU); c.set_source(g); c.fill_preserve(); c.set_source_rgb(*INK); c.set_line_width(4.5); c.stroke()
    face(c, 0, 0, hr, expr, turn, look_down, is_blink(t, 1))
    c.restore()
    if arms in ("head", "both_head"):   # hands drawn over head
        for sd in ((dir,) if arms == "head" else (-1, 1)):
            hx = hc[0] + sd * (22 if arms == "head" else 58); hy = hc[1] + (-hr * 0.78 if arms == "head" else 6)
            c.arc(hx, hy, 9, 0, TAU); c.set_source_rgb(*INK); c.fill()
    c.restore()
    return (x + hc[0] * s, y + hc[1] * s, hr * s)

def woman(c, x, y, t, pose="stand", dir=-1, expr="neutral", turn=None, tilt=0.0, look_down=0.0,
          arms="down", s=1.0, alpha=1.0):
    """Bob-haired character, soft grey dress."""
    c.save(); c.translate(x, y); c.scale(s, s)
    br = math.sin(t * 2.0 + 1) * 2
    if turn is None: turn = 0.5 * dir
    dress = (0.86, 0.86, 0.88)
    if pose == "stand":
        shadow(c, 0, 0, 55)
        line(c, [(-10, -140), (-14, 0)], 7); line(c, [(10, -140), (14, 0)], 7)
        line(c, [(-14, 0), (-14 + dir * 14, 0)], 7); line(c, [(14, 0), (14 + dir * 14, 0)], 7)
        top = (0, -268 + br)
        c.move_to(-24, top[1] + 10); c.line_to(24, top[1] + 10); c.line_to(52, -130); c.line_to(-52, -130); c.close_path()
        fill_stroke(c, dress, 4)
        sh = (0, top[1] + 20)
        if arms == "down":
            line(c, [(sh[0] - 22, sh[1]), (-40, sh[1] + 60), (-44, sh[1] + 118)], 7)
            line(c, [(sh[0] + 22, sh[1]), (40, sh[1] + 60), (44, sh[1] + 118)], 7)
        elif arms == "reach":
            line(c, [(sh[0] - 22, sh[1]), (-40, sh[1] + 60), (-44, sh[1] + 118)], 7)
            line(c, [(sh[0] + dir * 22, sh[1]), (dir * 70, sh[1] + 40), (dir * 112, sh[1] + 30)], 7)
        elif arms == "hug":
            line(c, [(sh[0] - 22, sh[1]), (-30, sh[1] + 70), (8, sh[1] + 96)], 7)
            line(c, [(sh[0] + 22, sh[1]), (30, sh[1] + 70), (-8, sh[1] + 96)], 7)
    else:  # sit, hip at (0,0)
        shadow(c, dir * 40, 112, 80)
        line(c, [(0, 0), (dir * 76, 4), (dir * 82, 110)], 7); line(c, [(dir * -8, 2), (dir * 68, 8), (dir * 72, 112)], 7)
        top = (dir * 4, -112 + br)
        c.move_to(top[0] - 22, top[1] + 10); c.line_to(top[0] + 22, top[1] + 10)
        c.line_to(dir * 90 if dir > 0 else 30, 18); c.line_to(-30 if dir > 0 else dir * 90, 18); c.close_path()
        fill_stroke(c, dress, 4)
        sh = (top[0], top[1] + 22)
        if arms == "phone":     # both hands hold a glowing phone in front of her chest
            px, py = dir * 52, -62
            for o in (-10, 10): line(c, [sh, (dir * 18 + o, sh[1] + 64), (px + o * 0.6, py + 8)], 7)
            glow(c, px, py - 10, 70, (0.85, 0.92, 1.0), 0.45)
            c.save(); c.translate(px, py); c.rotate(-0.25 * dir); rrect(c, -16, -28, 32, 56, 6); fill_stroke(c, (0.15, 0.15, 0.17), 3)
            rrect(c, -12, -24, 24, 46, 4); c.set_source_rgb(0.85, 0.92, 1.0); c.fill(); c.restore()
        else:
            line(c, [sh, (dir * 34, sh[1] + 56), (dir * 66 if arms != "hold" else dir * -26, -6)], 7)
    hr = 52; hc = (top[0] + dir * 3 + tilt * 26, top[1] - hr - 4)
    c.save(); c.translate(*hc); c.rotate(tilt)
    hair = (0.32, 0.32, 0.35)
    c.save(); c.scale(1.12, 1.08); c.arc(0, 4, hr, math.pi * 0.85, math.pi * 2.15); c.restore()
    c.line_to(hr * 1.12, hr * 0.95); c.line_to(-hr * 1.12, hr * 0.95); c.close_path()
    fill_stroke(c, hair, 4)
    g = cairo.RadialGradient(-hr * 0.3, -hr * 0.35, hr * 0.1, 0, 0, hr * 1.05)
    g.add_color_stop_rgb(0, 1, 1, 1); g.add_color_stop_rgb(1, 0.85, 0.85, 0.87)
    c.arc(0, 6, hr * 0.9, 0, TAU); c.set_source(g); c.fill_preserve(); c.set_source_rgb(*INK); c.set_line_width(4); c.stroke()
    # bangs
    c.move_to(-hr * 0.95, -hr * 0.05); c.curve_to(-hr * 0.6, -hr * 1.05, hr * 0.6, -hr * 1.05, hr * 0.95, -hr * 0.05)
    c.curve_to(hr * 0.5, -hr * 0.55, -hr * 0.1 + turn * 20, -hr * 0.45, -hr * 0.95, -hr * 0.05)
    fill_stroke(c, hair, 4)
    face(c, 0, hr * 0.12, hr * 0.9, expr, turn, look_down, is_blink(t, 2), 0.9)
    c.restore(); c.restore()
    return (x + hc[0] * s, y + hc[1] * s, hr * s)

# ------------------------------------------------------------------ rooms
def floor_wall(c, wall_top, wall_bot, floor_col, horizon=880, planks=True):
    g = cairo.LinearGradient(0, 0, 0, horizon); g.add_color_stop_rgb(0, *wall_top); g.add_color_stop_rgb(1, *wall_bot)
    c.rectangle(-400, -400, W + 800, horizon + 400); c.set_source(g); c.fill()
    g = cairo.LinearGradient(0, horizon, 0, H + 300); g.add_color_stop_rgb(0, *floor_col); g.add_color_stop_rgb(1, *(v * 0.7 for v in floor_col))
    c.rectangle(-400, horizon, W + 800, H); c.set_source(g); c.fill()
    line(c, [(-400, horizon), (W + 400, horizon)], 5, (0.2, 0.2, 0.22), 0.6)  # skirting
    if planks:
        for i in range(-8, 16):
            line(c, [(W / 2 + i * 30, horizon), (W / 2 + i * 120, H + 300)], 2, (0, 0, 0), 0.10)
        for yy in (960, 1060, 1190):
            line(c, [(-400, yy), (W + 400, yy)], 2, (0, 0, 0), 0.08)

def window(c, x, y, w, h, light=0.5):
    rrect(c, x - 10, y - 10, w + 20, h + 20, 6); fill_stroke(c, (0.55, 0.55, 0.58), 4)
    g = cairo.LinearGradient(x, y, x + w, y + h); g.add_color_stop_rgb(0, 0.97, 0.97, 0.98); g.add_color_stop_rgb(1, 0.80, 0.82, 0.86)
    c.rectangle(x, y, w, h); c.set_source(g); c.fill()
    for k in range(1, 3): line(c, [(x + w * k / 3, y), (x + w * k / 3, y + h)], 6, (0.5, 0.5, 0.53))
    line(c, [(x, y + h / 2), (x + w, y + h / 2)], 6, (0.5, 0.5, 0.53))
    c.rectangle(x, y, w, h); c.set_source_rgb(*INK); c.set_line_width(4); c.stroke()
    # curtains
    for sx in (x - 46, x + w + 6):
        c.rectangle(sx, y - 30, 40, h + 70); fill_stroke(c, (0.40, 0.40, 0.43), 3)
        for k in range(1, 4): line(c, [(sx + k * 10, y - 26), (sx + k * 10, y + h + 36)], 2, (0, 0, 0), 0.25)
    # light beam
    c.move_to(x, y + h); c.line_to(x + w, y + h); c.line_to(x + w - 140, 1240); c.line_to(x - 260, 1240); c.close_path()
    c.set_source_rgba(1, 1, 1, 0.10 * light); c.fill()

def picture(c, x, y, w, h):
    c.rectangle(x, y, w, h); fill_stroke(c, (0.30, 0.30, 0.32), 5)
    c.rectangle(x + 12, y + 12, w - 24, h - 24); fill_stroke(c, (0.88, 0.88, 0.90), 2)
    c.move_to(x + 16, y + h - 20); c.curve_to(x + w * 0.3, y + h * 0.3, x + w * 0.5, y + h * 0.9, x + w - 16, y + h * 0.35)
    c.set_source_rgba(0.3, 0.3, 0.33, 0.8); c.set_line_width(5); c.stroke()

def floor_lamp(c, x, y, on=1.0):
    glow(c, x, y - 300, 260, (1.0, 0.86, 0.6), 0.35 * on)
    line(c, [(x, y), (x, y - 270)], 6); line(c, [(x - 40, y), (x + 40, y)], 8)
    c.move_to(x - 55, y - 270); c.line_to(x + 55, y - 270); c.line_to(x + 36, y - 350); c.line_to(x - 36, y - 350); c.close_path()
    fill_stroke(c, (0.97, 0.94, 0.86), 4)

def couch(c, x, y, w, front=True):
    """y = seat height line."""
    rrect(c, x, y - 150, w, 140, 26); fill_stroke(c, (0.45, 0.45, 0.48), 4)            # back
    rrect(c, x + 14, y - 135, w / 2 - 20, 115, 18); fill_stroke(c, (0.52, 0.52, 0.55), 3)
    rrect(c, x + w / 2 + 6, y - 135, w / 2 - 20, 115, 18); fill_stroke(c, (0.52, 0.52, 0.55), 3)
    rrect(c, x - 10, y - 14, w + 20, 70, 18); fill_stroke(c, (0.40, 0.40, 0.43), 4)    # seat
    for ax in (x - 34, x + w - 10):
        rrect(c, ax, y - 80, 44, 150, 18); fill_stroke(c, (0.36, 0.36, 0.39), 4)       # arms
    for lx in (x + 10, x + w - 20): c.rectangle(lx, y + 56, 12, 26); fill_stroke(c, (0.15, 0.15, 0.16), 3)

def coffee_table(c, x, y, w):
    rrect(c, x, y, w, 26, 6); fill_stroke(c, (0.30, 0.28, 0.27), 4)
    for lx in (x + 16, x + w - 30): c.rectangle(lx, y + 26, 14, 70); fill_stroke(c, (0.25, 0.23, 0.22), 3)
    rrect(c, x + 30, y - 14, 90, 14, 3); fill_stroke(c, (0.75, 0.75, 0.78), 3)            # book
    c.rectangle(x + w - 90, y - 26, 30, 26); fill_stroke(c, (0.95, 0.95, 0.96), 3)       # mug

def living_room(c, t, lamp=1.0):
    floor_wall(c, (0.80, 0.80, 0.82), (0.70, 0.70, 0.73), (0.52, 0.50, 0.49))
    window(c, 440, 300, 210, 320)
    picture(c, 140, 330, 150, 120)
    floor_lamp(c, 90, 880, lamp)

def study(c, t, lamp=1.0):
    floor_wall(c, (0.20, 0.20, 0.23), (0.16, 0.16, 0.18), (0.25, 0.24, 0.24))
    for row in range(4):                                  # bookshelf
        y = 260 + row * 120
        c.rectangle(380, y, 300, 10); c.set_source_rgb(0.12, 0.12, 0.13); c.fill()
        rnd = random.Random(row); bx = 390
        while bx < 660:
            bw = rnd.randint(14, 26); bh = rnd.randint(70, 104); shade = rnd.uniform(0.22, 0.42)
            c.rectangle(bx, y - bh, bw, bh); fill_stroke(c, (shade, shade, shade + 0.02), 2); bx += bw + 2
    glow(c, 210, 700, 420, (1.0, 0.85, 0.55), 0.40 * lamp)

def desk(c, t, lamp=1.0):
    rrect(c, 60, 790, 600, 34, 6); fill_stroke(c, (0.32, 0.29, 0.27), 4)
    for lx in (80, 620): c.rectangle(lx, 824, 20, 220); fill_stroke(c, (0.26, 0.23, 0.22), 3)
    # lamp
    line(c, [(150, 790), (150, 770)], 8); line(c, [(150, 770), (110, 690), (170, 640)], 7)
    c.save(); c.translate(170, 640); c.rotate(0.5)
    c.move_to(-30, 0); c.line_to(30, 0); c.line_to(18, -40); c.line_to(-18, -40); c.close_path(); fill_stroke(c, (0.25, 0.25, 0.27), 4)
    c.restore()
    c.move_to(150, 650); c.line_to(200, 650); c.line_to(420, 790); c.line_to(120, 790); c.close_path()
    c.set_source_rgba(1, 0.9, 0.65, 0.18 * lamp); c.fill()
    # notebook
    c.move_to(260, 786); c.line_to(470, 786); c.line_to(450, 762); c.line_to(280, 762); c.close_path(); fill_stroke(c, (0.93, 0.93, 0.92), 3)
    line(c, [(365, 762), (365, 786)], 2)
    c.rectangle(560, 744, 40, 46); fill_stroke(c, (0.5, 0.5, 0.53), 3)              # pen cup
    for k in range(3): line(c, [(566 + k * 12, 744), (562 + k * 14, 712)], 4, (0.85, 0.85, 0.88))

def kitchen(c, t):
    floor_wall(c, (0.86, 0.86, 0.87), (0.78, 0.78, 0.80), (0.70, 0.70, 0.72), planks=False)
    for gx in range(-2, 14):
        line(c, [(gx * 60, 880), (gx * 60, 0)], 1.5, (0, 0, 0), 0.06)
    for gy in range(0, 15): line(c, [(-100, gy * 60), (W + 100, gy * 60)], 1.5, (0, 0, 0), 0.06)
    for gx in range(-4, 16): line(c, [(W / 2 + gx * 40, 880), (W / 2 + gx * 150, H + 300)], 2, (0, 0, 0), 0.08)
    # pendant lamp
    line(c, [(360, -200), (360, 250)], 3)
    c.move_to(300, 310); c.line_to(420, 310); c.line_to(385, 250); c.line_to(335, 250); c.close_path(); fill_stroke(c, (0.25, 0.25, 0.27), 4)
    glow(c, 360, 330, 300, (1, 0.9, 0.7), 0.35)
    c.move_to(300, 310); c.line_to(420, 310); c.line_to(600, 860); c.line_to(120, 860); c.close_path()
    c.set_source_rgba(1, 1, 0.95, 0.10); c.fill()

def kitchen_table(c):
    rrect(c, 130, 800, 460, 30, 6); fill_stroke(c, (0.22, 0.21, 0.21), 4)
    for lx in (160, 550): c.rectangle(lx, 830, 18, 210); fill_stroke(c, (0.18, 0.17, 0.17), 3)
    c.save(); c.translate(270, 792); c.scale(1, 0.3); c.arc(0, 0, 40, 0, TAU); c.restore(); fill_stroke(c, (0.95, 0.95, 0.96), 3)
    c.save(); c.translate(450, 792); c.scale(1, 0.3); c.arc(0, 0, 40, 0, TAU); c.restore(); fill_stroke(c, (0.95, 0.95, 0.96), 3)

def chair(c, x, y, dir):
    rrect(c, x - 40, y - 4, 80, 18, 4); fill_stroke(c, (0.18, 0.17, 0.17), 3)
    bx = x - dir * 40
    c.rectangle(bx - 6, y - 170, 12, 175); fill_stroke(c, (0.18, 0.17, 0.17), 3)
    for lx in (x - 34, x + 26): c.rectangle(lx, y + 14, 10, 110); fill_stroke(c, (0.18, 0.17, 0.17), 3)

# ------------------------------------------------------------------ effects
def bubble(c, x, y, text, tail_x, tail_y, sc=1.0, size=34):
    if sc <= 0: return
    c.save(); c.translate(x, y); c.scale(sc, sc)
    c.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); c.set_font_size(size)
    ext = c.text_extents(text); w = ext.width + 44; h = size + 34
    rrect(c, -w / 2, -h / 2, w, h, h / 2)
    c.move_to(tail_x * 0.2 - 14, h / 2 - 4); c.line_to(tail_x / sc, tail_y / sc); c.line_to(tail_x * 0.2 + 14, h / 2 - 4)
    fill_stroke(c, (1, 1, 1), 4)
    rrect(c, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, h / 2 - 3); c.set_source_rgb(1, 1, 1); c.fill()
    c.set_source_rgb(*INK); c.move_to(-ext.width / 2 - ext.x_bearing, size * 0.36); c.show_text(text)
    c.restore()

def scribble_bubble(c, x, y, w, h, sc, seed, t):
    if sc <= 0: return
    c.save(); c.translate(x, y + math.sin(t * 3 + seed) * 4); c.scale(sc, sc)
    rrect(c, -w / 2, -h / 2, w, h, h / 2)
    c.move_to(-10, h / 2 - 2); c.line_to(-26 + (seed % 3) * 18, h / 2 + 26); c.line_to(12, h / 2 - 2)
    fill_stroke(c, (0.97, 0.97, 0.97), 3.5)
    rrect(c, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, h / 2 - 3); c.set_source_rgb(0.97, 0.97, 0.97); c.fill()
    rnd = random.Random(seed); pts = []
    for i in range(26):
        pts.append((rnd.uniform(-w * 0.32, w * 0.32), rnd.uniform(-h * 0.22, h * 0.22)))
    c.move_to(*pts[0])
    for i in range(1, len(pts) - 2, 2): c.curve_to(*pts[i], *pts[i], *pts[i + 1])
    c.set_source_rgba(*INK, 0.85); c.set_line_width(2.6); c.stroke()
    c.restore()

BRAIN_LOBES = [(-60, -10, 52), (-20, -38, 56), (34, -36, 54), (70, -4, 46), (-34, 28, 48), (24, 26, 52), (66, 34, 34), (-76, 30, 30)]
def brain_path(c, x, y, s):
    for bx, by, r in BRAIN_LOBES:
        c.new_sub_path(); c.arc(x + bx * s, y + by * s, r * s, 0, TAU)

def puzzle_brain(c, x, y, s, t, t0, t1, glow_amt):
    glow(c, x, y, 230 * s, (0.75, 0.88, 1.0), 0.55 * glow_amt + 0.12)
    c.save(); brain_path(c, x, y, s); c.set_fill_rule(cairo.FILL_RULE_WINDING); c.clip()
    cols, rows = 4, 3; x0, y0 = x - 130 * s, y - 95 * s; cw, ch = 260 * s / cols, 190 * s / rows
    for j in range(rows):
        for i in range(cols):
            k = j * cols + i; rnd = random.Random(k)
            ts = lerp(t0, t1, k / (cols * rows)); p = seg(t, ts, ts + 0.45)
            ox = (rnd.uniform(-1, 1) * 160) * (1 - p) * s; oy = (rnd.uniform(-1, 1) * 120 - 60) * (1 - p) * s
            rot = rnd.uniform(-1, 1) * 0.9 * (1 - p)
            px, py = x0 + i * cw + ox, y0 + j * ch + oy
            c.save(); c.translate(px + cw / 2, py + ch / 2); c.rotate(rot); c.translate(-cw / 2, -ch / 2)
            c.rectangle(0, 0, cw, ch)
            if i < cols - 1: c.new_sub_path(); c.arc(cw, ch / 2, ch * 0.16, 0, TAU)
            if j < rows - 1: c.new_sub_path(); c.arc(cw / 2, ch, cw * 0.16, 0, TAU)
            shade = 0.80 + 0.12 * rnd.random()
            c.set_source_rgba(shade, shade + 0.04, 1.0, 0.25 + 0.75 * p); c.fill_preserve()
            c.set_source_rgba(0.25, 0.35, 0.5, 0.7 * p); c.set_line_width(2.5); c.stroke()
            c.restore()
    c.restore()
    c.save(); brain_path(c, x, y, s); c.set_source_rgba(0.85, 0.93, 1, 0.9); c.set_line_width(4); c.stroke(); c.restore()
    # folds
    for bx, by, r in BRAIN_LOBES[:6]:
        c.arc(x + bx * s, y + by * s, r * s * 0.55, 3.6, 5.4); c.set_source_rgba(0.4, 0.5, 0.7, 0.35); c.set_line_width(3); c.stroke()

def space_bubble(c, x, y, r, a, t):
    if a <= 0: return
    r = r * (1 + 0.015 * math.sin(t * 3))
    g = cairo.RadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.05 * a); g.add_color_stop_rgba(0.85, 0.9, 0.95, 1, 0.18 * a); g.add_color_stop_rgba(1, 0.8, 0.9, 1, 0.45 * a)
    c.arc(x, y, r, 0, TAU); c.set_source(g); c.fill_preserve()
    c.set_source_rgba(1, 1, 1, 0.75 * a); c.set_line_width(3); c.stroke()
    c.arc(x, y, r * 0.86, 3.6, 4.4); c.set_source_rgba(1, 1, 1, 0.8 * a); c.set_line_width(7); c.stroke()

def heart(c, x, y, s, a):
    if s <= 0: return
    c.save(); c.translate(x, y); c.scale(s, s)
    c.move_to(0, 18); c.curve_to(-40, -10, -22, -42, 0, -22); c.curve_to(22, -42, 40, -10, 0, 18); c.close_path()
    c.set_source_rgba(0.88, 0.22, 0.27, a); c.fill_preserve(); c.set_source_rgba(*INK, a); c.set_line_width(3.5); c.stroke()
    c.restore()

def particles(c, t, n=24, a=0.25, seed=0):
    rnd = random.Random(seed)
    for i in range(n):
        x = (rnd.uniform(0, W) + t * rnd.uniform(-8, 8)) % W; y = (rnd.uniform(0, H) - t * rnd.uniform(6, 20)) % H
        c.arc(x, y, rnd.uniform(1, 2.6), 0, TAU); c.set_source_rgba(1, 1, 1, a * rnd.uniform(0.3, 1)); c.fill()


# ------------------------------------------------------------------ props (phone, office)
def text(c, x, y, s, size, col=INK, bold=True, align="left", alpha=1):
    c.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    c.set_font_size(size); e = c.text_extents(s)
    dx = {"left": 0, "center": -e.width / 2, "right": -e.width}[align] - e.x_bearing
    c.move_to(x + dx, y); c.set_source_rgba(*col, alpha); c.show_text(s); return e.width

def heart_shape(c, x, y, s, col=(0.88, 0.22, 0.27), a=1):
    if s <= 0.001: return
    c.save(); c.translate(x, y); c.scale(s, s)
    c.move_to(0, 18); c.curve_to(-40, -10, -22, -42, 0, -22); c.curve_to(22, -42, 40, -10, 0, 18); c.close_path()
    c.set_source_rgba(*col, a); c.fill(); c.restore()

def phone_screen(c, t, msgs, name="Him", clock="9:41", status=None, typing=None, top=150, bg=(0.93, 0.93, 0.95)):
    """Full-screen phone close-up. msgs: [{side:'me'|'them', text, t, heart?}] appear at time t (absolute).
    Messages stack upwards from y=690, leaving the caption band clear."""
    X, Y, PW, PH = 130, top, 460, 980
    shadow(c, W / 2, Y + PH + 10, 260, 0.25)
    rrect(c, X, Y, PW, PH, 56); fill_stroke(c, (0.12, 0.12, 0.13), 5)
    rrect(c, X + 16, Y + 16, PW - 32, PH - 32, 44); c.set_source_rgb(*bg); c.fill()
    rrect(c, X + PW / 2 - 60, Y + 26, 120, 30, 15); c.set_source_rgb(0.12, 0.12, 0.13); c.fill()       # notch
    text(c, X + 50, Y + 52, clock, 20)
    c.rectangle(X + 16, Y + 70, PW - 32, 90); c.set_source_rgb(0.98, 0.98, 0.99); c.fill()
    line(c, [(X + 16, Y + 160), (X + PW - 16, Y + 160)], 2, INK, 0.15)
    c.arc(X + 80, Y + 115, 30, 0, TAU); fill_stroke(c, (0.95, 0.95, 0.96), 3)                          # avatar
    for sx in (-9, 9): c.arc(X + 80 + sx, Y + 112, 3, 0, TAU); c.set_source_rgb(*INK); c.fill()
    c.arc(X + 80, Y + 118, 8, 0.2 * math.pi, 0.8 * math.pi); c.set_line_width(2.5); c.stroke()
    text(c, X + 125, Y + 124, name, 26)
    rrect(c, X + 40, Y + PH - 110, PW - 80, 60, 30); fill_stroke(c, (1, 1, 1), 2.5, (0.6, 0.6, 0.62))   # input bar
    text(c, X + 66, Y + PH - 72, "Message...", 20, (0.6, 0.6, 0.62), bold=False)
    shown = [m for m in msgs if t >= m["t"]]
    y = 690
    if typing and typing[0] <= t < typing[1]:
        rrect(c, X + 40, y - 52, 96, 52, 26); c.set_source_rgb(0.80, 0.80, 0.83); c.fill()
        for k in range(3):
            b = 0.5 + 0.5 * math.sin(t * 10 - k * 0.9); c.arc(X + 64 + k * 24, y - 26 - b * 5, 7, 0, TAU); c.set_source_rgba(*INK, 0.4 + 0.5 * b); c.fill()
        y -= 70
    if status and shown:
        text(c, X + PW - 44, y, status, 17, (0.45, 0.45, 0.48), bold=False, align="right"); y -= 30
    for m in reversed(shown):
        c.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL); c.set_font_size(25)
        tw = c.text_extents(m["text"]).width + (34 if m.get("heart") else 0); bw = tw + 44; bh = 58
        sc = max(0.001, pop(t, m["t"], 0.22)); me = m["side"] == "me"
        bx = X + PW - 40 - bw if me else X + 40
        c.save(); c.translate(bx + (bw if me else 0), y - bh / 2); c.scale(sc, sc); c.translate(-(bx + (bw if me else 0)), -(y - bh / 2))
        rrect(c, bx, y - bh, bw, bh, 26)
        c.set_source_rgb(*((0.22, 0.22, 0.25) if me else (1, 1, 1))); c.fill_preserve()
        c.set_source_rgba(*INK, 0 if me else 0.25); c.set_line_width(2); c.stroke()
        text(c, bx + 22, y - 19, m["text"], 25, (1, 1, 1) if me else INK, bold=False)
        if m.get("heart"): heart_shape(c, bx + bw - 36, y - 30, 0.55)
        c.restore()
        y -= bh + 16
        if y < Y + 190: break

def office(c, t, clock_speed=0.0):
    floor_wall(c, (0.84, 0.84, 0.86), (0.74, 0.74, 0.77), (0.46, 0.45, 0.45))
    # window with skyline
    x, y, w, h = 400, 230, 260, 380
    rrect(c, x - 10, y - 10, w + 20, h + 20, 6); fill_stroke(c, (0.55, 0.55, 0.58), 4)
    g = cairo.LinearGradient(0, y, 0, y + h); g.add_color_stop_rgb(0, 0.95, 0.95, 0.97); g.add_color_stop_rgb(1, 0.78, 0.80, 0.85)
    c.rectangle(x, y, w, h); c.set_source(g); c.fill()
    rnd = random.Random(4); bx = x
    while bx < x + w:
        bw = rnd.randint(28, 56); bh = rnd.randint(90, 260)
        c.rectangle(bx, y + h - bh, bw, bh); c.set_source_rgb(0.62, 0.63, 0.67); c.fill()
        for wy in range(int(y + h - bh + 14), int(y + h - 6), 22):
            for wx in range(bx + 6, bx + bw - 8, 14): c.rectangle(wx, wy, 6, 9); c.set_source_rgb(0.80, 0.81, 0.85); c.fill()
        bx += bw + 4
    c.rectangle(x, y, w, h); c.set_source_rgb(*INK); c.set_line_width(4); c.stroke()
    line(c, [(x + w / 2, y), (x + w / 2, y + h)], 6, (0.5, 0.5, 0.53))
    wall_clock(c, 190, 300, 62, t * clock_speed)

def wall_clock(c, x, y, r, spin):
    c.arc(x, y, r, 0, TAU); fill_stroke(c, (0.98, 0.98, 0.98), 5)
    for k in range(12):
        a = k * TAU / 12; line(c, [(x + math.cos(a) * r * 0.78, y + math.sin(a) * r * 0.78), (x + math.cos(a) * r * 0.9, y + math.sin(a) * r * 0.9)], 3)
    a1 = -math.pi / 2 + spin; a2 = -math.pi / 2 + spin / 12 + 1.2
    line(c, [(x, y), (x + math.cos(a1) * r * 0.75, y + math.sin(a1) * r * 0.75)], 4)
    line(c, [(x, y), (x + math.cos(a2) * r * 0.5, y + math.sin(a2) * r * 0.5)], 6)
    c.arc(x, y, 5, 0, TAU); c.set_source_rgb(*INK); c.fill()

def laptop(c, x, y, glow_on=1.0):
    """x,y = centre of the base on the desk top."""
    c.move_to(x - 120, y); c.line_to(x + 120, y); c.line_to(x + 100, y - 14); c.line_to(x - 100, y - 14); c.close_path()
    fill_stroke(c, (0.55, 0.55, 0.58), 3)
    c.move_to(x - 96, y - 14); c.line_to(x + 96, y - 14); c.line_to(x + 108, y - 150); c.line_to(x - 84, y - 150); c.close_path()
    fill_stroke(c, (0.20, 0.20, 0.22), 4)
    glow(c, x + 6, y - 80, 150, (0.8, 0.9, 1), 0.25 * glow_on)

def paper_stack(c, x, y, n, seed=0):
    rnd = random.Random(seed)
    for k in range(n):
        dx = rnd.uniform(-8, 8); c.save(); c.translate(x + dx, y - k * 7); c.rotate(rnd.uniform(-0.05, 0.05))
        c.rectangle(-55, -7, 110, 7); fill_stroke(c, (0.97, 0.97, 0.96), 2); c.restore()

def flying_paper(c, x0, y0, x1, y1, p, seed):
    if p <= 0: return
    rnd = random.Random(seed); x = lerp(x0, x1, p); y = lerp(y0, y1, p) - math.sin(p * math.pi) * 120
    c.save(); c.translate(x, y); c.rotate((1 - p) * rnd.uniform(-3, 3))
    c.rectangle(-36, -46, 72, 92); fill_stroke(c, (0.98, 0.98, 0.97), 2.5)
    for k in range(5): line(c, [(-24, -30 + k * 14), (18 - (k % 2) * 14, -30 + k * 14)], 2, INK, 0.4)
    c.restore()

def todo_board(c, x, y, items, t, checks, sc=1.0):
    """Clipboard with a to-do list. checks[i] = time item i gets ticked (absolute) or None."""
    if sc <= 0: return
    c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(0.04)
    rrect(c, -150, -230, 300, 470, 18); fill_stroke(c, (0.45, 0.38, 0.32), 4)
    c.rectangle(-128, -200, 256, 420); fill_stroke(c, (0.99, 0.99, 0.98), 2.5)
    rrect(c, -50, -246, 100, 40, 10); fill_stroke(c, (0.7, 0.7, 0.73), 3)
    text(c, 0, -160, "TO DO", 28, align="center")
    for i, it in enumerate(items):
        iy = -110 + i * 46
        c.rectangle(-108, iy - 20, 24, 24); fill_stroke(c, (1, 1, 1), 2.5)
        last = i == len(items) - 1
        text(c, -72, iy, it, 22 if not last else 22, (0.85, 0.2, 0.25) if last else INK, bold=last)
        ck = checks[i] if i < len(checks) else None
        if ck is not None and t >= ck:
            p = seg(t, ck, ck + 0.18)
            pts = [(-104, iy - 9), (-97, iy), (-80, iy - 26)]
            n = 2 if p < 0.5 else 3; line(c, pts[:n], 4.5, (0.15, 0.55, 0.3))
    c.restore()

def thought_cloud(c, x, y, w, h, sc=1.0, a=1.0):
    if sc <= 0: return
    c.save(); c.translate(x, y); c.scale(sc, sc)
    rnd = random.Random(11)
    for k in range(14):
        ang = k * TAU / 14; r = rnd.uniform(0.18, 0.26) * w
        c.new_sub_path(); c.arc(math.cos(ang) * w * 0.40, math.sin(ang) * h * 0.38, r, 0, TAU)
    c.new_sub_path(); c.arc(0, 0, min(w, h) * 0.42, 0, TAU)
    c.set_fill_rule(cairo.FILL_RULE_WINDING); c.set_source_rgba(1, 1, 1, a); c.fill_preserve()
    c.set_source_rgba(*INK, a); c.set_line_width(4); c.stroke()
    c.restore()
    # re-fill interior to hide inner strokes
    c.save(); c.translate(x, y); c.scale(sc, sc)
    rnd = random.Random(11)
    for k in range(14):
        ang = k * TAU / 14; r = rnd.uniform(0.18, 0.26) * w - 4
        c.new_sub_path(); c.arc(math.cos(ang) * w * 0.40, math.sin(ang) * h * 0.38, r, 0, TAU)
    c.new_sub_path(); c.arc(0, 0, min(w, h) * 0.42 - 4, 0, TAU)
    c.set_source_rgba(1, 1, 1, a); c.fill(); c.restore()

def tag(c, x, y, s, size=24, sc=1.0, fill=(1, 1, 1), col=INK, rot=0.0):
    if sc <= 0: return
    c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(rot)
    c.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); c.set_font_size(size)
    e = c.text_extents(s); w = e.width + 30; h = size + 22
    rrect(c, -w / 2, -h / 2, w, h, 10); fill_stroke(c, fill, 3.5)
    text(c, 0, size * 0.36, s, size, col, align="center"); c.restore()

def broken_heart(c, x, y, s, sc=1.0):
    if sc <= 0: return
    c.save(); c.translate(x, y); c.scale(s * sc, s * sc)
    for side, off in ((-1, -5), (1, 5)):
        c.save(); c.translate(off, 0); c.rotate(side * 0.12)
        c.move_to(0, -22)
        if side < 0: c.curve_to(-22, -42, -40, -10, 0, 18)
        else: c.curve_to(22, -42, 40, -10, 0, 18)
        c.line_to(-6 * side, 4); c.line_to(6 * side, -8); c.close_path()
        c.set_source_rgb(0.88, 0.22, 0.27); c.fill_preserve(); c.set_source_rgb(*INK); c.set_line_width(3); c.stroke(); c.restore()
    c.restore()

def storm_cloud(c, x, y, s, t, a=1.0):
    c.save(); c.translate(x + math.sin(t * 1.5) * 6, y); c.scale(s, s)
    for bx, by, r in ((-50, 0, 40), (-10, -24, 50), (40, -6, 42), (70, 12, 30), (-80, 16, 28)):
        c.new_sub_path(); c.arc(bx, by, r, 0, TAU)
    c.set_source_rgba(0.35, 0.35, 0.38, a); c.fill()
    if int(t * 4) % 7 == 0:
        c.move_to(0, 30); c.line_to(-16, 70); c.line_to(2, 70); c.line_to(-12, 110); c.line_to(24, 60); c.line_to(6, 60); c.line_to(18, 30); c.close_path()
        c.set_source_rgba(1, 0.92, 0.3, a); c.fill()
    c.restore()

# ------------------------------------------------------------------ props (episodes 3-5)
def battery(c, x, y, level, t, charging=False, sc=1.0):
    """Battery icon. level 0..1; colour goes red -> yellow -> green."""
    if sc <= 0: return
    c.save(); c.translate(x, y); c.scale(sc, sc)
    rrect(c, -62, -30, 124, 60, 12); fill_stroke(c, (1, 1, 1), 5)
    rrect(c, 62, -12, 12, 24, 4); c.set_source_rgb(*INK); c.fill()
    col = (0.86, 0.2, 0.22) if level < 0.25 else (0.95, 0.75, 0.15) if level < 0.6 else (0.25, 0.7, 0.35)
    if level < 0.25 and int(t * 4) % 2 == 0 and not charging: col = (1, 0.5, 0.5)
    w = max(4, 108 * max(0, min(1, level))); rrect(c, -54, -22, w, 44, 7); c.set_source_rgb(*col); c.fill()
    if charging:
        c.move_to(6, -26); c.line_to(-14, 4); c.line_to(0, 4); c.line_to(-6, 26); c.line_to(16, -6); c.line_to(2, -6); c.close_path()
        c.set_source_rgb(1, 0.92, 0.3); c.fill_preserve(); c.set_source_rgb(*INK); c.set_line_width(2.5); c.stroke()
    text(c, 0, 62, f"{int(round(level * 100))}%", 26, align="center")
    c.restore()

def door(c, x, y, w=150, h=300, open_amt=0.0):
    """Door on the back wall; (x, y) = bottom-left. open_amt 0 closed .. 1 wide open."""
    rrect(c, x - 10, y - h - 10, w + 20, h + 14, 4); fill_stroke(c, (0.55, 0.53, 0.52), 4)
    c.rectangle(x, y - h, w, h); c.set_source_rgb(0.12, 0.12, 0.13); c.fill()
    ww = w * (1 - 0.8 * open_amt)
    c.rectangle(x, y - h, ww, h); fill_stroke(c, (0.62, 0.58, 0.55), 4)
    if ww > 30:
        rrect(c, x + 14, y - h + 20, ww - 28, h * 0.38, 4); fill_stroke(c, (0.66, 0.62, 0.59), 2.5)
        rrect(c, x + 14, y - h * 0.52, ww - 28, h * 0.42, 4); fill_stroke(c, (0.66, 0.62, 0.59), 2.5)
        c.arc(x + ww - 18, y - h * 0.5, 7, 0, TAU); fill_stroke(c, (0.85, 0.75, 0.4), 2)

def armchair(c, x, y):
    """y = seat line; x = centre."""
    rrect(c, x - 95, y - 170, 190, 180, 30); fill_stroke(c, (0.40, 0.38, 0.40), 4)
    rrect(c, x - 110, y - 14, 220, 64, 18); fill_stroke(c, (0.34, 0.32, 0.34), 4)
    for ax in (x - 130, x + 90): rrect(c, ax, y - 80, 40, 136, 16); fill_stroke(c, (0.30, 0.28, 0.30), 4)
    for lx in (x - 90, x + 80): c.rectangle(lx, y + 50, 12, 26); fill_stroke(c, (0.15, 0.15, 0.16), 3)

def mug(c, x, y, t, steam=True, s=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    rrect(c, -20, -40, 40, 42, 6); fill_stroke(c, (0.97, 0.97, 0.98), 3.5)
    c.arc(22, -20, 11, -1.4, 1.4); c.set_source_rgb(*INK); c.set_line_width(3.5); c.stroke()
    if steam:
        for k in (-8, 8):
            c.move_to(k, -48)
            for j in range(4): c.line_to(k + math.sin(t * 4 + j + k) * 6, -48 - j * 12)
            c.set_source_rgba(*INK, 0.35); c.set_line_width(2.5); c.stroke()
    c.restore()

def bag(c, x, y, s=1.0, shade=0.85):
    """Shopping bag hanging from a hand at (x, y)."""
    c.save(); c.translate(x, y); c.scale(s, s)
    c.arc(0, 16, 14, math.pi, 0); c.set_source_rgb(*INK); c.set_line_width(3.5); c.stroke()
    c.move_to(-30, 16); c.line_to(30, 16); c.line_to(36, 96); c.line_to(-36, 96); c.close_path(); fill_stroke(c, (shade, shade * 0.95, shade * 0.88), 3.5)
    for k, (ox, col) in enumerate(((-14, (0.3, 0.6, 0.3)), (10, (0.9, 0.6, 0.2)))):
        c.arc(ox, 12, 12, 0, TAU); c.set_source_rgb(*col); c.fill()
    c.restore()

def wrench(c, x, y, rot, s=1.0):
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    line(c, [(0, 0), (0, -62)], 12, (0.55, 0.57, 0.6)); line(c, [(0, 0), (0, -62)], 4, (0.75, 0.77, 0.8))
    c.arc(0, -70, 16, 0, TAU); c.set_source_rgb(0.55, 0.57, 0.6); c.fill()
    c.rectangle(-6, -92, 12, 16); c.set_source_rgb(1, 1, 1); c.fill()
    c.restore()

def calendar(c, x, y, sc=1.0, circled=0.0, note="Her mum's birthday"):
    if sc <= 0: return
    c.save(); c.translate(x, y); c.scale(sc, sc)
    rrect(c, -130, -120, 260, 240, 12); fill_stroke(c, (1, 1, 1), 4)
    rrect(c, -130, -120, 260, 50, 12); c.set_source_rgb(0.86, 0.22, 0.27); c.fill()
    text(c, 0, -86, "SATURDAY", 24, (1, 1, 1), align="center")
    for r in range(3):
        for k in range(5):
            text(c, -100 + k * 50, -30 + r * 46, str(8 + r * 5 + k), 20, INK, bold=False, align="center")
    if circled > 0:
        c.save(); c.translate(0, 16); c.scale(1.2, 1); c.new_sub_path()
        c.arc(0, -8, 26, -1.5, -1.5 + TAU * circled); c.set_source_rgb(0.86, 0.22, 0.27); c.set_line_width(5); c.stroke(); c.restore()
    text(c, 0, 108, note, 18, (0.86, 0.22, 0.27), align="center")
    c.restore()

def mask(c, x, y, r, sc=1.0, rot=0.0, a=1.0):
    """Big smiling theatre mask held in front of a face (centre x, y)."""
    if sc <= 0: return
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc)
    c.save(); c.scale(1, 1.15); c.arc(0, 0, r, 0, TAU); c.restore()
    c.set_source_rgba(0.99, 0.97, 0.9, a); c.fill_preserve(); c.set_source_rgba(*INK, a); c.set_line_width(4.5); c.stroke()
    for sd in (-1, 1):
        c.save(); c.translate(sd * r * 0.36, -r * 0.18); c.scale(1.3, 0.8); c.arc(0, 0, r * 0.15, math.pi, TAU); c.restore()
        c.set_source_rgba(*INK, a); c.set_line_width(5); c.stroke()
        c.arc(sd * r * 0.62, r * 0.28, r * 0.13, 0, TAU); c.set_source_rgba(0.95, 0.55, 0.55, 0.6 * a); c.fill()
    c.move_to(-r * 0.5, r * 0.25); c.curve_to(-r * 0.3, r * 0.8, r * 0.3, r * 0.8, r * 0.5, r * 0.25); c.close_path()
    c.set_source_rgba(*INK, a); c.fill()
    c.restore()

def sweat(c, x, y, sc=1.0):
    if sc <= 0: return
    c.save(); c.translate(x, y); c.scale(sc, sc)
    c.move_to(0, -16); c.curve_to(10, 0, 12, 10, 0, 12); c.curve_to(-12, 10, -10, 0, 0, -16); c.close_path()
    fill_stroke(c, (0.7, 0.85, 1.0), 2.5); c.restore()

def blob(c, x, y, r, label, t, seed, a=1.0):
    """Dark scribbly feeling blob with a label (FEAR, WORRY...)."""
    rnd = random.Random(seed)
    c.save(); c.translate(x, y)
    pts = []
    for k in range(10):
        ang = k * TAU / 10; rr = r * (0.85 + 0.25 * math.sin(t * 3 + k * 1.7 + seed))
        pts.append((math.cos(ang) * rr, math.sin(ang) * rr))
    c.move_to(*pts[0])
    for k in range(1, 11): p0 = pts[k % 10]; c.line_to(*p0)
    c.close_path(); c.set_source_rgba(0.18, 0.18, 0.2, 0.92 * a); c.fill()
    for sd in (-1, 1): c.arc(sd * r * 0.3, -r * 0.15, r * 0.12, 0, TAU); c.set_source_rgba(1, 1, 1, a); c.fill()
    c.restore()
    text(c, x, y + r * 0.45, label, max(14, int(r * 0.3)), (1, 1, 1), align="center", alpha=a)

def shield_arc(c, x, y, r, a):
    if a <= 0: return
    c.arc(x, y, r, 0, TAU); c.set_source_rgba(1, 0.95, 0.6, 0.18 * a); c.fill_preserve()
    c.set_source_rgba(1, 0.85, 0.3, 0.8 * a); c.set_line_width(5); c.stroke()

def spotlight(c, x, a=1.0):
    c.move_to(x - 40, -100); c.line_to(x + 40, -100); c.line_to(x + 220, 1000); c.line_to(x - 220, 1000); c.close_path()
    c.set_source_rgba(1, 1, 0.9, 0.16 * a); c.fill()

def big_heart_jar(c, x, y, n, sc=1.0):
    """Hearts collecting into a big heart outline."""
    if sc <= 0: return
    c.save(); c.translate(x, y); c.scale(sc * 4.2, sc * 4.2)
    c.move_to(0, 18); c.curve_to(-40, -10, -22, -42, 0, -22); c.curve_to(22, -42, 40, -10, 0, 18); c.close_path()
    c.set_source_rgba(1, 1, 1, 0.5); c.fill_preserve(); c.set_source_rgba(*INK, 1); c.set_line_width(1.2); c.stroke()
    c.restore()

# ------------------------------------------------------------------ camera
def cam(c, z, cx, cy, dx=0, dy=0):
    c.translate(W / 2 + dx, H / 2 + dy); c.scale(z, z); c.translate(-cx, -cy)


# ------------------------------------------------------------------ captions
# ------------------------------------------------------------------ captions
def build_words(timing):
    words = []
    for ph in timing:
        ws = ph["text"].replace(",", "").replace(".", "").replace("?", "").replace("!", "").split()
        wts = [len(w) + 2 for w in ws]; tot = sum(wts); t = ph["start"]; span = ph["end"] - ph["start"]
        group = []
        for w, wt in zip(ws, wts):
            d = span * wt / tot; group.append({"w": w.upper(), "s": t, "e": t + d}); t += d
        # chunk into <= 3 words / 16 chars
        chunk = []
        for g in group:
            if chunk and (len(chunk) >= 3 or sum(len(x["w"]) + 1 for x in chunk) + len(g["w"]) > 16):
                words.append(chunk); chunk = []
            chunk.append(g)
        if chunk: words.append(chunk)
    for i, ch in enumerate(words):
        ch_end = words[i + 1][0]["s"] if i + 1 < len(words) else ch[-1]["e"] + 0.6
        for g in ch: g["chunk_end"] = min(ch_end, ch[-1]["e"] + 0.45)
    return words

HIGHLIGHT = set()
def draw_caption(img, chunks, t, font):
    cur = None
    for ch in chunks:
        if ch[0]["s"] - 0.05 <= t < ch[0]["chunk_end"]: cur = ch
    if not cur: return
    d = ImageDraw.Draw(img); sp = 16
    sizes = [d.textbbox((0, 0), g["w"], font=font, stroke_width=5) for g in cur]
    ws = [b[2] - b[0] for b in sizes]; total = sum(ws) + sp * (len(cur) - 1)
    x = (W - total) / 2; y = int(H * 0.60)
    for g, w in zip(cur, ws):
        active = g["s"] <= t < g["e"] + 0.05 or (g is cur[-1] and t >= g["s"])
        key = g["w"] in HIGHLIGHT
        if active:
            k = min(1, (t - g["s"]) / 0.08); grow = int(4 * (1 - abs(1 - 2 * min(1, (t - g["s"]) / 0.16))))
            d.rounded_rectangle((x - 9 - grow, y - 6 - grow, x + w + 9 + grow, y + 56 + grow), radius=8,
                                fill=(255, 225, 0) if key else (255, 255, 255), outline=(20, 20, 20), width=4)
            d.text((x, y), g["w"], font=font, fill=(18, 18, 18))
        else:
            d.text((x, y), g["w"], font=font, fill=(255, 255, 255), stroke_width=5, stroke_fill=(15, 15, 15))
        x += w + sp


# ------------------------------------------------------------------ timing helpers for scenes
TIMING = []
def ls(i): return TIMING[i]["start"]     # line i starts (absolute seconds)
def le(i): return TIMING[i]["end"]       # line i ends

# ------------------------------------------------------------------ voice
def synth_voice(lines, outdir, voice):
    import soundfile as sf
    from kokoro_onnx import Kokoro
    md = os.environ.get("KOKORO_DIR", os.path.join(HERE, "models"))
    k = Kokoro(os.path.join(md, "kokoro-v1.0.int8.onnx"), os.path.join(md, "voices-v1.0.bin"))
    sr = 24000; t = 0.35; out = [np.zeros(int(sr * t), np.float32)]; timing = []
    for ln in lines:
        a, sr = k.create(ln["say"], voice=ln.get("voice", voice), speed=ln.get("speed", 1.0), lang="en-us")
        idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(idx[0] - 200, 0): idx[-1] + 400]
        d = len(a) / sr; timing.append({"text": ln.get("caption", ln["say"]), "start": round(t, 3), "end": round(t + d, 3)})
        gap = ln.get("gap", 0.35); out += [a.astype(np.float32), np.zeros(int(sr * gap), np.float32)]; t += d + gap
    sf.write(os.path.join(outdir, "vo.wav"), np.concatenate(out), sr)
    json.dump(timing, open(os.path.join(outdir, "timing.json"), "w"), indent=1)
    return timing

# ------------------------------------------------------------------ render
def load_episode(path):
    import importlib.util
    spec = importlib.util.spec_from_file_location("episode", os.path.join(path, "episode.py"))
    ep = importlib.util.module_from_spec(spec); spec.loader.exec_module(ep); return ep

def scene_table(ep, total, lead=0.12):
    S = []
    for k, (li, fn) in enumerate(ep.SCENES):
        st = 0.0 if k == 0 else max(0.0, ls(li) - lead)
        S.append([st, None, fn])
    for k in range(len(S)): S[k][1] = S[k + 1][0] if k + 1 < len(S) else total
    return S

def render_frame(surf, S, t, XF=0.2):
    def one(k):
        c = cairo.Context(surf); c.set_source_rgb(1, 1, 1); c.paint(); c.save(); S[k][2](c, t, S[k][:2]); c.restore()
        surf.flush(); return np.ndarray((H, W, 4), np.uint8, surf.get_data())[..., [2, 1, 0]].astype(np.float32)
    idx = max(i for i, s in enumerate(S) if s[0] <= t)
    fr = one(idx)
    if idx > 0 and t - S[idx][0] < XF:
        a = (t - S[idx][0]) / XF; fr = one(idx - 1) * (1 - a) + fr * a
    return fr

def main():
    global TIMING, HIGHLIGHT
    epdir = sys.argv[1]; ep = load_episode(epdir)
    HIGHLIGHT = set(w.upper() for w in getattr(ep, "HIGHLIGHT", []))
    still = "--still" in sys.argv
    tpath = os.path.join(epdir, "timing.json")
    if still and os.path.exists(tpath): TIMING = json.load(open(tpath))
    else: TIMING = synth_voice(ep.LINES, epdir, getattr(ep, "VOICE", os.environ.get("VOICE", "am_michael")))
    wav = os.path.join(epdir, "vo.wav")
    total = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]))
    S = scene_table(ep, total); chunks = build_words(TIMING); font = ImageFont.truetype(FONT, 46)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    if still:
        i = sys.argv.index("--still"); t = float(sys.argv[i + 1])
        img = Image.fromarray(np.clip(render_frame(surf, S, t), 0, 255).astype(np.uint8)); draw_caption(img, chunks, t, font)
        img.save(sys.argv[i + 2]); return
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(epdir, "out.mp4")
    yy, xx = np.mgrid[0:H, 0:W]; vig = 1 - 0.38 * (((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.7)) ** 2)
    vig = np.clip(vig, 0, 1)[..., None].astype(np.float32); rng = np.random.default_rng(1)
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(int(total * FPS)):
        t = f / FPS
        fr = render_frame(surf, S, t) * vig + rng.normal(0, 4, (H, W, 1)).astype(np.float32)
        img = Image.fromarray(np.clip(fr, 0, 255).astype(np.uint8)); draw_caption(img, chunks, t, font)
        ff.stdin.write(img.tobytes())
        if f % 90 == 0: print(f"{t:5.1f}s / {total:.1f}s", flush=True)
    ff.stdin.close(); ff.wait(); print("wrote", out)

if __name__ == "__main__":
    sys.modules["studio"] = sys.modules[__name__]   # episodes import this same module
    main()
