# Purrly — 3D cat hero

![Hero preview](docs/hero-preview.png)

A landing-page hero for a cat food brand: a crowd of soft, toy-like 3D cats
(built with [three.js](https://threejs.org)) peeking up under the headline.

- Cats pop up on load, breathe, blink, twitch their ears and wave their paws
- Every cat follows your cursor with its head and eyes
- Click ("pet") a cat to make it hop and send up hearts
- Responsive: fits the whole crowd on desktop, focuses the middle cats on phones
- Respects `prefers-reduced-motion` and pauses rendering when off-screen

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Where things live

| File | What it does |
| --- | --- |
| `index.html` | Nav, headline, buttons and the `#cat-stage` container |
| `src/style.css` | Layout, buttons, mobile menu, heart animation |
| `src/cats.js` | The 3D scene: cat builder, crowd config and animation loop |

### Customising the cats

Each cat is one entry in the `CROWD` array in `src/cats.js`:

```js
{ at: [0.1, -1.45, 1.8], s: 1.45, fur: '#f7923a', stripes: '#c9581c',
  pattern: 'tabby', iris: '#4fae64', glasses: '#ff6fa8', mouth: 'open', collar: '#ffffff' }
```

Options: `fur`, `cream` (muzzle/chest), `stripes`, `pattern` (`'tabby'` | `'calico'`),
`mask` (Siamese face), `iris`, `whiskers`, `mouth: 'open'`, and accessories
`glasses`, `collar`, `bow`, `cap` (each takes a colour) and `paw` (`-1` / `1` raises a paw).
