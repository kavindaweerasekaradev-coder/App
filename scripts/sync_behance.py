#!/usr/bin/env python3
"""Import public projects from a Behance profile into the site.

Writes assets/data/behance-projects.json and downloads each project's cover
to assets/img/behance/<id>.<ext>. Runs in GitHub Actions (see
.github/workflows/behance-sync.yml) using only the standard library.

Sources, in order:
  1. The profile RSS feed (https://www.behance.net/feeds/user?username=...)
  2. Gallery links found in the profile page HTML
Each project page is then read for its og:title / og:description / og:image.
"""

import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

USERNAME = os.environ.get("BEHANCE_USERNAME", "kavindalakmal")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(ROOT, "assets", "data", "behance-projects.json")
COVER_DIR = os.path.join(ROOT, "assets", "img", "behance")
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
GALLERY_RE = re.compile(r"https://www\.behance\.net/gallery/(\d+)/([A-Za-z0-9\-_%]+)")


def fetch(url, binary=False, retries=3):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read()
                return body if binary else body.decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError) as err:
            print(f"  fetch failed ({attempt + 1}/{retries}) {url}: {err}", file=sys.stderr)
            time.sleep(2 * (attempt + 1))
    return None


def from_rss():
    xml_text = fetch(f"https://www.behance.net/feeds/user?username={USERNAME}")
    if not xml_text or "<rss" not in xml_text[:500].lower():
        return []
    projects = []
    for item in ET.fromstring(xml_text).iter("item"):
        link = (item.findtext("link") or "").strip()
        m = GALLERY_RE.search(link)
        if not m:
            continue
        desc_html = item.findtext("description") or ""
        img = re.search(r"<img[^>]+src=['\"]([^'\"]+)", desc_html)
        text = html.unescape(re.sub(r"<[^>]+>", " ", desc_html))
        published = None
        if item.findtext("pubDate"):
            try:
                published = parsedate_to_datetime(item.findtext("pubDate")).date().isoformat()
            except (TypeError, ValueError):
                pass
        projects.append({
            "id": m.group(1),
            "url": f"https://www.behance.net/gallery/{m.group(1)}/{m.group(2)}",
            "title": html.unescape((item.findtext("title") or "").strip()),
            "description": " ".join(text.split()),
            "cover_src": img.group(1) if img else None,
            "published": published,
        })
    return projects


def from_profile_html():
    page = fetch(f"https://www.behance.net/{USERNAME}/projects") or fetch(f"https://www.behance.net/{USERNAME}")
    if not page:
        return []
    seen, projects = set(), []
    for m in GALLERY_RE.finditer(page):
        if m.group(1) in seen:
            continue
        seen.add(m.group(1))
        projects.append({
            "id": m.group(1),
            "url": f"https://www.behance.net/gallery/{m.group(1)}/{m.group(2)}",
            "title": m.group(2).replace("-", " "),
            "description": "",
            "cover_src": None,
            "published": None,
        })
    return projects


def meta(page, prop):
    for pattern in (
        rf'<meta[^>]+property=["\']{prop}["\'][^>]+content=["\']([^"\']*)',
        rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+property=["\']{prop}["\']',
    ):
        m = re.search(pattern, page)
        if m:
            return html.unescape(m.group(1)).strip()
    return None


_enrich_blocked = False


def enrich(project):
    global _enrich_blocked
    if _enrich_blocked:
        return
    page = fetch(project["url"], retries=1)
    if not page:
        _enrich_blocked = True
        return
    title = meta(page, "og:title")
    if title:
        project["title"] = re.sub(r"\s+(on|::)\s+Behance\s*$", "", title).strip()
    desc = meta(page, "og:description")
    if desc and not project["description"]:
        project["description"] = desc
    image = meta(page, "og:image")
    if image:
        project["cover_src"] = image


def clean_title(title):
    # The feed turns em dashes into " ? "
    return re.sub(r"\s\?\s", " — ", title).strip()


def clean_description(text):
    # "Project Name: X Project Type: Y Objective: Z" -> "Z"
    m = re.match(r"\s*Project Name:.*?Objective:\s*(.+)", text, re.S)
    return (m.group(1) if m else text).strip()


def save_cover(project):
    src = project.pop("cover_src", None)
    project["cover"] = None
    if not src:
        return
    ext = os.path.splitext(src.split("?")[0])[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
        ext = ".jpg"
    data = None
    if "/projects/404/" in src:
        data = fetch(src.replace("/projects/404/", "/projects/808/"), binary=True, retries=1)
    data = data or fetch(src, binary=True)
    if not data:
        return
    for old in os.listdir(COVER_DIR):
        if os.path.splitext(old)[0] == project["id"]:
            os.remove(os.path.join(COVER_DIR, old))
    path = os.path.join(COVER_DIR, project["id"] + ext)
    with open(path, "wb") as f:
        f.write(data)
    project["cover"] = f"assets/img/behance/{project['id']}{ext}"


def main():
    projects = from_rss()
    source = "rss"
    if not projects:
        projects = from_profile_html()
        source = "profile"
    print(f"Found {len(projects)} projects via {source}")
    if not projects:
        print("No projects found; leaving existing data untouched.", file=sys.stderr)
        return 1

    os.makedirs(COVER_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    for p in projects:
        enrich(p)
        save_cover(p)
        p["title"] = clean_title(p["title"])
        p["description"] = clean_description(p["description"])[:400]
        print(f"  {p['id']}  {p['title']}  cover={'yes' if p['cover'] else 'no'}")
        time.sleep(1)

    known = {p["id"] for p in projects}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, encoding="utf-8") as f:
            previous = json.load(f).get("projects", [])
        projects += [p for p in previous if p["id"] not in known]
    projects.sort(key=lambda p: p.get("published") or "", reverse=True)

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"username": USERNAME, "source": source, "projects": projects}, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
