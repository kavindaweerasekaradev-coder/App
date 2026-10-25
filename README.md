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
index.html                     # All page content and sections
assets/css/style.css           # Styles; design tokens (colors, radius, fonts) at the top
assets/js/main.js              # Mobile menu, scroll reveal, progress line, copy email
assets/img/kavinda.jpg         # Profile photo
assets/img/favicon.svg
assets/docs/Kavinda-Weerasekara-CV.pdf   # Linked from the "Download CV" buttons
```

## Customising

- **Colors and fonts:** edit the variables in `:root` at the top of `style.css` (lime accent, sky-blue gradients, Inter).
- **Projects:** each project in the `#work` section has a CSS mock preview. To use a real screenshot, swap the
  inner content of `.project__media` for `<img src="assets/img/projects/your-image.jpg" alt="...">`
  and point the "View case study" link at the Behance or Figma case study.

## Deploy to GitHub Pages

Repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and `/ (root)`.
The site will be live at `https://<username>.github.io/<repo>/`.
