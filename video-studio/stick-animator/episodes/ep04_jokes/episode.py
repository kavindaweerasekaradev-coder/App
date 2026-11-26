"""Episode 4: Why does he make jokes when things get serious?"""
import math
from studio import *

VOICE = "am_michael"
LINES = [
    {"say": "Why does he joke, when things get serious?"},
    {"say": "You want to talk about something real.", "gap": 0.3},
    {"say": "And he says something funny.", "gap": 0.4},
    {"say": "It feels like he doesn't care.", "gap": 0.45},
    {"say": "But for some people,", "gap": 0.1},
    {"say": "humour is armour.", "gap": 0.3},
    {"say": "A joke keeps hard feelings at a safe distance.", "gap": 0.45},
    {"say": "Behind the smile, he's often nervous,", "gap": 0.15},
    {"say": "or scared of saying the wrong thing.", "gap": 0.45},
    {"say": "So don't push. Make it safe.", "gap": 0.4},
    {"say": "Once he feels safe,", "gap": 0.1},
    {"say": "the mask comes off.", "gap": 0.7},
]
HIGHLIGHT = ["JOKE", "SERIOUS", "REAL", "FUNNY", "CARE", "HUMOUR", "ARMOUR", "DISTANCE", "NERVOUS", "WRONG", "SAFE", "MASK", "OFF"]

def table_scene(c, t, she="neutral", he="smile", he_arms="lap", mask_on=0.0, mask_rot=0.0):
    kitchen(c, t); chair(c, 210, 840, -1); chair(c, 520, 840, 1)
    hx, hy, hr = man(c, 210, 830, t, dir=1, expr=he, turn=0.5, arms=he_arms, s=0.92)
    woman(c, 520, 830, t, pose="sit", dir=-1, expr=she, turn=-0.6, s=0.95)
    kitchen_table(c)
    if mask_on > 0: mask(c, hx + 14, hy + 2, hr * 1.06, mask_on, mask_rot)
    return hx, hy, hr


def sc_intro(c, t, T):          # she is serious, he is grinning; HA HA tags
    lt = t - T[0]
    cam(c, lerp(1.0, 1.08, seg(lt, 0, T[1] - T[0])), 360, 640)
    table_scene(c, t, she="worried", he="smile")
    for k, (x, y, r) in enumerate([(150, 470, -0.2), (270, 420, 0.15), (200, 360, -0.05)]):
        tag(c, x, y, "HA!" if k != 2 else "HA HA", 30, pop(lt, 0.3 + k * 0.25, 0.22), fill=(1, 0.93, 0.6), rot=r)


def sc_talk(c, t, T):           # "We need to talk." / "Is this about the pizza?"
    lt = t - T[0]; s2 = ls(2)
    cam(c, lerp(1.08, 1.14, seg(lt, 0, T[1] - T[0])), 370, 640)
    table_scene(c, t, she="worried" if t < s2 else "sad", he="neutral" if t < s2 else "smile")
    bubble(c, 520, 480, "We need to talk.", -10, 80, pop(lt, 0.05) * (1 - seg(t, s2 - 0.1, s2)))
    bubble(c, 300, 450, "Is this about the pizza?", -40, 90, pop(t, s2 + 0.1), size=28)
    if t > s2 + 0.8:
        tag(c, 160, 350, "HA HA!", 26, pop(t, s2 + 0.8, 0.22), fill=(1, 0.93, 0.6), rot=-0.15)


def sc_hurt(c, t, T):           # she feels he doesn't care
    lt = t - T[0]
    cam(c, lerp(1.35, 1.45, seg(lt, 0, T[1] - T[0])), 470, 620)
    table_scene(c, t, she="sad", he="smile")
    c.set_source_rgba(0, 0, 0, 0.2 * seg(lt, 0, 1)); c.paint()
    storm_cloud(c, 520, 380, 0.7, t, seg(lt, 0.2, 0.6))
    broken_heart(c, 600, 520, 0.9, pop(lt, 0.8, 0.3))


def sc_armour(c, t, T):         # he holds a smiling mask; dark feelings bounce off the shield
    lt = t - T[0]; s5 = ls(5); s6 = ls(6)
    c.set_source_rgb(0.42, 0.42, 0.45); c.paint()
    cam(c, lerp(1.0, 1.08, seg(lt, 0, T[1] - T[0])), 360, 640)
    glow(c, 360, 560, 420, (1, 0.9, 0.6), 0.15)
    hx, hy, hr = man(c, 360, 1060, t, pose="stand", dir=1, expr="worried", turn=0, arms="mask" if t > s5 - 0.2 else "down")
    if t > s5 - 0.2:
        mask(c, hx + 16, hy + 2, hr * 1.08, pop(t, s5 - 0.2, 0.3))
        shield_arc(c, hx, hy + 120, 255, seg(t, s5 + 0.3, s5 + 0.8))
    labels = ["FEAR", "WORRY", "HURT", "STRESS"]
    starts = [(-60, 150), (W + 60, 200), (220, -140), (W + 60, 560)]
    for k, (lab, (sx, sy)) in enumerate(zip(labels, starts)):
        t0 = s6 + k * 0.35
        if t < t0: continue
        p = seg(t, t0, t0 + 0.7)
        # fly toward him, stop at the shield edge, bounce back a little
        ang = math.atan2(sy - (hy + 120), sx - hx); edge = 300
        ex, ey = hx + math.cos(ang) * edge, hy + 120 + math.sin(ang) * edge
        bx = lerp(sx, ex, p) + math.cos(ang) * 40 * seg(t, t0 + 0.7, t0 + 1.0)
        by = lerp(sy, ey, p) + math.sin(ang) * 40 * seg(t, t0 + 0.7, t0 + 1.0)
        blob(c, bx, by, 72, lab, t, k + 3)


def sc_behind(c, t, T):         # mask lowered: worried face, sweat, inner doubts
    lt = t - T[0]; s8 = ls(8)
    c.set_source_rgb(0.42, 0.42, 0.45); c.paint()
    cam(c, lerp(1.05, 1.12, seg(lt, 0, T[1] - T[0])), 360, 640)
    glow(c, 360, 560, 420, (1, 0.9, 0.6), 0.12)
    hx, hy, hr = man(c, 360, 1060, t, pose="stand", dir=1, expr="worried", turn=-0.1, arms="mask")
    mask(c, hx + 16 + 80 * seg(lt, 0.1, 0.7), hy + 30 + 110 * seg(lt, 0.1, 0.7), hr * 1.08, 1, 0.5 * seg(lt, 0.1, 0.7))
    sweat(c, hx - hr * 0.8, hy - hr * 0.3 + 12 * math.sin(t * 3), pop(lt, 0.6, 0.25))
    tag(c, 330, 300, "WHAT IF I SAY IT WRONG?", 24, pop(t, s8, 0.25), rot=-0.05)
    tag(c, 390, 200, "WHAT IF IT GETS WORSE?", 24, pop(t, s8 + 0.7, 0.25), rot=0.05)


def sc_safe(c, t, T):           # she reaches out gently; a warm safe bubble around both
    lt = t - T[0]
    cam(c, lerp(1.05, 1.12, seg(lt, 0, T[1] - T[0])), 370, 640)
    kitchen(c, t); chair(c, 210, 840, -1); chair(c, 520, 840, 1)
    hx, hy, hr = man(c, 210, 830, t, dir=1, expr="neutral", turn=0.5, arms="mask", s=0.92)
    mask(c, hx + 14, hy + 2, hr * 1.06, 1, 0)
    woman(c, 520, 830, t, pose="sit", dir=-1, expr="smile", turn=-0.6, s=0.95, arms="hold")
    kitchen_table(c)
    glow(c, 365, 640, 420, (1, 0.85, 0.55), 0.35 * seg(lt, 0.6, 1.4))
    space_bubble(c, 365, 650, 330 * pop(lt, 0.8, 0.45), 0.9, t)


def sc_off(c, t, T):            # the mask comes off; real smiles, hearts
    lt = t - T[0]; s11 = ls(11)
    cam(c, lerp(1.12, 1.22, seg(lt, 0, T[1] - T[0])), 370, 640)
    kitchen(c, t); chair(c, 210, 840, -1); chair(c, 520, 840, 1)
    off = seg(t, s11, s11 + 0.6)
    hx, hy, hr = man(c, 210, 830, t, dir=1, expr="smile" if off > 0.5 else "neutral", turn=0.5, arms="mask" if off < 0.8 else "lap", s=0.92)
    woman(c, 520, 830, t, pose="sit", dir=-1, expr="smile", turn=-0.6, s=0.95)
    kitchen_table(c)
    glow(c, 365, 640, 420, (1, 0.85, 0.55), 0.35)
    mask(c, lerp(hx + 14, 110, off), lerp(hy + 2, 1010, off), hr * lerp(1.06, 0.55, off), 1, -1.4 * off)
    if off >= 1:
        heart(c, 365, 470 - 30 * seg(t, s11 + 0.6, s11 + 1.8), 1.2 * pop(t, s11 + 0.6, 0.35), 1)
        bubble(c, 210, 430, "I was scared.", 0, 70, pop(t, s11 + 0.3), size=26)


SCENES = [(0, sc_intro), (1, sc_talk), (3, sc_hurt), (4, sc_armour), (7, sc_behind), (9, sc_safe), (10, sc_off)]
