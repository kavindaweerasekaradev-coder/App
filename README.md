# Ledgr — personal finance dashboard (MVP)

A calm, clear personal finance dashboard: see your total balance, where the
money went this month, what came in, how your budgets and savings goals are
tracking, and log new transactions in seconds.

Built with React + TypeScript + Vite, set in **Plus Jakarta Sans**.

## Run it

Requires **Node.js 20.19+ or 22.12+** (LTS 22 recommended).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
```

### In VS Code

1. Open the project folder (`File → Open Folder…`).
2. Open a terminal (`` Ctrl+` ``) and run `npm install` once.
3. Press **F5** and pick **Run Ledgr (Chrome)** — it starts the dev server and
   opens the app with breakpoints working in your `.tsx` files.
   Or just run `npm run dev` in the terminal and Ctrl/Cmd-click the
   `http://localhost:5173` link.

## What's in the MVP

| Screen | What it does |
| --- | --- |
| **Overview** | Total balance across accounts (USD / EUR / LKR display, privacy toggle), top savings goal spotlight, spending by category (donut, month picker, auto insight), income this month with 6-month trend and source breakdown, recent transactions with a review queue for new/pending charges, 6-month cash-flow chart (with table view), budget health and accounts. |
| **Transactions** | Full ledger grouped by day — search, filter by direction / category / month, delete. |
| **Budgets** | Monthly budget per category with status (on track / near limit / over), daily allowance left, inline limit editing. |
| **Goals** | Savings goals with progress, on-track status, monthly amount needed, add money, create and delete goals. |

Add transactions from anywhere (top-bar **Add**). Everything recalculates
live and is saved to `localStorage`; **Reset demo** in the footer restores the
seeded data.

## Design notes

- **Tokens first.** All colour lives in `src/styles/tokens.css` as roles, with a
  hand-tuned dark theme (follows the OS, toggle in the top bar).
- **Brand.** Lime (`--brand`) for the one moment of celebration (the goal
  spotlight, active nav, primary FAB) and deep green for primary actions.
- **Honest numbers.** The current month is compared with the previous month
  *up to the same day*, never a half month against a full one.
- **Accessible charts.** Category colours were validated for colour-vision
  deficiency in their fixed order in both themes; every chart has a legend,
  hover read-outs and a text alternative (the cash-flow chart has a table view).
  Status colours always come with an icon and a label.
- **Responsive.** 12-column grid on desktop, 6 on tablet, single column with a
  floating bottom tab bar on phones.

## Structure

```
src/
  data/       seed data + category definitions
  lib/        dates, money formatting, finance selectors, goal maths
  state/      store (reducer + persistence) and display prefs (currency, privacy)
  components/ dashboard cards, modals, shared UI
  pages/      Overview, Transactions, Budgets, Goals
  styles/     tokens.css (theme) + app.css
```
