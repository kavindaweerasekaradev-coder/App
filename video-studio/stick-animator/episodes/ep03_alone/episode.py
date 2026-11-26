"""Episode 3: Why does he need time alone?"""
import math
from studio import *

VOICE = "am_michael"
LINES = [
    {"say": "Why does he need time alone?"},
    {"say": "After a long day, he goes quiet,", "gap": 0.15},
    {"say": "and disappears into his own space.", "gap": 0.4},
    {"say": "It can feel like he's shutting you out.", "gap": 0.45},
    {"say": "But for some people,", "gap": 0.1},
    {"say": "being around others drains their battery.", "gap": 0.4},
    {"say": "And being alone, is how they recharge.", "gap": 0.45},
    {"say": "Ten minutes of quiet,", "gap": 0.2},
    {"say": "and he's back. Fully charged.", "gap": 0.4},
    {"say": "It's not about you.", "gap": 0.15},
    {"say": "It's about energy.", "gap": 0.7},
]
HIGHLIGHT = ["ALONE", "QUIET", "SPACE", "SHUTTING", "OUT", "DRAINS", "BATTERY", "RECHARGE", "CHARGED", "YOU", "ENERGY"]


def sc_home(c, t, T):           # he walks in, battery almost empty; she waits on the couch
    lt = t - T[0]; d = T[1] - T[0]
    cam(c, lerp(1.0, 1.08, seg(lt, 0, d)), 360, 700)
    living_room(c, t, 0.8); door(c, 470, 880, open_amt=1 - seg(lt, 0.6, 1.2))
    couch(c, 60, 840, 300)
    woman(c, 160, 830, t, pose="sit", dir=1, expr="smile", turn=0.7)
    mx = lerp(560, 450, seg(lt, 0, 1.4))
    hx, hy, hr = man(c, mx, 1060, t, pose="stand", dir=-1, expr="sad", look_down=0.5, tilt=0.06, arms="down", walk=lt < 1.4)
    battery(c, hx, hy - 125, 0.12, t, sc=pop(lt, 0.3))


def sc_retreat(c, t, T):        # he goes into his room and closes the door
    lt = t - T[0]; s2 = ls(2) - T[0]
    cam(c, lerp(1.0, 1.1, seg(lt, 0, T[1] - T[0])), 380, 720)
    living_room(c, t, 0.6)
    op = seg(lt, s2, s2 + 0.3) * (1 - seg(lt, s2 + 1.2, s2 + 1.7))
    door(c, 470, 880, open_amt=op)
    couch(c, 60, 840, 300)
    woman(c, 160, 830, t, pose="sit", dir=1, expr="neutral", turn=0.7)
    if lt < s2 + 1.3:
        mx = lerp(420, 545, seg(lt, s2 * 0.2, s2 + 1.0))
        al = 1 - seg(lt, s2 + 0.9, s2 + 1.3)
        c.push_group()
        man(c, mx, 1000 - 60 * seg(lt, s2, s2 + 1.0), t, pose="stand", dir=1, expr="neutral", look_down=0.4, arms="down",
            walk=True, s=lerp(1.0, 0.8, seg(lt, s2, s2 + 1.0)))
        c.pop_group_to_source(); c.paint_with_alpha(al)
    else:
        tag(c, 545, 650, "DO NOT DISTURB", 18, pop(lt, s2 + 1.4, 0.25), fill=(1, 0.93, 0.6), rot=0.05)


def sc_shut_out(c, t, T):       # she stares at the closed door
    lt = t - T[0]
    cam(c, lerp(1.08, 1.16, seg(lt, 0, T[1] - T[0])), 370, 720)
    living_room(c, t, 0.5); door(c, 470, 880, 0)
    tag(c, 545, 650, "DO NOT DISTURB", 18, 1, fill=(1, 0.93, 0.6), rot=0.05)
    couch(c, 60, 840, 300)
    woman(c, 160, 830, t, pose="sit", dir=1, expr="sad", turn=0.8, look_down=0.1)
    c.set_source_rgba(0, 0, 0, 0.2 * seg(lt, 0, 1.2)); c.paint()
    p = seg(lt, 0.5, 1.6)
    if p > 0:
        pts = [(300, 880), (330, 930), (310, 990), (350, 1050), (330, 1120), (370, 1210)]
        line(c, pts[:max(2, int(len(pts) * p))], 5, (0.1, 0.1, 0.1), 0.8)


def sc_drain(c, t, T):          # crowd + chatter drains him
    lt = t - T[0]; s5 = ls(5)
    cam(c, lerp(1.0, 1.1, seg(lt, 0, T[1] - T[0])), 360, 700, dx=math.sin(t * 28) * 2 * seg(t, s5 + 1.2, s5 + 2.0))
    office(c, t, 1)
    crowd = [(90, 1000, "woman", 1, 0.8), (210, 1030, "man", 1, 0.78), (520, 1030, "man", -1, 0.78), (640, 1000, "woman", -1, 0.8)]
    for k, (x, y, kind, dr, s) in enumerate(crowd):
        (woman if kind == "woman" else man)(c, x, y, t + k, pose="stand", dir=dr, expr="smile", turn=0.6 * dr, s=s,
                                            arms="wave" if (kind == "man" and k == 1) else "down")
    hx, hy, hr = man(c, 365, 1080, t, pose="stand", dir=1, expr="worried" if t > s5 else "neutral", turn=0, arms="down", s=0.95)
    for k, (bx, by, w) in enumerate([(120, 560, 120), (250, 470, 130), (480, 470, 120), (610, 560, 110), (365, 360, 130), (130, 380, 100), (600, 380, 110)]):
        scribble_bubble(c, bx, by, w, 64, pop(lt, 0.2 + k * 0.25, 0.22), k + 20, t)
    level = lerp(0.85, 0.06, seg(t, s5, le(5)))
    battery(c, hx, hy - 120, level, t)


def sc_recharge(c, t, T):       # alone in his armchair with tea and a lamp, charging
    lt = t - T[0]
    cam(c, lerp(1.0, 1.1, seg(lt, 0, T[1] - T[0])), 360, 680)
    study(c, t, 1.0)
    armchair(c, 330, 860)
    hx, hy, hr = man(c, 300, 850, t, dir=1, expr="smile" if lt > 1.0 else "neutral", look_down=0.2, turn=0.4, arms="lap")
    rrect(c, 520, 880, 150, 22, 6); fill_stroke(c, (0.30, 0.28, 0.27), 4)                # side table
    c.rectangle(585, 902, 18, 140); fill_stroke(c, (0.26, 0.23, 0.22), 3)
    mug(c, 590, 880, t)
    level = lerp(0.06, 0.55, seg(t, T[0], T[1]))
    battery(c, hx, hy - 130, level, t, charging=True)
    particles(c, t, 30, 0.25, 6)


def sc_full(c, t, T):           # clock ticks, battery hits 100%, he stands up smiling
    lt = t - T[0]; s8 = ls(8)
    cam(c, lerp(1.0, 1.06, seg(lt, 0, T[1] - T[0])), 360, 680)
    study(c, t, 1.0)
    wall_clock(c, 180, 300, 62, t * 6)
    armchair(c, 330, 860)
    if t < s8:
        hx, hy, hr = man(c, 300, 850, t, dir=1, expr="smile", turn=0.4, arms="lap")
    else:
        hx, hy, hr = man(c, 330, 1060, t, pose="stand", dir=1, expr="smile", turn=0.3, arms="wave" if t > s8 + 0.6 else "down")
    level = lerp(0.55, 1.0, seg(t, T[0], s8 + 0.4))
    battery(c, hx, hy - 130, level, t, charging=level < 1.0, sc=1 + 0.15 * (pop(t, s8 + 0.4, 0.3) - 1 if t > s8 + 0.4 else 0))
    if t > s8 + 0.4:
        for k in range(8):
            a = k * TAU / 8; r = 90 + 60 * seg(t, s8 + 0.4, s8 + 1.0)
            line(c, [(hx + math.cos(a) * r, hy - 130 + math.sin(a) * r * 0.6), (hx + math.cos(a) * (r + 20), hy - 130 + math.sin(a) * (r + 20) * 0.6)],
                 5, (1, 0.85, 0.3), 1 - seg(t, s8 + 0.9, s8 + 1.4))


def sc_together(c, t, T):       # back on the couch with her, both happy
    lt = t - T[0]; s10 = ls(10)
    cam(c, lerp(1.25, 1.35, seg(lt, 0, T[1] - T[0])), 300, 700)
    living_room(c, t, 1.0); door(c, 470, 880, 1)
    couch(c, 60, 840, 300)
    woman(c, 140, 830, t, pose="sit", dir=-1, expr="smile", turn=0.6, tilt=0.06, s=0.95)
    hx, hy, hr = man(c, 245, 830, t, dir=1, expr="smile", turn=-0.6, tilt=-0.05, arms="lap")
    battery(c, hx + 20, hy - 130, 1.0, t, sc=0.8)
    heart(c, 190, 470 - 30 * seg(t, s10, s10 + 1.2), 1.3 * pop(t, s10, 0.35), 1)
    particles(c, t, 18, 0.3, 9)


SCENES = [(0, sc_home), (1, sc_retreat), (3, sc_shut_out), (4, sc_drain), (6, sc_recharge), (7, sc_full), (9, sc_together)]
