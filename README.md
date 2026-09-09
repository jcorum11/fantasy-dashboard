# Player Points Explorer

A **Next.js 14 + TypeScript** app for seeing how MLB players' fantasy points are
distributed across a season. The home page ranks every player with a
regular-season appearance by total Yahoo points, with search. A player's page
shows their week-by-week points for the current season, and a button for every
season of their career.

All data comes live from the public [MLB Stats API](https://statsapi.mlb.com):
no database, no cron, no API keys.

---

## ✨ Features

| Area | Highlights |
| ---- | ---------- |
| Player list | Every player with a regular-season stat line, ranked by Yahoo points. Search by name, team, or position. |
| Player page | Monday–Sunday weekly points bar chart, total / average / best week, a table view, and one button per career season. |
| Scoring | Yahoo default H2H points scoring (see `lib/mlb/points.ts`). Two-way players get hitting and pitching combined. |
| Data | Fetched from the MLB Stats API on demand and cached with Next's fetch cache: finished seasons for a week, the current season for an hour. |
| Deploy | Zero-config Vercel deployment. |

---

## 🏗 Tech Stack

| Layer | Library / Service |
| ----- | ----------------- |
| Framework | Next.js 14 `app/` router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Charts | [Recharts](https://recharts.org) |
| Data | MLB Stats API via `fetch` |
| Tests | Vitest + Testing Library |
| Tooling | ESLint, pnpm |

---

## ⚡ Quick Start

```bash
git clone https://github.com/jcorum11/fantasy-dashboard.git
cd fantasy-dashboard && pnpm install
pnpm dev
```

No environment variables are required.

```bash
pnpm test         # unit + component tests
pnpm lint
pnpm build
```

---

## 🧭 Layout

```
app/                      Next.js routes (home, /players/[id], /api/players/...)
lib/mlb/points.ts         Yahoo scoring
src/domain/               Models and the IMLBClient interface
src/application/          PlayerPointsService, week bucketing
src/infrastructure/mlb/   MLBClient (Stats API gateway) and stat mappers
src/presentation/         React components and API param helpers
```

### API

| Route | Returns |
| ----- | ------- |
| `GET /api/players[?season=YYYY]` | Ranked player list for the current (or given) season |
| `GET /api/players/:id/seasons` | Seasons the player has regular-season stats in |
| `GET /api/players/:id/seasons/:year` | Weekly points for one regular season |

---

## ☕ Support

If this saves you some roster-tinkering time, consider buying me a coffee:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-%E2%98%95-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/jcorum)

---

## 🕰 Previous incarnation (fantasy tools)

Before becoming a player points explorer, this repo was a set of fantasy tools
(pitcher streaming comparison, weekly points, replacement level, Neon-backed
daily ingest). That version is preserved in git history:

| | |
| --- | --- |
| Last commit | `8018a54` |
| Tag | `v1-fantasy-tools` |

```bash
# Browse the old app
git checkout v1-fantasy-tools

# Restore a single file from it
git checkout v1-fantasy-tools -- path/to/file

# Bring the whole old app back on a new branch
git checkout -b restore-fantasy-tools v1-fantasy-tools
```
