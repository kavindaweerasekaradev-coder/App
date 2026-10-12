# Velora — Design notes

This document records the information architecture, design system and interaction decisions behind the prototype. The decisions come from the product goals in the brief and common EV-app conventions; none of them have been tested with users yet.

## 1. Information architecture

```
Onboarding (first run only)
 ├─ Welcome
 ├─ 1. Your vehicle ............ name, model, colour, registration, current battery
 ├─ 2. Charging preferences .... charge target, arrival reserve, fast-charge preference, home tariff & time
 └─ 3. Location ................ sample location or chosen city

App shell — 5 primary destinations
 ├─ Home ....................... vehicle overview, battery & range, charging status,
 │                               Find charging / Plan a journey CTAs, nearby chargers, recent activity
 ├─ Charge (Explorer) .......... simulated map ⇄ list, search, quick filters, filter sheet
 │   └─ Station details ........ connectors & compatibility, cost estimate, amenities, details
 │        ├─ Navigate → Journey (destination prefilled)
 │        └─ Start charging → Charging session
 ├─ Journey .................... from/to, departure battery → route summary, battery profile,
 │                               itinerary with charging stops, arrival estimate
 ├─ Insights ................... KPIs, consumption chart, monthly spend, derived insights, history
 └─ Profile .................... vehicle, charging prefs, location, saved stations,
                                 notifications, theme, prototype tools
Charging session (contextual: from station details, Home, or the side-rail chip)
```

**Why these five tabs:** each one maps to a product goal. Home and Journey address range anxiety, Charge addresses station discovery, Insights addresses cost visibility, and Profile holds the preferences that tailor every estimate. The charging session is contextual rather than a tab, because it exists only while a session is running. While a session runs it stays reachable from the Home status card and the desktop side rail.

## 2. Design system

### Colour tokens (`src/index.css`)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#FAF8F3` warm white | `#121413` deep charcoal | page background |
| `surface` / `surface-2` | `#FFFFFF` / `#F3F0E9` | `#1B1E1C` / `#242825` | cards / subtle fills |
| `ink` / `ink-2` / `ink-3` | `#161A17` / `#525A55` / `#6C736E` | `#EDEEEA` / `#ACB2AD` / `#8A918C` | text hierarchy |
| `primary` | `#1E4D3B` forest green | `#2F6B52` | primary actions, selected states |
| `primary-ink` | `#1E4D3B` | `#96D6B4` | green text & icons (stays legible in dark mode) |
| `accent` | `#C8F24A` electric lime | same | **fill only**: active nav, charging, selected markers |
| `success` / `warning` / `danger` | — | — | availability, low battery, destructive actions |

Rules:
- Lime is a restrained accent. It never appears as text on light surfaces (it would fail contrast) and is always paired with `accent-fg` (`#182608`, about 13:1).
- Secondary and tertiary text meet WCAG AA on the background (`ink-3` is about 4.7:1 in light mode and 5.2:1 in dark).
- Gradients are limited to subtle chart fills and the car paint. There is no glassmorphism beyond the translucent sticky headers.

### Typography

Manrope Variable, with a restrained scale so screens stay usable on 360 px phones:

| Style | Size / line | Use |
| --- | --- | --- |
| `caption` | 12 / 16 | meta, disclaimers |
| `small` | 13 / 18 | secondary text, labels |
| `body` | 15 / 22 | default |
| `title` | 17 / 24 | card and section titles |
| `headline` | 22 / 28 | page titles, key values |
| `metric` | 40 / 44 | the single hero number (battery %) |

Numbers use tabular figures (`.tabular`) so values don't jitter while a session updates.

### Shape, spacing, elevation

- Radii: 10 px (inputs), 14 px (rows), 20 px (cards), 24 px (hero cards). Buttons and chips are fully rounded pills, echoing the floating nav bar.
- 4 px spacing grid. Page gutters are 16 px on phones and 24 px from `sm` up.
- Two shadows only: `card` (resting) and `float` (sheets, map markers, nav).
- Icons are Lucide line icons at 1.8–2 stroke, sized 16/18/20 px.

### Components

`Button` (primary · secondary · ghost · accent · danger; sm/md/lg), `IconButton`, `Card`, `Badge`, `Chip`, `Segmented`, `Switch`, `Slider`, `TextField`, `SelectField`, `LocationInput` (ARIA combobox), `Sheet` (bottom sheet on phones, dialog on larger screens, with focus trap), `ProgressBar`, `Skeleton`, `EmptyState`, `ErrorState`, `Notice`, `StationCard`, `AvailabilityBadge`, `ConnectorTags`, `SimulatedMap`, `CarIllustration`.

## 3. Key UX decisions

- **Honest data labelling.** Everywhere availability appears it is marked "sample data, not live". The map is labelled "Simulated map · not for navigation", and every estimate is called an estimate.
- **Compatibility first.** The explorer filters to the user's connectors by default (the "Fits my …" chip). Incompatible connector types are struck through rather than hidden, so users still learn what a station offers.
- **Range anxiety.** Home pairs battery % with an estimated range, a target marker and the reserve. Journey plans keep the arrival reserve and show a battery-along-the-route chart, so it's clear where charge runs low.
- **Charging stops.** The planner picks the furthest reachable compatible DC charger near the route. At each stop it charges only as much as the next leg needs, capped at about 80–90% where DC charging slows down.
- **States.** Every data screen has loading skeletons, empty states with a recovery action, and error states with retry. Errors can be forced from Profile → *Simulate network errors*. An unknown station URL shows a "Station not found" state.
- **Responsive behaviour.** Phones get a floating bottom bar and a full-bleed map with a station preview card. From `md` the nav becomes a side rail. From `lg` the explorer becomes a list + map split view, and Home, Journey and Station details use two columns.
- **Accessibility.** Semantic landmarks and a skip link; visible focus rings; labelled controls; `role="switch"`, `radiogroup` and `combobox` patterns; keyboard pan and zoom on the map (arrows and +/−); polite live regions for result counts and charging progress; and support for `prefers-reduced-motion`.
