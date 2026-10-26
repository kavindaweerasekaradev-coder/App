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


def card(p, num, prefix="", label=None):
    """A Recent work card. Used on the home page and for previous/next links on project pages."""
    href = prefix + "case-studies/" + p["slug"] + ".html" if prefix == "" else p["slug"] + ".html"
    meta = label or f"{p['year']} · {p['card_tags'][0][0]}"
    new = '<span class="rw-card__new">New</span>' if not label and any(t == "New" for t, _ in p["card_tags"]) else ""
    return f"""          <article class="rw-card reveal">
            <a class="rw-card__link" href="{href}">
              <div class="rw-card__media">
                <img src="{prefix}{p['cover']}" alt="{e(p['name'])} cover" width="808" height="632" loading="lazy" />
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
        return (f'<div class="cs-blk-persona"><div class="cs-blk-persona__head"><span class="cs-blk-persona__avatar" aria-hidden="true">A</span>'
                f'<div><h4>{e(b["name"])}</h4><p>{e(b["meta"])}</p></div></div><div class="cs-blk-persona__cols">{cols}</div></div>')
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
            f'<strong>{e(i["name"])}</strong><code>{e(i["token"])}</code><code>{e(i["hex"])}</code></li>'
            for i in b["items"]) + "</ul>"
    if t == "typescale":
        return '<ul class="cs-blk-type">' + "".join(
            f'<li><span class="cs-blk-type__spec">{e(i["spec"])}</span>'
            f'<span class="cs-blk-type__sample" style="font-size:clamp({min(i["size"], 28)}px, {i["size"] / 14:.2f}vw, {i["size"]}px);'
            f'font-weight:{i["weight"]};letter-spacing:{i["track"]}em">{e(i["sample"])}</span>'
            f'<span class="cs-blk-type__use">{e(i["use"])}</span></li>' for i in b["items"]) + "</ul>"
    if t == "image":
        return (f'<figure class="cs-blk-image"><img src="../{b["src"]}" alt="{e(b["alt"])}" '
                f'width="{b["width"]}" height="{b["height"]}" loading="lazy" /></figure>')
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
    board_html = (f'<figure class="cs-board" aria-hidden="true"><img src="../{board["src"]}" alt="" '
                  f'width="{board["width"]}" height="{board["height"]}" loading="lazy" /></figure>') if board else ""
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
              <p class="cs-chapter__lead reveal">{e(c['lead'])}</p>
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
  <title>{e(p['name'])} — {e(p['kind'])} · Kavinda Weerasekara</title>
  <meta name="description" content="{e(p['lead'])}" />
  <meta name="theme-color" content="#ffffff" />

  <meta property="og:title" content="{e(p['name'])} — {e(p['kind'])}" />
  <meta property="og:description" content="{e(p['lead'])}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="../{p['cover']}" />

  <link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600{extra_fonts}&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../assets/css/style.css?v={version}" />
</head>
<body>
  <!-- Generated by scripts/build_projects.py from assets/data/projects.json — edit those, not this file. -->
  <a class="skip-link" href="#main">Skip to content</a>

  <!-- ===================== NAV ===================== -->
  <header class="nav" id="top">
    <div class="container nav__inner">
      <a href="../index.html" class="nav__logo" aria-label="Kavinda Weerasekara — home">
        <span class="nav__logo-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 20 12 4l8 16h-5l-3-6-3 6z"/></svg>
        </span>
        Kavinda
      </a>

      <nav class="nav__links" id="nav-links" aria-label="Primary">
        <a href="../index.html#work" class="is-active">Work</a>
        <a href="../index.html#about">About</a>
        <a href="../index.html#services">Services</a>
        <a href="../index.html#experience">Experience</a>
        <a href="../assets/docs/Kavinda-Weerasekara-CV.pdf" download>Download CV</a>
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
        <a class="pill cs-back reveal" href="../index.html#work">{BACK} Recent work</a>

        <div class="cs-page-hero__grid">
          <div class="reveal">
            <p class="label">{e(p['kind'])} · {p['year']}</p>
            <h1 class="cs-page-hero__title">{e(p.get('hero_title', p['name']))}<br /><span class="soft">{e(p['subtitle'])}</span></h1>
          </div>
          <div class="cs-page-hero__side reveal">
            <p class="cs-page-hero__lead">{e(p['lead'])}</p>
            <ul class="pj-tags">{tags}</ul>
            <div class="cs-page-hero__ctas">
              <a class="btn btn--lime btn--arrow" href="{e(p['url'])}" target="_blank" rel="noopener">
                View on Behance
                <span class="btn__circle">{ARROW}</span>
              </a>
            </div>
          </div>
        </div>

        <dl class="cs-facts reveal">
{facts}
        </dl>
      </div>
    </section>

    <!-- ===================== COVER ===================== -->
    <section class="container">
      <figure class="cs-page-cover reveal">
        <img src="../{cover['src']}" alt="{e(p['name'])} cover" width="{cover['width']}" height="{cover['height']}" />
      </figure>
    </section>

{middle}    <!-- ===================== BEHANCE ===================== -->
    <section class="section section--flush-top">
      <div class="container">
        <div class="pj-cta reveal">
          <div>
            <p class="label label--light">Full project</p>
            <h2 class="pj-cta__title">See every screen <span class="soft">on Behance</span></h2>
            <p class="pj-cta__text">The complete project, with all screens and details, is published on my Behance profile.</p>
          </div>
          <a class="btn btn--lime btn--arrow" href="{e(p['url'])}" target="_blank" rel="noopener">
            Open {e(p['name'])}
            <span class="btn__circle">{ARROW}</span>
          </a>
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
      <a href="#top" class="footer__top">Back to top ↑</a>
    </div>
  </footer>

  <script src="../assets/js/main.js?v={version}"></script>
</body>
</html>
"""


def main():
    with open(os.path.join(ROOT, "assets", "data", "projects.json"), encoding="utf-8") as f:
        projects = json.load(f)
    with open(os.path.join(ROOT, "assets", "data", "behance-projects.json"), encoding="utf-8") as f:
        behance = {p["id"]: p for p in json.load(f)["projects"]}

    for p in projects:
        b = behance[p["behance_id"]]
        p["cover"] = b["cover"]
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


if __name__ == "__main__":
    main()
