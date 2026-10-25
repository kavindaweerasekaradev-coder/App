# Kavinda Weerasekara — UI/UX Portfolio

A clean, responsive personal portfolio site for Kavinda Weerasekara, Product / UI/UX Designer.
It's plain HTML, CSS and JS, so there's no build step.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Structure

```
index.html                     # Home page: hero, about, recent work, services, experience, contact
case-studies/                  # One page per on-site case study
assets/css/style.css           # Styles; design tokens (colors, radius, fonts) at the top
assets/js/main.js              # Mobile menu, scroll reveal, copy email
assets/img/kavinda.jpg         # Profile photo
assets/img/behance/            # Project covers imported from Behance
assets/data/behance-projects.json        # Projects imported from Behance
assets/docs/Kavinda-Weerasekara-CV.pdf   # Linked from the "Download CV" buttons
scripts/sync_behance.py        # Behance import, run by .github/workflows/behance-sync.yml
```

## Customising

- **Colors and fonts:** edit the variables in `:root` at the top of `style.css` (lime accent, sky-blue gradients, Inter).
- **Recent work:** the `#work` section shows six projects with covers from `assets/img/behance/`.
  To feature a different project, copy a card and use another entry from `assets/data/behance-projects.json`
  (its `cover`, `url`, title and description).

- **Caching:** the pages load `style.css?v=…` and `main.js?v=…`. After changing either file, bump the
  `v=` value in `index.html` and `case-studies/*.html` so browsers fetch the new version straight away.

## Behance sync

The **Sync Behance projects** GitHub Action reads the public RSS feed of
[behance.net/kavindalakmal](https://www.behance.net/kavindalakmal), downloads each project's cover and updates
`assets/data/behance-projects.json`. It runs daily, or on demand from the repo's **Actions** tab, and
commits any changes. Behance's feed only lists recent projects, so older ones are kept from earlier runs.

## Deploy to GitHub Pages

Repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and `/ (root)`.
The site will be live at `https://<username>.github.io/<repo>/`.
