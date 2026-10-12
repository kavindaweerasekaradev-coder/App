# Velora — Electric Vehicle Companion App

_Every journey, intelligently powered._

Velora is a mobile-first EV companion prototype. It shows battery and range at a glance, finds compatible charging stations, plans journeys with charging stops, simulates charging sessions and summarises energy use and costs.

> **Prototype notice.** All vehicles, charging networks, stations, prices and availability are **fictional sample data**. Velora does not connect to real vehicles, chargers or charging networks, and the map is a **simulated map**, not a navigation map. Ranges, durations and costs are estimates.

## Running the project

Requirements: Node.js 18+ (tested with Node 22) and npm.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
npm run build      # type-check and build for production into dist/
npm run preview    # serve the production build locally
npm run typecheck  # TypeScript only
npm run format     # Prettier
```

The app uses hash-based routing and a relative base path, so `dist/` can be served from any static host or sub-folder.

### Trying it out

1. Go through onboarding: vehicle, charging preferences and location. Each form validates its fields — try submitting empty fields or a bad registration such as `bad plate`.
2. **Home** shows battery, estimated range, charging status, nearby chargers and recent activity.
3. **Charge** has a simulated map and a list view. Search (e.g. `kandy`), toggle the filter chips, or open **Filters** for connector, power and sort options. Tap a marker or card to open the station.
4. **Station details**: tap a compatible connector to update the cost estimate. **Navigate** opens the journey planner; **Start charging** runs a simulated session.
5. **Journey**: pick a destination (e.g. Jaffna, Galle, Nuwara Eliya) and adjust the departure battery to see stops and arrival charge change.
6. **Profile**: edit the vehicle and preferences, manage saved stations, switch theme, and turn on **Simulate network errors** to review error and retry states.

## Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 18 + TypeScript (strict) |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 driven by CSS-variable design tokens (light and dark) |
| Icons | Lucide (`lucide-react`) |
| Charts | Recharts (lazy-loaded with the screens that use it) |
| Routing | React Router 6 (`HashRouter`) |
| Font | Manrope Variable via `@fontsource-variable/manrope` (self-hosted, works offline) |
| Map | Custom SVG **simulated map** (no tiles or API keys) |

State is kept in a React context and persisted to `localStorage`. Every storage access is wrapped so the app still works in private mode.

## Project structure

```
src/
  App.tsx                 routes, onboarding guard, lazy screens
  index.css               design tokens (light/dark), base styles
  state/AppState.tsx      app state, persistence, theme, charging-session simulator
  data/                   fictional sample data: vehicles, stations, places, history, map geometry
  lib/
    charging.ts           range, charging curve and cost estimates, station helpers
    journey.ts            journey planner (charging-stop selection)
    roads.ts              small road graph + shortest-time routing for the simulated map
    geo.ts, format.ts     distance/projection maths and unit formatting
    useSimulatedRequest   fake latency + error injection for loading/error states
  components/
    ui/                   Button, IconButton, Card, Badge, Chip, Segmented, Switch, Slider,
                          TextField, SelectField, Sheet, ProgressBar, Skeleton, Empty/Error states
    layout/AppShell.tsx   bottom nav (phone), side rail (tablet/desktop), page header
    map/SimulatedMap.tsx  pan/zoom/pinch/keyboard map with markers, labels and routes
    station/              station card, availability and connector badges
    vehicle/              vehicle illustration (SVG)
    forms/                vehicle form, charging-preferences form, location combobox
  screens/                Onboarding, Home, Explore, StationDetails, Journey,
                          ChargingSession, Insights, Profile, NotFound
docs/DESIGN.md            information architecture, design system and UX notes
```

## Known limitations

- The map is a hand-simplified, illustrative drawing of Sri Lanka's coastline and main roads. Station positions are approximate.
- Journey routing runs over a coarse highway graph. It ignores traffic, elevation, weather and turn restrictions.
- Charging sessions follow a simplified charging curve, and demo time runs faster than real time.
- Station availability is a static sample snapshot and never updates live.
- Location is a sample location (Colombo 03) or a city you pick; device GPS is not used.
- None of the design decisions have been validated with real users yet. Usability testing is a recommended next step.
