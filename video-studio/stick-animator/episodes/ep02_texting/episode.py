"""Episode 2: Why does he stop texting back?"""
import math
from studio import *

VOICE = "am_michael"
LINES = [
    {"say": "Why does he stop texting back?"},
    {"say": "He used to reply in seconds.", "gap": 0.3},
    {"say": "Now, your message just sits there.", "gap": 0.45},
    {"say": "And your mind starts writing stories.", "gap": 0.2},
    {"say": "He's bored. He's losing interest.", "gap": 0.45},
    {"say": "But look at his day.", "gap": 0.2},
    {"say": "Work. Deadlines. A hundred things at once.", "gap": 0.35},
    {"say": "When his head is full,", "gap": 0.1},
    {"say": "his phone is the last thing he checks.", "gap": 0.45},
    {"say": "No reply doesn't always mean no love.", "gap": 0.3},
    {"say": "Sometimes, it just means, not right now.", "gap": 0.7},
]
HIGHLIGHT = ["TEXTING", "SECONDS", "SITS", "STORIES", "BORED", "INTEREST", "DAY", "DEADLINES", "FULL", "LAST", "LOVE", "NOW"]


def sc_waiting(c, t, T):        # she sits on the couch staring at her phone
    lt = t - T[0]; d = T[1] - T[0]
    cam(c, lerp(1.05, 1.22, seg(lt, 0, d)), 380, 700)
    living_room(c, t, 0.7); couch(c, 300, 840, 330); coffee_table(c, 250, 960, 260)
    woman(c, 420, 830, t, pose="sit", dir=-1, expr="worried", turn=-0.3, look_down=0.9, arms="phone")
    c.set_source_rgba(0, 0, 0, 0.12); c.paint()


def sc_fast_chat(c, t, T):      # flashback: replies arrive instantly
    s = ls(1)
    c.set_source_rgb(0.80, 0.80, 0.82); c.paint()
    cam(c, lerp(1.0, 1.04, seg(t - T[0], 0, T[1] - T[0])), 360, 640)
    msgs = [
        {"side": "me", "text": "Morning!", "t": s - 0.05},
        {"side": "them", "text": "Morning you", "t": s + 0.25, "heart": True},
        {"side": "me", "text": "Lunch later?", "t": s + 0.6},
        {"side": "them", "text": "Yes!!", "t": s + 0.85},
        {"side": "me", "text": "Miss you", "t": s + 1.2},
        {"side": "them", "text": "Miss you more", "t": s + 1.4, "heart": True},
    ]
    phone_screen(c, t, msgs, clock="8:02", status="Seen just now")


def sc_slow_chat(c, t, T):      # now: her message just sits there
    s = ls(2); lt = t - T[0]
    c.set_source_rgb(0.62, 0.62, 0.65); c.paint()
    cam(c, lerp(1.0, 1.12, seg(lt, 0, T[1] - T[0])), 360, 560)
    clocks = ["2:14", "3:30", "4:52", "6:07"]
    clock = clocks[min(3, int(max(0, lt) / 0.6))]
    msgs = [{"side": "them", "text": "Morning you", "t": -1, "heart": True},
            {"side": "me", "text": "Hey, are you okay?", "t": s}]
    phone_screen(c, t, msgs, clock=clock, status="Delivered", typing=(s + 0.7, s + 1.4))


def sc_stories(c, t, T):        # her imagination fills with worst cases
    lt = t - T[0]; s4 = ls(4)
    cam(c, lerp(1.0, 1.08, seg(lt, 0, T[1] - T[0])), 380, 680)
    living_room(c, t, 0.4); couch(c, 300, 840, 330)
    woman(c, 420, 830, t, pose="sit", dir=-1, expr="sad" if t > s4 else "worried", turn=-0.2, look_down=0.3, arms="phone")
    c.set_source_rgba(0, 0, 0, 0.18 * seg(lt, 0, 1)); c.paint()
    for k, (ox, oy, r) in enumerate([(-20, -95, 8), (-40, -125, 12), (-55, -165, 16)]):
        if lt > 0.15 + k * 0.1:
            c.arc(400 + ox, 600 + oy, r, 0, TAU); fill_stroke(c, (1, 1, 1), 3)
    thought_cloud(c, 330, 370, 380, 300, pop(lt, 0.4, 0.35))
    storm_cloud(c, 570, 250, 0.75, t, seg(lt, 0.8, 1.2))
    tag(c, 255, 330, "BORED?", 30, pop(t, s4, 0.25), rot=-0.08)
    tag(c, 345, 420, "LOSING INTEREST?", 26, pop(t, s4 + 0.9, 0.25), rot=0.05)
    broken_heart(c, 420, 300, 1.1, pop(t, s4 + 1.5, 0.3))
    if lt < ls(4) - T[0]:
        tag(c, 330, 370, "...", 40, pop(lt, 0.6, 0.25), fill=(0.95, 0.95, 0.96))


def sc_office(c, t, T):         # his day: work piles up
    lt = t - T[0]; s6 = ls(6)
    cam(c, lerp(1.0, 1.14, seg(lt, 0, T[1] - T[0])), 360, 640, dx=math.sin(t * 25) * 2 * seg(t, s6 + 1.2, s6 + 1.8))
    office(c, t, clock_speed=4 + 30 * seg(t, s6, s6 + 2.5))
    man(c, 330, 780, t, dir=1, expr="worried" if t > s6 else "neutral", turn=0.4, look_down=0.4,
        arms="write" if t < s6 + 1.4 else "both_head")
    rrect(c, 40, 790, 640, 34, 6); fill_stroke(c, (0.32, 0.29, 0.27), 4)
    for lx in (60, 640): c.rectangle(lx, 824, 20, 220); fill_stroke(c, (0.26, 0.23, 0.22), 3)
    laptop(c, 440, 790)
    n = int(3 + 18 * seg(t, s6, s6 + 2.6)); paper_stack(c, 130, 790, n, 1); paper_stack(c, 600, 790, max(2, n - 6), 2)
    for k in range(6):
        ts = s6 + k * 0.35; flying_paper(c, -60 if k % 2 else W + 60, 200 + k * 40, 130 if k % 2 else 600, 700, seg(t, ts, ts + 0.5) if t < ts + 0.5 else 0, k)
    # phone face down, buzzing, ignored
    bz = math.sin(t * 60) * 2 if int(t * 2) % 3 == 0 else 0
    c.save(); c.translate(250 + bz, 784); rrect(c, -34, -10, 68, 12, 4); fill_stroke(c, (0.12, 0.12, 0.13), 3); c.restore()
    if bz:
        for sd in (-1, 1): line(c, [(250 + sd * 46, 772), (250 + sd * 56, 764)], 3, INK, 0.7)
    for k, word in enumerate(["EMAILS", "MEETING", "REPORT"]):
        tag(c, 170 + k * 190, 160 + (k % 2) * 60, word, 24, pop(t, s6 + 0.3 + k * 0.5, 0.25), fill=(1, 0.93, 0.6), rot=(k - 1) * 0.07)


def sc_full_head(c, t, T):      # his head is full; texting her is last on the list
    lt = t - T[0]; s8 = ls(8)
    cam(c, lerp(1.0, 1.06, seg(lt, 0, T[1] - T[0])), 360, 640)
    office(c, t, 2)
    rrect(c, 120, 846, 170, 26, 8); fill_stroke(c, (0.25, 0.25, 0.27), 4)          # office chair
    line(c, [(205, 872), (205, 960)], 10); line(c, [(150, 975), (260, 975)], 8)
    rrect(c, 100, 640, 40, 220, 14); fill_stroke(c, (0.25, 0.25, 0.27), 4)
    man(c, 200, 840, t, dir=1, expr="worried", turn=0.3, look_down=0.2, tilt=0.06, arms="lap", s=0.9)
    for k, (ox, oy, r) in enumerate([(10, 590, 8), (18, 555, 11), (22, 512, 15)]):
        if lt > 0.05 + k * 0.06: c.arc(200 + ox, oy, r, 0, TAU); fill_stroke(c, (1, 1, 1), 3)
    thought_cloud(c, 220, 330, 330, 290, pop(lt, 0.05, 0.3))
    words = ["BOSS", "BILLS", "REPORT", "CALLS", "RENT", "EMAILS", "TRAFFIC"]
    rnd = random.Random(5)
    for k, wd in enumerate(words):
        ang = k * TAU / len(words) + t * 0.6; rr = 70 + (k % 2) * 40
        tag(c, 220 + math.cos(ang) * rr, 330 + math.sin(ang) * rr * 0.7, wd, 20, pop(lt, 0.15 + k * 0.1, 0.2), rot=rnd.uniform(-0.2, 0.2))
    items = ["Finish report", "Team meeting", "Call the bank", "Pay rent", "Reply to boss", "Text her back"]
    checks = [ls(7) + 0.3 + k * 0.28 for k in range(5)] + [le(8) - 0.25]
    todo_board(c, 520, 560, items, t, checks, pop(lt, 0.2, 0.3))
    if t > le(8) - 0.25:
        heart_shape(c, 600, 755, 0.55 * pop(t, le(8) - 0.25, 0.3))


def sc_night_reply(c, t, T):    # late, the work is done; he finally picks up the phone
    lt = t - T[0]
    cam(c, lerp(1.10, 1.22, seg(lt, 0, T[1] - T[0])), 360, 620)
    study(c, t, 0.8)
    man(c, 380, 780, t, dir=-1, expr="smile" if lt > 0.6 else "neutral", look_down=0.8, arms="write")
    desk(c, t, 0.8)
    glow(c, 330, 700, 90, (0.85, 0.92, 1), 0.6)
    c.save(); c.translate(330, 760); rrect(c, -30, -50, 60, 96, 8); fill_stroke(c, (0.12, 0.12, 0.13), 3)
    rrect(c, -24, -44, 48, 84, 6); c.set_source_rgb(0.85, 0.92, 1); c.fill(); c.restore()
    heart_shape(c, 330, 600 - 60 * seg(lt, 0.8, 2.0), 0.8 * pop(lt, 0.8, 0.3), a=1 - seg(lt, 1.6, 2.2))
    particles(c, t, 26, 0.2, 4)


def sc_reply(c, t, T):          # her phone lights up
    lt = t - T[0]; s = ls(10)
    c.set_source_rgb(0.85, 0.85, 0.87); c.paint()
    cam(c, lerp(1.0, 1.06, seg(lt, 0, T[1] - T[0])), 360, 600)
    msgs = [{"side": "me", "text": "Hey, are you okay?", "t": -1},
            {"side": "them", "text": "Sorry, crazy day.", "t": s + 0.1},
            {"side": "them", "text": "Miss you", "t": s + 0.9, "heart": True}]
    phone_screen(c, t, msgs, clock="9:58", typing=(T[0], s + 0.1))
    if t > s + 1.5:
        for k in range(6):
            p = seg(t, s + 1.5 + k * 0.12, s + 2.8 + k * 0.12)
            heart_shape(c, 200 + k * 64, 900 - 520 * p, 0.6 + 0.2 * (k % 2), a=1 - p)


# (first script line of the scene, scene function)
SCENES = [(0, sc_waiting), (1, sc_fast_chat), (2, sc_slow_chat), (3, sc_stories),
          (5, sc_office), (7, sc_full_head), (9, sc_night_reply), (10, sc_reply)]
