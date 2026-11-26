"""Episode 1: Why does he go quiet when something is wrong?"""
import math
from studio import *

VOICE = "am_michael"
LINES = [
 {
  "say": "Why does he go quiet, when something is wrong?"
 },
 {
  "say": "You ask what's up.",
  "gap": 0.2
 },
 {
  "say": "He says, nothing.",
  "gap": 0.4
 },
 {
  "say": "And it feels like he's pulling away."
 },
 {
  "say": "But inside, his brain is busy,",
  "gap": 0.15
 },
 {
  "say": "trying to fix the problem on his own."
 },
 {
  "say": "Talking too early,",
  "gap": 0.1
 },
 {
  "say": "just feels like more pressure."
 },
 {
  "say": "So give him a little space.",
  "gap": 0.3
 },
 {
  "say": "He'll come back,",
  "gap": 0.15
 },
 {
  "say": "and he'll talk.",
  "gap": 0.6
 }
]
HIGHLIGHT = ["QUIET", "NOTHING", "PULLING", "AWAY", "BRAIN", "BUSY", "FIX", "OWN", "PRESSURE", "SPACE", "TALK"]

def sc_intro(c, t, T):          # living room: she stands, he sits head down
    lt = t - T[0]; d = T[1] - T[0]
    cam(c, lerp(1.0, 1.10, seg(lt, 0, d)), 360, 700)
    living_room(c, t); couch(c, 300, 840, 330); coffee_table(c, 250, 960, 260)
    woman(c, 170, 1000, t, dir=1, expr="worried", turn=0.6, tilt=-0.05 * seg(lt, 0.8, 1.6))
    man(c, 450, 830, t, dir=-1, expr="sad", look_down=1, tilt=0.18, arms="head")

def sc_ask(c, t, T):            # closer: "What's up?" / "Nothing."
    lt = t - T[0]; d = T[1] - T[0]
    cam(c, lerp(1.38, 1.46, seg(lt, 0, d)), 380, 680)
    living_room(c, t); couch(c, 300, 840, 330); coffee_table(c, 250, 960, 260)
    woman(c, 190, 1000, t, dir=1, expr="worried", turn=0.7, arms="reach" if lt < 1.1 else "down")
    man(c, 460, 830, t, dir=-1, expr="neutral" if lt > 1.2 else "sad", turn=-0.2 if lt > 1.2 else -0.5,
        look_down=0.3 if lt > 1.2 else 1, tilt=0.06, arms="lap")
    bubble(c, 230, 600, "What's up?", -20, 70, pop(lt, 0.05) * (1 - seg(lt, 1.15, 1.3)))
    bubble(c, 520, 540, "Nothing.", -30, 80, pop(lt, 1.25))

def sc_away(c, t, T):           # he turns away, she is sad; gap widens
    lt = t - T[0]; d = T[1] - T[0]
    sp = seg(lt, 0.2, 1.4)
    cam(c, lerp(1.25, 1.12, seg(lt, 0, d)), 360, 700)
    living_room(c, t, 0.6); couch(c, 300, 840, 330)
    c.save(); c.translate(0, 0)
    woman(c, 170 - sp * 30, 1000, t, dir=1, expr="sad", turn=0.5, look_down=0.4)
    man(c, 470 + sp * 70, 830, t, dir=1, expr="neutral", turn=0.6, look_down=0.6, arms="lap")
    c.restore()
    # crack in the floor between them
    p = seg(lt, 0.5, 1.6)
    if p > 0:
        pts = [(300, 880), (320, 930), (295, 985), (330, 1040), (305, 1110), (340, 1200)]
        n = max(2, int(len(pts) * p)); line(c, pts[:n], 5, (0.1, 0.1, 0.1), 0.8)
    c.set_source_rgba(0, 0, 0, 0.15 * sp); c.paint()

def sc_brain(c, t, T):          # dark study, puzzle brain assembles
    lt = t - T[0]; d = T[1] - T[0]
    cam(c, lerp(1.0, 1.12, seg(lt, 0, d)), 360, 640)
    study(c, t);
    man(c, 380, 780, t, dir=-1, expr="worried" if lt < 2.2 else "surprised", look_down=0.8 if lt < 2.2 else -0.3,
        tilt=0.12 if lt < 2.2 else -0.04, arms="head" if lt < 1.8 else "write")
    desk(c, t)
    hx, hy = 395, 520
    for k, (ox, oy, r) in enumerate([(-14, -84, 8), (-30, -110, 12), (-40, -146, 16)]):
        if lt > 0.2 + k * 0.12:
            c.arc(hx + ox, hy + oy, r, 0, TAU); fill_stroke(c, (0.85, 0.92, 1), 3)
    bs = 0.9 * pop(lt, 0.45, 0.4)
    if bs > 0: puzzle_brain(c, 360, 300, bs, lt, 0.7, 3.2, seg(lt, 3.3, 3.8))
    particles(c, t, 30, 0.18, 3)

def sc_pressure(c, t, T):       # kitchen table, scribble bubbles multiply
    lt = t - T[0]; d = T[1] - T[0]
    cam(c, lerp(1.05, 1.22, seg(lt, 0, d)), 360, 640, dx=math.sin(lt * 30) * 2 * seg(lt, 2.2, 3.0))
    kitchen(c, t); chair(c, 210, 840, -1); chair(c, 520, 840, 1)
    man(c, 210, 830, t, dir=1, expr="worried", look_down=0.7, tilt=0.1, arms="both_head" if lt > 1.0 else "lap", s=0.92)
    woman(c, 520, 830, t, pose="sit", dir=-1, expr="worried", turn=-0.6, s=0.95)
    kitchen_table(c)
    spots = [(170, 330, 170, 90), (330, 250, 150, 80), (90, 470, 130, 76), (480, 330, 160, 86), (260, 160, 140, 74),
             (560, 200, 130, 70), (420, 450, 120, 64), (130, 190, 120, 64), (600, 470, 110, 60), (360, 380, 120, 66)]
    for k, (x, y, w, h) in enumerate(spots):
        scribble_bubble(c, x, y, w, h, pop(lt, 0.15 + k * 0.28, 0.22), k + 7, t)

def sc_space(c, t, T):          # he sits in a bubble, she gives space
    lt = t - T[0]; d = T[1] - T[0]
    cam(c, lerp(1.15, 1.25, seg(lt, 0, d)), 400, 700)
    living_room(c, t, 0.8); couch(c, 300, 840, 330)
    woman(c, 160 - 40 * seg(lt, 0.2, 1.2), 1000, t, dir=1, expr="smile" if lt > 0.8 else "neutral", turn=0.5, s=0.95)
    man(c, 490, 830, t, dir=-1, expr="neutral", look_down=0.5, arms="lap")
    space_bubble(c, 470, 690, 220 * pop(lt, 0.1, 0.4), 1.0, t)

def sc_together(c, t, T):       # bubble pops, they sit together, heart
    lt = t - T[0]; d = T[1] - T[0]
    cam(c, lerp(1.30, 1.42, seg(lt, 0, d)), 420, 680)
    living_room(c, t, 1.0); couch(c, 300, 840, 330)
    woman(c, 410, 830, t, pose="sit", dir=-1, expr="smile", turn=0.6, tilt=0.07, s=0.95)
    man(c, 510, 830, t, dir=1, expr="smile", turn=-0.6, tilt=-0.06, arms="lap")
    pb = 1 - seg(lt, 0, 0.25)
    if pb > 0: space_bubble(c, 500, 690, 220 * (1 + 0.3 * (1 - pb)), pb, t)
    heart(c, 465 + math.sin(lt * 2) * 6, 440 - 30 * seg(lt, 1.0, 2.2), 1.3 * pop(lt, 1.0, 0.35), 1)
    particles(c, t, 18, 0.3, 9)


# (first script line of the scene, scene function)
SCENES = [(0, sc_intro), (1, sc_ask), (3, sc_away), (4, sc_brain), (6, sc_pressure), (8, sc_space), (9, sc_together)]
