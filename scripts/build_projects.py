#!/usr/bin/env python3
"""Build a detail page for every project in the Recent work section.

Reads the curated content in assets/data/projects.json (display order, titles,
facts, highlights) plus the Behance import in assets/data/behance-projects.json
(cover, link, year, description), and writes case-studies/<slug>.html from the
template below.

Run it after editing projects.json or the template:
    python3 scripts/build_projects.py
"""

import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "case-studies")

ARROW = ('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" '
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>')
BACK = ('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>')

e = html.escape


def asset_version():
    with open(os.path.join(ROOT, "index.html"), encoding="utf-8") as f:
        m = re.search(r"style\.css\?v=([\w.-]+)", f.read())
    return m.group(1) if m else "1"


def srcset(src, width, prefix="../"):
    """srcset with the -600/-1000 WebP copies made by optimize_images.py, when they exist."""
    base, ext = os.path.splitext(src)
    parts = [f"{prefix}{base}-{w}.webp {w}w" for w in (600, 1000)
             if os.path.exists(os.path.join(ROOT, f"{base}-{w}.webp"))]
    return ", ".join(parts + [f"{prefix}{src} {width}w"]) if parts else ""


def img_attrs(src, width, sizes, prefix="../"):
    ss = srcset(src, width, prefix)
    return f' srcset="{ss}" sizes="{sizes}"' if ss else ""


def webp_cover(src):
    """Prefer the WebP copy of a Behance cover."""
    base, ext = os.path.splitext(src)
    return base + ".webp" if ext.lower() != ".webp" and os.path.exists(os.path.join(ROOT, base + ".webp")) else src



def split_words(text, start=0):
    """Wrap each word in .sw/.sw__i so CSS can rise it in on first paint (no JS wait)."""
    words = text.split()
    return " ".join(f'<span class="sw"><span class="sw__i" style="--i:{start + i}">{w}</span></span>' for i, w in enumerate(words))



def live_btn(p):
    """Primary 'Live prototype' button when the project has a live_url."""
    if not p.get("live_url"):
        return ""
    return (f'<a class="btn btn--lime btn--arrow" href="{e(p["live_url"])}" target="_blank" rel="noopener">'
            f'{e(p.get("live_label", "Live prototype"))}<span class="btn__circle">{ARROW}</span></a>\n              ')


def card(p, num, prefix="", label=None):
    """A Recent work card. Used on the home page and for previous/next links on project pages."""
    href = prefix + "case-studies/" + p["slug"] + ".html" if prefix == "" else p["slug"] + ".html"
    meta = label or f"{p['year']} · {p['card_tags'][0][0]}"
    new = '<span class="rw-card__new">New</span>' if not label and any(t == "New" for t, _ in p["card_tags"]) else ""
    return f"""          <article class="rw-card reveal">
            <a class="rw-card__link" href="{href}">
              <div class="rw-card__media">
                <img src="{prefix}{p['cover']}" alt="{e(p['name'])} cover" width="808" height="632" loading="lazy" decoding="async" />
              </div>
              <div class="rw-card__body">
                <div>
                  <p class="rw-card__meta">{e(meta)}{new}</p>
                  <h3 class="rw-card__title">{e(p['name'])}</h3>
                  <p class="rw-card__desc">{e(p['card_text'])}</p>
                </div>
                <span class="rw-card__arrow" aria-hidden="true">{ARROW}</span>
              </div>
            </a>
          </article>"""


def update_home(projects):
    path = os.path.join(ROOT, "index.html")
    with open(path, encoding="utf-8") as f:
        page = f.read()
    start = page.index("<!-- rw-cards:start")
    start = page.index("\n", start) + 1
    end = page.index("<!-- rw-cards:end -->")
    cards = "\n\n".join(card(p, i) for i, p in enumerate(projects, 1))
    with open(path, "w", encoding="utf-8") as f:
        f.write(page[:start] + cards + "\n" + page[end:])
    print("updated index.html (Recent work cards)")


def lis(items):
    return "".join(f"<li>{e(i)}</li>" for i in items)


def block(b):
    """Render one case-study block (see assets/data/case-studies/*.json)."""
    t = b["type"]
    if t == "facts":
        return '<dl class="cs-blk-facts">' + "".join(
            f'<div><dt>{e(i["label"])}</dt><dd><strong>{e(i["title"])}</strong>{e(i["text"])}</dd></div>'
            for i in b["items"]) + "</dl>"
    if t == "duo":
        return ('<div class="cs-blk-duo">'
                f'<div class="cs-blk-duo__a"><p class="cs-blk-label">{e(b["a"]["label"])}</p><p>{e(b["a"]["text"])}</p></div>'
                f'<div class="cs-blk-duo__b"><p class="cs-blk-label">{e(b["b"]["label"])}</p><p>{e(b["b"]["text"])}</p></div></div>')
    if t == "cards":
        cls = "cs-blk-cards cs-blk-cards--2col" if len(b["items"]) in (2, 4) else "cs-blk-cards"
        return f'<ol class="{cls}">' + "".join(
            f'<li><span class="process__num">{n:02d}</span><h4>{e(i["title"])}</h4><p>{e(i["text"])}</p></li>'
            for n, i in enumerate(b["items"], 1)) + "</ol>"
    if t == "rows":
        return '<ol class="cs-blk-rows">' + "".join(
            f'<li><span class="cs-blk-rows__num">{n}</span><div><h4>{e(i["title"])}</h4><p>{e(i["text"])}</p></div></li>'
            for n, i in enumerate(b["items"], 1)) + "</ol>"
    if t == "persona":
        cols = "".join(f'<div><p class="cs-blk-label">{e(c["title"])}</p><ul>{lis(c["items"])}</ul></div>' for c in b["cols"])
        initial = b.get("initial") or b["name"].strip("“”\"' ")[0]
        bio = f'<p class="cs-blk-persona__bio">{e(b["bio"])}</p>' if b.get("bio") else ""
        return (f'<div class="cs-blk-persona"><div class="cs-blk-persona__head"><span class="cs-blk-persona__avatar" aria-hidden="true">{e(initial)}</span>'
                f'<div><h4>{e(b["name"])}</h4><p>{e(b["meta"])}</p></div></div>{bio}<div class="cs-blk-persona__cols">{cols}</div></div>')
    if t == "quote":
        return f'<blockquote class="cs-blk-quote"><p class="cs-blk-label">{e(b["label"])}</p><p>{e(b["text"])}</p></blockquote>'
    if t == "list":
        return f'<div class="cs-blk-list"><p class="cs-blk-label">{e(b["title"])}</p><ul>{lis(b["items"])}</ul></div>'
    if t == "columns":
        return '<div class="cs-blk-columns">' + "".join(
            f'<div><h4>{e(c["title"])}</h4><ul>{lis(c["items"])}</ul></div>' for c in b["items"]) + "</div>"
    if t == "chips":
        return (f'<div class="cs-blk-chips"><p class="cs-blk-label">{e(b["label"])}</p>'
                f'<ul>{lis(b["items"])}</ul></div>')
    if t == "steps":
        label = f'<p class="cs-blk-label">{e(b["label"])}</p>' if b.get("label") else ""
        return (f'<div class="cs-blk-steps">{label}<ol>' + "".join(
            f'<li><span>{n}</span>{e(i)}</li>' for n, i in enumerate(b["items"], 1)) + "</ol></div>")
    if t == "swatches":
        return '<ul class="cs-blk-swatches">' + "".join(
            f'<li><span class="cs-blk-swatches__chip" style="background:{i["hex"]}"></span>'
            f'<strong>{e(i["name"])}</strong>' + "".join(f'<code>{e(v)}</code>' for v in (i.get("token"), i["hex"]) if v and v != i["name"]) + '</li>'
            for i in b["items"]) + "</ul>"
    if t == "typescale":
        return '<ul class="cs-blk-type">' + "".join(
            f'<li><span class="cs-blk-type__spec">{e(i["spec"])}</span>'
            f'<span class="cs-blk-type__sample" style="font-size:clamp({min(i["size"], 28)}px, {i["size"] / 14:.2f}vw, {i["size"]}px);'
            f'font-weight:{i["weight"]};letter-spacing:{i["track"]}em">{e(i["sample"])}</span>'
            f'<span class="cs-blk-type__use">{e(i["use"])}</span></li>' for i in b["items"]) + "</ul>"
    if t == "carousel":
        arrow = lambda d: f'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"/></svg>'
        tabs = "".join(
            f'<button type="button" class="sc__tab" role="tab" aria-selected="{"true" if i == 0 else "false"}" data-set="{i}">'
            f'{e(st["label"])}<span>{len(st["items"])}</span></button>' for i, st in enumerate(b["sets"]))
        sets = "".join(
            f'<div class="sc__set sc__set--{st["kind"]}" data-set="{i}"{"" if i == 0 else " hidden"}><ul class="sc__track">' + "".join(
                f'<li class="sc__slide" data-caption="{e(it["caption"])}"><img src="../{it["src"]}" alt="{e(it["alt"])}" '
                f'width="{it["width"]}" height="{it["height"]}" loading="lazy" decoding="async" draggable="false" /></li>' for it in st["items"])
            + '</ul></div>' for i, st in enumerate(b["sets"]))
        first = b["sets"][0]
        light = " sc--light" if b.get("light") else ""
        return (f'<div class="sc{light}" aria-roledescription="carousel" aria-label="{e(b.get("label", "UI screens"))}">'
                f'<div class="sc__tabs" role="tablist">{tabs}</div>'
                f'<div class="sc__stage" tabindex="0">{sets}</div>'
                f'<div class="sc__bar"><p class="sc__info" aria-live="polite"><span class="sc__count"><b>01</b> / {len(first["items"]):02d}</span>'
                f'<span class="sc__caption">{e(first["items"][0]["caption"])}</span></p>'
                f'<span class="sc__progress" aria-hidden="true"><i></i></span>'
                f'<span class="sc__nav"><button type="button" class="sc__btn sc__prev" aria-label="Previous screen">{arrow("M15 6l-6 6 6 6")}</button>'
                f'<button type="button" class="sc__btn sc__next" aria-label="Next screen">{arrow("M9 6l6 6-6 6")}</button></span></div></div>')
    if t == "image":
        return (f'<figure class="cs-blk-image"><img src="../{b["src"]}"{img_attrs(b["src"], b["width"], "(max-width: 900px) 100vw, 860px")} alt="{e(b["alt"])}" '
                f'width="{b["width"]}" height="{b["height"]}" loading="lazy" decoding="async" /></figure>')
    if t == "themes":
        card = ('<div class="ledgr-card"><p class="ledgr-card__eyebrow">Primary account · Northbank •••• 4821</p>'
                '<p class="ledgr-card__label">Total balance · 4 accounts</p>'
                '<p class="ledgr-card__value">$115,899<span>.97</span></p>'
                '<p class="ledgr-card__chip">Top goal · Emergency fund · 61%</p></div>')
        return (f'<div class="cs-blk-themes"><figure class="ledgr ledgr--light">{card}<figcaption>Light</figcaption></figure>'
                f'<figure class="ledgr ledgr--dark">{card}<figcaption>Dark · hand-tuned</figcaption></figure></div>')
    if t == "breakpoints":
        return '<div class="cs-blk-bp">' + "".join(
            f'<figure class="cs-blk-bp__item cs-blk-bp__item--{i["cols"]}"><div class="cs-blk-bp__grid" '
            f'style="--cols:{i["cols"]}">' + "<i></i>" * i["cols"] + f'</div><figcaption><strong>{e(i["label"])}</strong>{e(i["note"])}</figcaption></figure>'
            for i in b["items"]) + "</div>"
    raise ValueError(f"unknown block type {t}")


def render_summary(p):
    paragraphs = "\n".join(f"          <p>{e(t)}</p>" for t in p["overview"])
    highlights = "\n".join(
        f"""          <li class="reveal">
            <span class="process__num">{i:02d}</span>
            <h3>{e(h['title'])}</h3>
            <p>{e(h['text'])}</p>
          </li>""" for i, h in enumerate(p["highlights"], 1)
    )
    return f"""    <!-- ===================== OVERVIEW ===================== -->
    <section class="section">
      <div class="container cs-overview">
        <p class="label reveal">Overview</p>
        <div class="pj-overview reveal">
          <p class="cs-overview__text">{e(p['statement'])}</p>
{paragraphs}
        </div>
      </div>
    </section>

    <!-- ===================== HIGHLIGHTS ===================== -->
    <section class="section section--flush-top">
      <div class="container">
        <div class="section__head-row reveal">
          <p class="label">Highlights</p>
          <h2 class="cs-section-title">{e(p['highlights_title'])}</h2>
        </div>
        <ol class="process pj-highlights">
{highlights}
        </ol>
      </div>
    </section>

"""


def chapter(c):
    """One chapter. With a Figma board, wide screens show the board and keep the text for
    screen readers; narrow screens show the text, plus a cropped screen image if there is one."""
    board = c.get("board")
    ui = c.get("board_ui")
    board_html = (f'<figure class="cs-board" aria-hidden="true"><img src="../{board["src"]}"{img_attrs(board["src"], board["width"], "(max-width: 900px) 100vw, 1280px")} alt="" '
                  f'width="{board["width"]}" height="{board["height"]}" loading="lazy" decoding="async" /></figure>') if board else ""
    ui_html = (f'<figure class="cs-blk-image cs-board-ui"><img src="../{ui["src"]}" '
               f'alt="{e(c["label"])} screens from the Ledgr prototype" width="{ui["width"]}" height="{ui["height"]}" '
               f'loading="lazy" /></figure>') if ui else ""
    blocks = "".join(f'<div class="cs-chapter__block reveal">{block(b)}</div>' for b in c["blocks"])
    return f"""      <section class="cs-chapter{' has-board' if board else ''}" id="{c['id']}">
        <div class="container">
          {board_html}
          <div class="cs-chapter__inner cs-chapter__text">
            <div class="cs-chapter__side reveal"><p class="label">{c['num']} · {e(c['label'])}</p></div>
            <div class="cs-chapter__main">
              <h2 class="cs-chapter__title reveal">{e(c['title'])}</h2>
              {f'<p class="cs-chapter__lead reveal">{e(c["lead"])}</p>' if c.get("lead") else ""}
              {ui_html}{blocks}
            </div>
          </div>
        </div>
      </section>"""


def chapters(cs):
    nav = "".join(f'<a href="#{c["id"]}">{c["num"]} · {e(c["label"])}</a>' for c in cs)
    body = "\n".join(chapter(c) for c in cs)
    return f"""    <!-- ===================== CASE STUDY ===================== -->
    <nav class="cs-chapters" aria-label="Case study chapters">
      <div class="container"><div class="cs-chapters__scroll">{nav}</div></div>
    </nav>
    <div class="cs-study">
{body}
    </div>

"""


SITE = "https://kavindaweerasekaradev-coder.github.io/App/"


def ld_json(p, cover):
    """Structured data for a case study: the project as a CreativeWork by Kavinda, plus breadcrumbs."""
    url = f"{SITE}case-studies/{p['slug']}.html"
    year = dict(p["facts"]).get("Year")
    data = {"@context": "https://schema.org", "@graph": [
        {"@type": "CreativeWork", "@id": url + "#work", "name": p["name"], "headline": f"{p['name']} — {p['kind']}",
         "description": p["lead"], "url": url, "image": SITE + cover["src"], "keywords": ", ".join(p["tags"]),
         "author": {"@type": "Person", "@id": SITE + "#person", "name": "Kavinda Weerasekara", "url": SITE},
         **({"dateCreated": year} if year and year.isdigit() else {})},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Kavinda Weerasekara", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "Recent work", "item": SITE + "#work"},
            {"@type": "ListItem", "position": 3, "name": p["name"], "item": url}]}]}
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


def gallery(p):
    """Optional full-bleed UI screens showcase after the case study: two endless rows (web, mobile)."""
    g = p.get("gallery")
    if not g:
        return ""
    def row(st, direction):
        items = "".join(
            f'<figure class="shw__item"><img src="../{it["src"]}"{img_attrs(it["src"], it["width"], "(max-width: 900px) 70vw, 560px" if st["kind"] == "web" else "210px")} alt="{e(it["alt"])}" width="{it["width"]}" height="{it["height"]}" loading="lazy" decoding="async" draggable="false" />'
            f'<figcaption>{e(it["caption"])}</figcaption></figure>' for it in st["items"])
        return (f'<div class="shw__row shw__row--{st["kind"]}" data-dir="{direction}" aria-label="{e(st["label"])} screens">'
                f'<div class="shw__track">{items}<div class="shw__dup" aria-hidden="true">{items}</div></div></div>')
    rows = "".join(row(st, -1 if i % 2 == 0 else 1) for i, st in enumerate(g["sets"]))
    return f"""    <!-- ===================== UI SCREENS ===================== -->
    <section class="shw" id="ui-screens" aria-label="{e(g["title"])} {e(g.get("title_soft", ""))}">
      <div class="container shw__head">
        <p class="label reveal">{e(g.get("label", "UI screens"))}</p>
        <h2 class="shw__title">{e(g["title"])} <span class="soft">{e(g.get("title_soft", ""))}</span></h2>
        <p class="shw__lead reveal">{e(g.get("lead", ""))}</p>
      </div>
      <div class="shw__rows">{rows}</div>
    </section>

"""


def render(p, prev_p, next_p, version):
    cover = p.get("cover_image") or {"src": p["cover"], "width": 808, "height": 632}
    middle = chapters(p["case_study_data"]) if p.get("case_study_data") else render_summary(p)
    extra_fonts = "&family=" + p["extra_fonts"] if p.get("extra_fonts") else ""
    facts = "\n".join(
        f"          <div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>" for k, v in p["facts"]
    )
    tags = "".join(f"<li>{e(t)}</li>" for t in p["tags"])
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{e(p['name'])} — {e(p['kind'])} by Kavinda Weerasekara</title>
  <meta name="description" content="{e(p['lead'])}" />
  <meta name="author" content="Kavinda Weerasekara" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="{SITE}case-studies/{p['slug']}.html" />
  <meta name="theme-color" content="#ffffff" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="kavinda.design" />
  <meta property="og:title" content="{e(p['name'])} — {e(p['kind'])} by Kavinda Weerasekara" />
  <meta property="og:description" content="{e(p['lead'])}" />
  <meta property="og:url" content="{SITE}case-studies/{p['slug']}.html" />
  <meta property="og:image" content="{SITE}{cover['src']}" />
  <meta property="article:author" content="Kavinda Weerasekara" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{e(p['name'])} — {e(p['kind'])}" />
  <meta name="twitter:description" content="{e(p['lead'])}" />
  <meta name="twitter:image" content="{SITE}{cover['src']}" />
  <script type="application/ld+json">{ld_json(p, cover)}</script>

  <link rel="icon" href="../assets/img/favicon-32.png?v=2" sizes="32x32" type="image/png" />
  <link rel="icon" href="../assets/img/favicon-48.png?v=2" sizes="48x48" type="image/png" />
  <link rel="icon" href="../assets/img/favicon-192.png?v=2" sizes="192x192" type="image/png" />
  <link rel="apple-touch-icon" href="../assets/img/apple-touch-icon.png?v=2" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600{extra_fonts}&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../assets/css/style.css?v={version}" />
  <script>document.documentElement.classList.add('js')</script>
  <link rel="preload" href="../assets/js/vendor/gsap.min.js?v=3.12.5" as="script" />
  <link rel="preload" href="../assets/js/vendor/ScrollTrigger.min.js?v=3.12.5" as="script" />
  <link rel="preload" href="../assets/js/motion.js?v={version}" as="script" />
  <script src="../assets/js/analytics.js" defer></script>
</head>
<body>
  <!-- Generated by scripts/build_projects.py from assets/data/projects.json — edit those, not this file. -->
  <a class="skip-link" href="#main">Skip to content</a>

  <!-- ===================== NAV ===================== -->
  <header class="nav" id="top">
    <div class="container nav__inner">
      <a href="../" class="nav__logo" aria-label="Kavinda Weerasekara — home">
        <svg class="nav__logo-mark" viewBox="0 0 64 64" width="36" height="36" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#0e0e0e"/><g fill="none" stroke="#fff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17v30"/><path d="M38 17 23.5 32 38 47"/></g><circle class="nav__logo-dot" cx="47" cy="44" r="4.5" fill="#d4f55c"/></svg>
        <span class="nav__logo-text">kavinda<span>.design</span></span>
      </a>

      <nav class="nav__links" id="nav-links" aria-label="Primary">
        <a href="../index.html#work" class="is-active">Work</a>
        <a href="../index.html#about">About</a>
        <a href="../index.html#services">Services</a>
        <a href="../index.html#experience">Experience</a>
        <a href="../assets/docs/Kavinda-Weerasekara-CV.pdf?v=2" download>Download CV</a>
      </nav>

      <div class="nav__actions">
        <a href="#contact" class="btn btn--lime btn--sm">Contact me</a>
        <button class="icon-btn nav__burger" id="nav-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <main id="main">
    <!-- ===================== INTRO ===================== -->
    <section class="cs-page-hero">
      <div class="container">
        <a class="pill cs-back hero-in hero-in--1" href="../index.html#work">{BACK} Recent work</a>

        <div class="cs-page-hero__grid">
          <div>
            <p class="label hero-in hero-in--1">{e(p['kind'])} · {p['year']}</p>
            <h1 class="cs-page-hero__title hero-in" aria-label="{e(p.get('hero_title', p['name']))} {e(p['subtitle'])}">{split_words(e(p.get('hero_title', p['name'])))}<br /><span class="soft">{split_words(e(p['subtitle']), len(p.get('hero_title', p['name']).split()))}</span></h1>
          </div>
          <div class="cs-page-hero__side hero-in hero-in--2">
            <p class="cs-page-hero__lead">{e(p['lead'])}</p>
            <ul class="pj-tags">{tags}</ul>
            <div class="cs-page-hero__ctas">
              {live_btn(p)}<a class="btn {'btn--outline' if p.get('live_url') else 'btn--lime btn--arrow'}" href="{e(p['url'])}" target="_blank" rel="noopener">
                View on Behance
                {'' if p.get('live_url') else f'<span class="btn__circle">{ARROW}</span>'}
              </a>
            </div>
          </div>
        </div>

        <dl class="cs-facts hero-in hero-in--3">
{facts}
        </dl>
      </div>
    </section>

    <!-- ===================== COVER ===================== -->
    <section class="container">
      <figure class="cs-page-cover hero-in hero-in--3">
        <img src="../{cover['src']}"{img_attrs(cover['src'], cover['width'], "(max-width: 1340px) 100vw, 1280px")} alt="{e(p['name'])} cover" width="{cover['width']}" height="{cover['height']}" fetchpriority="high" decoding="async" />
      </figure>
    </section>

{middle}{gallery(p)}    <!-- ===================== BEHANCE ===================== -->
    <section class="section section--flush-top">
      <div class="container">
        <div class="pj-cta reveal">
          <div>
            <p class="label label--light">Full project</p>
            <h2 class="pj-cta__title">See every screen <span class="soft">on Behance</span></h2>
            <p class="pj-cta__text">The complete project, with all screens and details, is published on my Behance profile.{' You can also try the live, working prototype.' if p.get('live_url') else ''}</p>
          </div>
          <div class="pj-cta__btns">{live_btn(p)}<a class="btn {'btn--glass' if p.get('live_url') else 'btn--lime btn--arrow'}" href="{e(p['url'])}" target="_blank" rel="noopener">
            {'View on Behance' if p.get('live_url') else 'Open ' + e(p['name'])}
            {'' if p.get('live_url') else f'<span class="btn__circle">{ARROW}</span>'}
          </a></div>
        </div>
      </div>
    </section>

    <!-- ===================== MORE PROJECTS ===================== -->
    <section class="section section--flush-top">
      <div class="container">
        <div class="rw-head reveal">
          <div>
            <p class="label">More work</p>
            <h2 class="rw-title">Keep <span class="soft">exploring</span></h2>
          </div>
          <a href="../index.html#work" class="btn btn--dark btn--arrow">
            All recent work
            <span class="btn__circle btn__circle--lime">{ARROW}</span>
          </a>
        </div>
        <div class="rw-grid">
{card(prev_p, prev_p['num'], '../', 'Previous project')}
{card(next_p, next_p['num'], '../', 'Next project')}
        </div>
      </div>
    </section>

    <!-- ===================== CONTACT ===================== -->
    <section class="section section--flush-top" id="contact">
      <div class="container">
        <div class="contact reveal">
          <p class="label label--light">Let's work together</p>
          <h2 class="contact__title">Have a product that needs <br /><span class="soft">a thoughtful designer?</span></h2>
          <p class="contact__lead">I'm open to full-time roles and freelance projects. Drop me a line and I'll get back to you soon.</p>
          <div class="contact__actions">
            <a class="btn btn--lime btn--arrow btn--email" href="mailto:kavindasekara@gmail.com">
              kavindasekara@gmail.com
              <span class="btn__circle">{ARROW}</span>
            </a>
            <button class="btn btn--glass" type="button" id="copy-email" data-email="kavindasekara@gmail.com">
              <span class="copy-label">Copy email</span>
            </button>
          </div>
          <ul class="contact__links">
            <li><a href="https://www.linkedin.com/in/kavindaweerasekara/" target="_blank" rel="noopener">LinkedIn ↗</a></li>
            <li><a href="https://www.behance.net/kavindalakmal" target="_blank" rel="noopener">Behance ↗</a></li>
            <li><a href="https://dribbble.com/Kavindalakmal" target="_blank" rel="noopener">Dribbble ↗</a></li>
          </ul>
        </div>
      </div>
    </section>
  </main>

  <!-- ===================== FOOTER ===================== -->
  <footer class="footer">
    <div class="container footer__inner">
      <p>© <span id="year">2026</span> Kavinda Weerasekara</p>
      <p class="footer__mono">Product &amp; UI/UX Designer · Sri Lanka</p>
      <span class="footer__links"><button type="button" class="footer__top footer__cookies" data-cookie-settings>Cookie settings</button>
      <a href="#top" class="footer__top">Back to top ↑</a></span>
    </div>
  </footer>

  <script src="../assets/js/vendor/gsap.min.js?v=3.12.5" defer></script>
  <script src="../assets/js/vendor/ScrollTrigger.min.js?v=3.12.5" defer></script>
  <script src="../assets/js/vendor/lenis.min.js?v=1.1.13" defer></script>
  <script src="../assets/js/smooth.js?v={version}" defer></script>
  <script src="../assets/js/vendor/Draggable.min.js?v=3.12.5" defer></script>
  <script src="../assets/js/carousel.js?v={version}" defer></script>
  <script src="../assets/js/showcase.js?v={version}" defer></script>
  <script src="../assets/js/motion.js?v={version}" defer></script>
  <script src="../assets/js/main.js?v={version}" defer></script>
</body>
</html>
"""


def main():
    import importlib.util
    spec = importlib.util.spec_from_file_location("optimize_images", os.path.join(ROOT, "scripts", "optimize_images.py"))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); mod.main()
    with open(os.path.join(ROOT, "assets", "data", "projects.json"), encoding="utf-8") as f:
        projects = json.load(f)
    with open(os.path.join(ROOT, "assets", "data", "behance-projects.json"), encoding="utf-8") as f:
        behance = {p["id"]: p for p in json.load(f)["projects"]}

    for p in projects:
        b = behance[p["behance_id"]]
        p["cover"] = webp_cover(b["cover"])
        p["url"] = b["url"]
        p["year"] = (b.get("published") or "")[:4]
        if p.get("case_study"):
            with open(os.path.join(ROOT, p["case_study"]), encoding="utf-8") as f:
                p["case_study_data"] = json.load(f)

    for i, p in enumerate(projects, 1):
        p["num"] = i
    update_home(projects)
    version = asset_version()
    os.makedirs(OUT_DIR, exist_ok=True)
    for i, p in enumerate(projects):
        prev_p, next_p = projects[i - 1], projects[(i + 1) % len(projects)]
        path = os.path.join(OUT_DIR, p["slug"] + ".html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(render(p, prev_p, next_p, version))
        print("wrote", os.path.relpath(path, ROOT))
    write_sitemap(projects)


def write_sitemap(projects):
    """sitemap.xml for search engines: the home page and every case study."""
    import datetime
    today = datetime.date.today().isoformat()
    urls = [(SITE, "1.0")] + [(f"{SITE}case-studies/{p['slug']}.html", "0.8") for p in projects]
    body = "".join(f"  <url><loc>{u}</loc><lastmod>{today}</lastmod><priority>{pr}</priority></url>\n" for u, pr in urls)
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + "</urlset>\n")
    print("wrote sitemap.xml")


if __name__ == "__main__":
    main()
