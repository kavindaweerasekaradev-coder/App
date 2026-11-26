"""The Path to Awakening, Episode 1 (Higgsfield images version): Queen Maha Maya's Dream.

Told according to the traditional account (Jataka Nidanakatha).
Painted illustrations (img/, made with gen_images.py from prompts.json) animated with camera moves,
light, mist, stars and petals. The queen is shown modestly, from behind; sacred moments use light."""
import math, os
from studio import *
from silhouette import *

VOICE = "bm_george"
CAPTION_STYLE = "soft"
MUSIC = "ambient"
S_ = 0.9   # calm narration speed
LINES = [
    {"say": "More than two and a half thousand years ago, in the kingdom of Kapilavastu,", "speed": S_, "gap": 0.2},
    {"say": "lived King Suddhodana, and Queen Maha Maya.", "speed": S_, "gap": 0.6},
    {"say": "On a full moon night, the queen had a strange and beautiful dream.", "speed": S_, "gap": 0.5},
    {"say": "Four great guardians lifted her bed,", "speed": S_, "gap": 0.2},
    {"say": "and carried her high into the Himalayas.", "speed": S_, "gap": 0.5},
    {"say": "There, beside a sacred lake, a white elephant appeared,", "speed": S_, "gap": 0.2},
    {"say": "holding a white lotus in its trunk.", "speed": S_, "gap": 0.5},
    {"say": "It circled her three times,", "speed": S_, "gap": 0.2},
    {"say": "and gently entered her right side.", "speed": S_, "gap": 0.7},
    {"say": "In the morning, the wise men gave their answer.", "speed": S_, "gap": 0.4},
    {"say": "A son will be born to you.", "speed": S_, "gap": 0.5},
    {"say": "He will become a great king of the world,", "speed": S_, "gap": 0.2},
    {"say": "or a Buddha, who shows the world the way beyond suffering.", "speed": S_, "gap": 0.7},
    {"say": "But what would this child become?", "speed": 0.85, "gap": 1.4},
]
HIGHLIGHT = ["Kapilavastu", "Suddhodana", "Maya", "dream", "guardians", "Himalayas", "elephant", "lotus", "three",
             "son", "king", "Buddha", "suffering", "become"]

IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")
def P(n): return os.path.join(IMG, f"{n}.jpg")
def prog(t, T): return seg(t, T[0], T[1])


def sc_kingdom(c, t, T):        # 01 palace at sunset
    p = prog(t, T)
    painting(c, P("01"), z=lerp(1.30, 1.12, p), fx=0.5, fy=lerp(0.40, 0.46, p))
    glow(c, 120, 300, 420, (1, 0.6, 0.3), 0.18 + 0.04 * math.sin(t * 2))
    birds(c, t, 6, 260, col=(0.15, 0.08, 0.08), speed=30)
    motes(c, t, 30, 1, a=0.35)
    title_card(c, t, 0.3, 4.4, "THE PATH TO AWAKENING", "Episode 1", "The Queen's Dream")


def sc_royals(c, t, T):         # 02 the queen on the palace steps
    p = prog(t, T)
    painting(c, P("02"), z=lerp(1.12, 1.22, p), fx=0.42, fy=lerp(0.40, 0.36, p))
    glow(c, 560, 260, 380, (1, 0.85, 0.55), 0.22)
    motes(c, t, 35, 2, a=0.4)


def sc_night(c, t, T):          # 04 moonlit bedchamber
    p = prog(t, T)
    painting(c, P("04"), z=lerp(1.10, 1.24, p), fx=0.48, fy=lerp(0.35, 0.45, p))
    stars(c, t, 40, seed=3, a=0.8, ymax=300)
    glow(c, 360, 180, 260, (0.85, 0.9, 1.0), 0.18 + 0.05 * math.sin(t * 1.5))
    for k in range(9):                                                                    # dream sparkles rising
        q = (t * 0.22 + k / 9) % 1
        x = 230 + k * 32 + math.sin(t + k) * 12
        c.arc(x, 900 - q * 420, 2.6, 0, TAU); c.set_source_rgba(1, 1, 0.92, (1 - q) * seg(p, 0.25, 0.5)); c.fill()


def sc_flight(c, t, T):         # 11 above the clouds; the guardians carry her as a golden light
    p = prog(t, T)
    painting(c, P("11"), z=1.15, fx=0.5, fy=lerp(0.62, 0.38, ease(p)))
    mist(c, t, 980, a=0.30, seed=2)
    bx = lerp(130, 560, ease(p)); by = lerp(1000, 520, ease(p)) + math.sin(t * 2) * 10
    for k in range(14):                                                                   # light trail
        q = k / 14; tx = lerp(130, 560, ease(max(0, p - q * 0.18))); ty = lerp(1000, 520, ease(max(0, p - q * 0.18)))
        glow(c, tx, ty, 40 * (1 - q), (1, 0.85, 0.5), 0.35 * (1 - q))
    glow(c, bx, by, 170, (1, 0.88, 0.6), 0.75)
    glow(c, bx, by, 60, (1, 0.97, 0.88), 1.0)
    for k in range(4):                                                                    # four guardians as points of light
        ang = t * 1.2 + k * TAU / 4
        gx = bx + math.cos(ang) * 70; gy = by + math.sin(ang) * 28
        glow(c, gx, gy, 34, (1, 0.9, 0.6), 0.9); c.arc(gx, gy, 5, 0, TAU); c.set_source_rgb(1, 1, 0.95); c.fill()


def sc_lake(c, t, T):           # 05 sacred lake, then 06 the white elephant (holding its lotus) appears
    s5e = ls(5) + 1.6 - T[0]; lt = t - T[0]; p = prog(t, T)
    painting(c, P("05"), z=lerp(1.12, 1.2, p), fx=0.5, fy=0.45)
    mist(c, t, 760, a=0.25, seed=5)
    a = seg(lt, s5e, s5e + 1.0)
    if a > 0:
        painting(c, P("06"), z=lerp(1.22, 1.10, seg(lt, s5e, T[1] - T[0])), fx=0.42, fy=0.45, a=a)
        glow(c, 260, 720, 360, (1, 0.98, 0.92), 0.22 * a)
        if t > ls(6):
            glow(c, 470, 330, 160, (1, 0.97, 0.88), 0.5 * seg(t, ls(6), ls(6) + 0.6))   # the lotus shines
        mist(c, t, 1080, a=0.2 * a, seed=9)
    stars(c, t, 30, seed=8, a=0.5, ymax=200)


def sc_circle(c, t, T):         # 07 heavenly clouds; a light circles three times, then enters
    p = prog(t, T); s8 = ls(8)
    painting(c, P("07"), z=lerp(1.12, 1.25, p), fx=0.5, fy=0.62)
    cx, cy = 360, 800
    end = s8 + 0.4
    if t < end:
        q = seg(t, T[0], end); ang = q * TAU * 3 + math.pi / 2
        for k in range(18):                                                               # orbit trail
            a2 = ang - k * 0.09; tr = 1 - k / 18
            glow(c, cx + math.cos(a2) * 230, cy + math.sin(a2) * 70, 50 * tr, (1, 0.97, 0.9), 0.4 * tr)
        ex = cx + math.cos(ang) * 230; ey = cy + math.sin(ang) * 70
        glow(c, ex, ey, 120, (1, 0.98, 0.92), 0.85)
        white_elephant(c, ex, ey + 40, 0.22, t, a=0.9, dir=1 if math.sin(ang) > 0 else -1, lotus_on=False)
    else:
        q = seg(t, end, end + 0.8)
        glow(c, lerp(560, cx, q), lerp(760, cy, q), lerp(120, 60, q), (1, 0.97, 0.9), 0.9 * (1 - seg(t, end + 0.8, end + 1.4)))
        light_rays(c, cx, cy, 900, t, seg(t, end + 0.5, end + 1.2))
        glow(c, cx, cy, 380, (1, 0.9, 0.65), 0.5 * seg(t, end + 0.5, end + 1.0))
        petals(c, t, end + 0.5, 30)


def sc_wise_men(c, t, T):       # 08 the wise men at sunrise
    p = prog(t, T); s10 = ls(10)
    painting(c, P("08"), z=lerp(1.25, 1.12, p), fx=0.45, fy=0.55)
    light_rays(c, 360, 380, 900, t, 0.5)
    motes(c, t, 40, 6, a=0.45)
    if t > s10:
        lotus(c, 360, 420, 0.75 * pop(t, s10 + 0.1, 0.4), 1.0, glow_a=0.7)


def sc_two_paths(c, t, T):      # 09 a crown, or the wheel of truth (painted wheel lights up)
    p = prog(t, T); s12 = ls(12)
    painting(c, P("09"), z=1.10, fx=0.5, fy=0.55)
    crown_symbol(c, 360, 190, 0.8 * pop(t, T[0] + 0.3, 0.4), a=1 - 0.6 * seg(t, s12, s12 + 0.6))
    wy = 829
    c.set_source_rgba(0, 0, 0, 0.45 * (1 - seg(t, s12, s12 + 0.8))); c.paint()          # wheel dim until "Buddha"
    if t > s12:
        light_rays(c, 360, wy, 1100, t, seg(t, s12 + 0.1, s12 + 1.0))
        glow(c, 360, wy, 420, (1, 0.85, 0.5), 0.45 * seg(t, s12, s12 + 0.8))
    motes(c, t, 30, 12, a=0.4)


def sc_question(c, t, T):       # 10 the queen at dawn; to be continued
    p = prog(t, T)
    painting(c, P("10"), z=lerp(1.22, 1.10, p), fx=0.5, fy=0.42)
    glow(c, 360, 230, 360, (1, 0.9, 0.65), 0.28)
    motes(c, t, 30, 9, a=0.4)
    c.save(); c.identity_matrix(); c.rectangle(0, 0, W, 520)
    g = cairo.LinearGradient(0, 0, 0, 520); g.add_color_stop_rgba(0, 0, 0, 0, 0.55 * seg(t, T[0] + 1.0, T[0] + 1.6)); g.add_color_stop_rgba(1, 0, 0, 0, 0)
    c.set_source(g); c.fill(); c.restore()
    title_card(c, t, T[0] + 1.2, T[1] + 1, "NEXT EPISODE", "Birth in Lumbini", "Follow for Part 2")


SCENES = [(0, sc_kingdom), (1, sc_royals), (2, sc_night), (3, sc_flight), (5, sc_lake), (7, sc_circle),
          (9, sc_wise_men), (11, sc_two_paths), (13, sc_question)]
