"""The Path to Awakening, Episode 1: Queen Maha Maya's Dream.

Told according to the traditional account (Jataka Nidanakatha). Respectful silhouette style:
people are calm silhouettes; sacred moments are shown with light, the white elephant and the lotus."""
import math
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


def sc_kingdom(c, t, T):        # sunset over Kapilavastu
    lt = t - T[0]
    cam(c, lerp(1.12, 1.0, seg(lt, 0, T[1] - T[0])), 360, 660)
    sky(c, SUNSET); sun(c, 470, 720, 60)
    mountains(c, 760, 260, (0.45, 0.22, 0.35), seed=3, a=0.8)
    mountains(c, 800, 160, (0.30, 0.14, 0.25), seed=8)
    palace(c, 360, 860, 0.95, lit=seg(lt, 1.0, 3.0))
    reflection(c, 860, (0.55, 0.28, 0.30), (0.12, 0.06, 0.10), t, streak_x=470, streak_col=(1, 0.8, 0.5))
    for k, (x, h) in enumerate([(40, 380), (120, 300), (620, 360), (690, 280)]):
        palm(c, x, 880, h, t=t, seed=k)
    ground(c, 900)
    birds(c, t, 7, 380, speed=35)
    title_card(c, t, 0.2, 4.0, "THE PATH TO AWAKENING", "Episode 1", "The Queen's Dream")


def sc_royals(c, t, T):         # the king and queen on the terrace, lamps glowing
    lt = t - T[0]
    cam(c, lerp(1.0, 1.08, seg(lt, 0, T[1] - T[0])), 360, 700)
    sky(c, SUNSET); sun(c, 520, 860, 50, 0.9)
    mountains(c, 860, 200, (0.40, 0.18, 0.30), seed=5, a=0.8)
    c.set_source_rgb(*SIL); c.rectangle(-300, 900, W + 600, 900); c.fill()                 # terrace
    for px in (30, 690):                                                                   # pillars + arch
        c.rectangle(px - 24, 260, 48, 660); c.fill()
    c.move_to(6, 280); c.curve_to(150, 120, 570, 120, 714, 280); c.line_to(714, 230); c.curve_to(570, 60, 150, 60, 6, 230); c.close_path(); c.fill()
    for k in range(12): c.rectangle(60 + k * 52, 880, 14, 40); c.fill()                     # balustrade
    c.rectangle(40, 870, 640, 14); c.fill()
    for lx in (150, 570):                                                                  # oil lamps
        c.rectangle(lx - 4, 820, 8, 60); c.fill()
        fl = 1 + 0.15 * math.sin(t * 9 + lx)
        glow(c, lx, 812, 70 * fl, (1, 0.7, 0.3), 0.6); c.arc(lx, 812, 7 * fl, 0, TAU); c.set_source_rgb(1, 0.9, 0.6); c.fill()
        c.set_source_rgb(*SIL)
    figure(c, 300, 905, 330, "king", dir=1)
    figure(c, 420, 905, 300, "queen", dir=-1)
    birds(c, t, 4, 420, speed=30)


def sc_night(c, t, T):          # full moon; the queen asleep in her chamber
    lt = t - T[0]
    cam(c, lerp(1.0, 1.1, seg(lt, 0, T[1] - T[0])), 360, 640)
    sky(c, NIGHT); stars(c, t, 120)
    moon(c, 360, 420, 95)
    c.set_source_rgb(*SIL)                                                                 # chamber wall with arched window
    c.rectangle(-300, -300, W + 600, 140 + 300); c.fill()
    c.rectangle(-300, -300, 80 + 300, 2000); c.fill(); c.rectangle(640, -300, 400, 2000); c.fill()
    c.move_to(80, 140); c.line_to(80, 300); c.curve_to(150, 150, 570, 150, 640, 300); c.line_to(640, 140); c.close_path(); c.fill()
    g = cairo.LinearGradient(0, 860, 0, 1300); g.add_color_stop_rgb(0, 0.16, 0.18, 0.30); g.add_color_stop_rgb(1, 0.04, 0.04, 0.08)
    c.rectangle(-300, 860, W + 600, 900); c.set_source(g); c.fill()                     # moonlit floor
    c.move_to(150, 860); c.line_to(570, 860); c.line_to(680, 1200); c.line_to(40, 1200); c.close_path()
    c.set_source_rgba(0.7, 0.75, 0.95, 0.12); c.fill()
    bed(c, 360, 850, 380)
    sleeping_queen(c, 360, 850, 380)
    glow(c, 360, 760, 260, (0.8, 0.85, 1.0), 0.25 * seg(lt, 1.0, 3.0))
    for k in range(5):                                                                     # dreamy sparkles
        p = (t * 0.25 + k / 5) % 1
        c.arc(260 + k * 50, 760 - p * 300, 3, 0, TAU); c.set_source_rgba(1, 1, 0.9, (1 - p) * seg(lt, 1.2, 2.0)); c.fill()


def sc_flight(c, t, T):         # four guardians carry her bed up to the Himalayas
    lt = t - T[0]; d = T[1] - T[0]; rise = seg(lt, 0, d)
    cam(c, 1.0, 360, 640, dy=0)
    sky(c, HEAVEN); stars(c, t, 60, a=0.7, ymax=500); moon(c, 560, 250, 55)
    c.save(); c.translate(0, 380 * rise)                                                   # world falls away as they rise
    mountains(c, 1050, 520, (0.55, 0.55, 0.70), seed=11, snow=(0.95, 0.96, 1.0))
    mountains(c, 1180, 380, (0.30, 0.30, 0.45), seed=14, snow=(0.85, 0.87, 0.95))
    c.restore()
    for k in range(5):
        cloud(c, ((k * 190 + t * 25) % (W + 300)) - 150, 900 - k * 40 + 200 * rise, 1.2, a=0.55)
    by = lerp(980, 640, rise) + math.sin(t * 1.6) * 10
    glow(c, 360, by - 60, 330, (1, 0.9, 0.7), 0.4)
    gold = (0.22, 0.16, 0.20)
    bed(c, 360, by, 300, col=gold, canopy=False)
    sleeping_queen(c, 360, by, 300, col=gold)
    for k, gx in enumerate((120, 190, 530, 600)):
        figure(c, gx, by + 90 + (8 * math.sin(t * 2 + k)), 200, "guardian", col=(0.16, 0.12, 0.18), dir=1 if gx < 360 else -1, aura=0.6)


def sc_lake(c, t, T):           # the sacred lake; the white elephant appears with a lotus
    lt = t - T[0]; s6 = ls(6)
    cam(c, lerp(1.0, 1.08, seg(lt, 0, T[1] - T[0])), 360, 680)
    sky(c, NIGHT); stars(c, t, 90, a=0.9, ymax=600); moon(c, 520, 260, 70)
    mountains(c, 700, 360, (0.50, 0.52, 0.68), seed=21, snow=(0.95, 0.96, 1.0))
    mountains(c, 760, 200, (0.22, 0.24, 0.36), seed=24)
    reflection(c, 760, (0.25, 0.30, 0.50), (0.05, 0.06, 0.14), t, streak_x=520, streak_col=(0.85, 0.9, 1.0))
    for k in range(6):                                                                    # floating lotuses on the lake
        lotus(c, 60 + k * 125, 1080 + (k % 2) * 60, 0.35, 0.8, a=0.85)
    for k in range(4): cloud(c, ((k * 230 + t * 15) % (W + 300)) - 150, 760, 0.9, a=0.3)  # mist
    a = seg(lt, 0.4, 1.6)
    ex = lerp(860, 300, seg(lt, 0.3, 2.6))
    white_elephant(c, ex, 760, 0.95, t, a=a, dir=1, lotus_on=True)
    if t > s6: glow(c, ex + 203, 690, 120, (1, 0.9, 0.7), 0.4 * seg(t, s6, s6 + 0.6))


def sc_circle(c, t, T):         # it circles her three times, then becomes light entering her side
    lt = t - T[0]; s8 = ls(8)
    cam(c, lerp(1.0, 1.06, seg(lt, 0, T[1] - T[0])), 360, 680)
    sky(c, HEAVEN); stars(c, t, 60, a=0.6, ymax=500)
    for k in range(4): cloud(c, ((k * 230 + t * 15) % (W + 300)) - 150, 960, 1.4, a=0.5)
    by = 860
    gold = (0.22, 0.16, 0.20)
    glow(c, 360, by - 80, 360, (1, 0.9, 0.7), 0.35 + 0.4 * seg(t, s8, s8 + 0.8))
    bed(c, 360, by, 320, col=gold, canopy=False)
    sleeping_queen(c, 360, by, 320, col=gold)
    orbit_end = s8 + 0.3
    if t < orbit_end:
        ang = seg(t, T[0], orbit_end) * TAU * 3 + math.pi / 2
        depth = math.sin(ang)                                                               # +1 = in front
        ex = 360 + math.cos(ang) * 250; ey = by - 60 + depth * 40
        sc = 0.45 + 0.12 * depth
        white_elephant(c, ex, ey, sc, t, a=1.0 if depth > -0.2 else 0.65, dir=1 if math.cos(ang + 0.1) < math.cos(ang) else -1)
    else:
        p = seg(t, orbit_end, orbit_end + 0.8)                                             # becomes light, enters her side
        x = lerp(560, 400, p); y = lerp(760, 790, p)
        glow(c, x, y, lerp(140, 50, p), (1, 0.96, 0.85), 0.9 * (1 - seg(t, orbit_end + 0.8, orbit_end + 1.3)))
        light_rays(c, 380, 800, 520, t, seg(t, orbit_end + 0.6, orbit_end + 1.2))
        petals(c, t, orbit_end + 0.6, 26)


def sc_wise_men(c, t, T):       # morning: eight wise men before the king and queen
    lt = t - T[0]; s10 = ls(10)
    cam(c, lerp(1.0, 1.08, seg(lt, 0, T[1] - T[0])), 360, 700)
    sky(c, DAWN); sun(c, 360, 640, 70)
    light_rays(c, 360, 640, 900, t, 0.8)
    c.set_source_rgb(*SIL)
    for px in (40, 680): c.rectangle(px - 26, 200, 52, 760); c.fill()
    c.move_to(14, 220); c.curve_to(150, 60, 570, 60, 706, 220); c.line_to(706, 170); c.curve_to(570, 0, 150, 0, 14, 170); c.close_path(); c.fill()
    g = cairo.LinearGradient(0, 950, 0, 1300); g.add_color_stop_rgb(0, 0.62, 0.42, 0.30); g.add_color_stop_rgb(1, 0.30, 0.18, 0.14)
    c.rectangle(-300, 950, W + 600, 900); c.set_source(g); c.fill()                     # sunlit stone floor
    c.move_to(260, 950); c.line_to(460, 950); c.line_to(640, 1300); c.line_to(80, 1300); c.close_path()
    c.set_source_rgba(1, 0.9, 0.7, 0.18); c.fill()
    c.set_source_rgb(*SIL); c.rectangle(-300, 940, W + 600, 14); c.fill()
    figure(c, 300, 960, 300, "king", dir=1)
    figure(c, 420, 960, 275, "queen", dir=-1)
    for k in range(8):
        x = 70 + k * 83; y = 1150 + (k % 2) * 40
        seated_figure(c, x, y, 120 + (k % 2) * 10)
    if t > s10:
        lotus(c, 360, 520, 0.9 * pop(t, s10 + 0.1, 0.4), 1.0, glow_a=0.6)


def sc_two_paths(c, t, T):      # two destinies: a crown of a world ruler, or the wheel of truth
    lt = t - T[0]; s12 = ls(12)
    sky(c, [(0, (0.10, 0.08, 0.16)), (0.6, (0.20, 0.14, 0.24)), (1, (0.30, 0.20, 0.25))]); stars(c, t, 70, a=0.6, ymax=1200)
    cam(c, 1.0, 360, 640)
    line(c, [(360, 260), (360, 1000)], 2, (1, 0.85, 0.5), 0.5 * seg(lt, 0.2, 0.8))
    crown_symbol(c, 190, 470, 1.0 * pop(lt, 0.2, 0.4), a=1 - 0.55 * seg(t, s12, s12 + 0.6))
    dharma_wheel(c, 530, 470, 0.95 * pop(t, s12 + 0.2, 0.45), t)
    if t > s12 + 0.2:
        light_rays(c, 530, 470, 700, t, seg(t, s12 + 0.3, s12 + 1.2))
    lotus(c, 530, 700, 0.5 * pop(t, s12 + 0.8, 0.4), 1.0, glow_a=0.4)


def sc_question(c, t, T):       # dawn; the queen looks out; to be continued
    lt = t - T[0]
    cam(c, lerp(1.08, 1.0, seg(lt, 0, T[1] - T[0])), 360, 680)
    sky(c, DAWN); sun(c, 470, 820, 60)
    mountains(c, 830, 220, (0.55, 0.42, 0.55), seed=31, a=0.8)
    mountains(c, 880, 140, (0.35, 0.25, 0.35), seed=33)
    ground(c, 920)
    palm(c, 80, 930, 380, t=t, seed=3); palm(c, 650, 930, 330, t=t, seed=6)
    figure(c, 300, 935, 330, "queen", dir=1)
    lotus(c, 470, 640, 0.6, 0.35 + 0.65 * seg(lt, 0.5, 2.5), glow_a=0.7)
    birds(c, t, 5, 450, speed=30)
    title_card(c, t, T[0] + 1.2, T[1] + 1, "NEXT EPISODE", "Birth in Lumbini", "Follow for Part 2")


SCENES = [(0, sc_kingdom), (1, sc_royals), (2, sc_night), (3, sc_flight), (5, sc_lake), (7, sc_circle),
          (9, sc_wise_men), (11, sc_two_paths), (13, sc_question)]
