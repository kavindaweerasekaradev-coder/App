"""Episode 5: Why doesn't he say "I love you" very often?"""
import math
from studio import *

VOICE = "am_michael"
LINES = [
    {"say": "Why doesn't he say, I love you, very often?"},
    {"say": "Some people say it every day.", "gap": 0.2},
    {"say": "Others hardly say it at all.", "gap": 0.4},
    {"say": "But watch what he does.", "gap": 0.35},
    {"say": "He fixes the thing you mentioned once.", "gap": 0.3},
    {"say": "He makes your tea, just the way you like it.", "gap": 0.3},
    {"say": "He carries the heavy bags, without being asked.", "gap": 0.3},
    {"say": "He remembers the little things.", "gap": 0.45},
    {"say": "For him, those are the words.", "gap": 0.45},
    {"say": "Some people say I love you, with actions.", "gap": 0.2},
    {"say": "You just have to learn his language.", "gap": 0.7},
]
HIGHLIGHT = ["LOVE", "EVERY", "HARDLY", "WATCH", "DOES", "FIXES", "TEA", "BAGS", "REMEMBERS", "WORDS", "ACTIONS", "LANGUAGE"]

ACTS = [4, 5, 6, 7]          # lines whose action earns a heart
def tally(c, t):
    """Row of hearts in screen space that fills as he does loving things."""
    c.identity_matrix()
    n = sum(1 for li in ACTS if t > ls(li) + 1.0)
    rrect(c, W / 2 - 150, 120, 300, 70, 35); c.set_source_rgba(1, 1, 1, 0.85); c.fill()
    for k in range(4):
        x = W / 2 - 105 + k * 70
        if k < n:
            li = ACTS[k]; heart_shape(c, x, 158, 0.75 * pop(t, ls(li) + 1.0, 0.3))
        else:
            heart_shape(c, x, 158, 0.75, col=(0.75, 0.75, 0.78))

def heart_pop(c, x, y, t, t0):
    if t > t0:
        p = seg(t, t0, t0 + 0.9)
        heart(c, x, y - 60 * p, 1.1 * pop(t, t0, 0.3), 1 - seg(t, t0 + 0.7, t0 + 1.0))


def sc_intro(c, t, T):          # she says I love you; he smiles awkwardly
    lt = t - T[0]
    cam(c, lerp(1.05, 1.12, seg(lt, 0, T[1] - T[0])), 300, 700)
    living_room(c, t, 1.0); couch(c, 60, 840, 330)
    woman(c, 160, 830, t, pose="sit", dir=1, expr="smile", turn=0.7, s=0.95)
    hx, hy, hr = man(c, 300, 830, t, dir=-1, expr="neutral" if lt < 1.2 else "worried", turn=-0.5, arms="lap")
    bubble(c, 170, 520, "I love you", 0, 70, pop(lt, 0.15), size=30)
    heart_shape(c, 270, 505, 0.6 * pop(lt, 0.3, 0.25))
    bubble(c, 360, 470, "...", -30, 70, pop(lt, 1.2), size=30)
    sweat(c, hx + hr * 0.8, hy - hr * 0.2, pop(lt, 1.4, 0.25))


def sc_words(c, t, T):          # many "I love you" bubbles, then just one quiet "..."
    s2 = ls(2)
    c.set_source_rgb(0.30, 0.30, 0.33); c.paint()
    gone = seg(t, s2, s2 + 0.35)
    spots = [(180, 260), (480, 230), (330, 370), (150, 470), (540, 440), (340, 560), (180, 640), (520, 650),
             (170, 960), (500, 940), (330, 1080), (560, 1110)]
    for k, (x, y) in enumerate(spots):
        sz = (26, 30, 34)[k % 3]
        sc = pop(t, T[0] + 0.1 + k * 0.12, 0.2) * (1 - gone)
        if sc > 0.35:
            bubble(c, x, y, "I love you", 0, 50 * sc, sc, size=sz)
    bubble(c, 360, 520, "...", 0, 60, pop(t, s2 + 0.4, 0.3), size=40)


def sc_watch(c, t, T):          # spotlight on him
    lt = t - T[0]
    cam(c, lerp(1.0, 1.15, seg(lt, 0, T[1] - T[0])), 380, 720)
    living_room(c, t, 0.5); couch(c, 60, 840, 300)
    woman(c, 160, 830, t, pose="sit", dir=1, expr="neutral", turn=0.7)
    c.set_source_rgba(0, 0, 0, 0.35 * seg(lt, 0, 0.5)); c.paint()
    spotlight(c, 470, seg(lt, 0.2, 0.6))
    man(c, 470, 1060, t, pose="stand", dir=-1, expr="neutral", turn=-0.3, arms="down")
    tally(c, t)


def sc_fix(c, t, T):            # he fixes the wobbly lamp she mentioned once
    lt = t - T[0]; fixed = ls(4) + 1.0
    cam(c, lerp(1.05, 1.12, seg(lt, 0, T[1] - T[0])), 360, 700)
    living_room(c, t, 0)
    flick = 1.0 if t > fixed else (0.15 if int(t * 7) % 3 else 0.7)
    tilt = 0 if t > fixed else 0.18 + 0.03 * math.sin(t * 9)
    c.save(); c.translate(300, 1000); c.rotate(tilt); c.translate(-300, -1000); floor_lamp(c, 300, 1000, flick); c.restore()
    man(c, 430, 1060, t, pose="stand", dir=-1, expr="neutral" if t < fixed else "smile", turn=-0.5, arms="tool" if t < fixed else "down")
    if t < fixed: wrench(c, HANDS[1][0], HANDS[1][1], -0.6 + 0.3 * math.sin(t * 12), 0.8)
    heart_pop(c, 350, 560, t, fixed)
    tally(c, t)


def sc_tea(c, t, T):            # he brings her tea
    lt = t - T[0]; give = ls(5) + 1.0
    cam(c, lerp(1.05, 1.12, seg(lt, 0, T[1] - T[0])), 380, 660)
    kitchen(c, t); chair(c, 520, 840, 1)
    woman(c, 520, 830, t, pose="sit", dir=-1, expr="smile" if t > give else "neutral", turn=-0.6, s=0.95)
    kitchen_table(c)
    mx = lerp(130, 300, seg(lt, 0, 0.9))
    man(c, mx, 1080, t, pose="stand", dir=1, expr="smile", turn=0.5, arms="give", walk=lt < 0.9)
    hxy = HANDS[1]
    if t < give: mug(c, hxy[0] + 6, hxy[1] + 6, t, s=0.9)
    else: mug(c, 420, 792, t, s=0.9)
    heart_pop(c, 470, 560, t, give)
    tally(c, t)


def sc_bags(c, t, T):           # he carries the heavy bags in, unasked
    lt = t - T[0]; done = ls(6) + 1.0
    cam(c, lerp(1.0, 1.06, seg(lt, 0, T[1] - T[0])), 360, 720)
    living_room(c, t, 0.8); door(c, 470, 880, 1)
    couch(c, 60, 840, 300)
    woman(c, 160, 830, t, pose="sit", dir=1, expr="surprised" if t < done else "smile", turn=0.7)
    mx = lerp(560, 360, seg(lt, 0, 1.6))
    man(c, mx, 1080, t, pose="stand", dir=-1, expr="smile", turn=-0.4, arms="carry", walk=lt < 1.6)
    for k, h in enumerate(HANDS): bag(c, h[0], h[1] - 6, 0.85, 0.85 - 0.08 * k)
    heart_pop(c, 300, 560, t, done)
    tally(c, t)


def sc_remember(c, t, T):       # the date he remembered, circled on the calendar
    lt = t - T[0]; done = ls(7) + 1.0
    cam(c, lerp(1.0, 1.06, seg(lt, 0, T[1] - T[0])), 360, 640)
    kitchen(c, t)
    calendar(c, 470, 470, pop(lt, 0.1, 0.3), seg(lt, 0.5, 1.2))
    man(c, 200, 1080, t, pose="stand", dir=1, expr="smile", turn=0.6, arms="give")
    hxy = HANDS[1]
    c.save(); c.translate(hxy[0] + 8, hxy[1]); c.rotate(-0.2)
    line(c, [(0, 10), (0, -60)], 5, (0.3, 0.55, 0.3))
    for k in range(6):
        a = k * TAU / 6; c.arc(math.cos(a) * 14, -70 + math.sin(a) * 14, 10, 0, TAU); c.set_source_rgb(0.95, 0.55, 0.65); c.fill()
    c.arc(0, -70, 8, 0, TAU); c.set_source_rgb(1, 0.85, 0.3); c.fill(); c.restore()
    heart_pop(c, 470, 700, t, done)
    tally(c, t)


def sc_words_are(c, t, T):      # the hearts gather into one big heart
    lt = t - T[0]
    c.set_source_rgb(0.30, 0.30, 0.33); c.paint()
    cam(c, 1.0, 360, 640)
    glow(c, 360, 420, 360, (1, 0.6, 0.6), 0.25 * seg(lt, 0.8, 1.6))
    big_heart_jar(c, 360, 450, 1.0 * pop(lt, 0.1, 0.3))
    for k in range(4):
        p = seg(lt, 0.3 + k * 0.2, 0.9 + k * 0.2)
        sx, sy = W / 2 - 105 + k * 70, 158
        tx, ty = 360 + (k - 1.5) * 40, 430 + (k % 2) * 30
        heart_shape(c, lerp(sx, tx, p), lerp(sy, ty, p) - math.sin(p * math.pi) * 80, lerp(0.75, 1.3, p))
    if lt > 1.4:
        c.save(); c.translate(360, 450); s = 4.2 * pop(lt, 1.4, 0.3)
        heart_shape(c, 0, 0, s); c.restore()
    man(c, 360, 1080, t, pose="stand", dir=1, expr="smile", turn=0, arms="down")


def sc_language(c, t, T):       # together on the couch; his language
    lt = t - T[0]; s10 = ls(10)
    cam(c, lerp(1.12, 1.2, seg(lt, 0, T[1] - T[0])), 260, 700)
    living_room(c, t, 1.0); couch(c, 60, 840, 300)
    woman(c, 140, 830, t, pose="sit", dir=-1, expr="smile", turn=0.6, tilt=0.06, s=0.95)
    man(c, 245, 830, t, dir=1, expr="smile", turn=-0.6, tilt=-0.05, arms="lap")
    heart(c, 195, 470 - 20 * math.sin(lt * 2), 1.4, 1)
    for k, (dx, dy) in enumerate([(-110, 40), (100, 20), (-60, -60), (80, -70)]):
        heart_shape(c, 195 + dx, 470 + dy + 10 * math.sin(t * 2 + k), 0.45 * pop(lt, 0.3 + k * 0.15, 0.3))
    tag(c, 230, 330, "HIS LANGUAGE", 28, pop(t, s10 + 0.8, 0.3), fill=(1, 0.93, 0.6), rot=-0.05)
    particles(c, t, 18, 0.3, 9)


SCENES = [(0, sc_intro), (1, sc_words), (3, sc_watch), (4, sc_fix), (5, sc_tea), (6, sc_bags), (7, sc_remember),
          (8, sc_words_are), (9, sc_language)]
