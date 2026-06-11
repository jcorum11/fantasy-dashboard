# Fantasy Dashboard

A **Next.js 14 + TypeScript** web app that pulls daily MLB player data and visualizes how each performance translates into fantasy-baseball points. Bring your own league: connect any Yahoo Fantasy league to flag rostered vs. waiver-wire players, and adjust the scoring to match your league's settings.

[Live Demo →](https://fantasy-dashboard-phi.vercel.app)

[Video Demo →](https://www.loom.com/share/06fd3adc246d4eaa8d0170f01e1268d7)

---

## ✨ Features

| Area | Highlights |
| ---- | ---------- |
| Data Ingestion | Serverless Postgres (Neon) stores raw box-score dumps & computed fantasy points. |
| Visuals | Recharts-powered line / bar / scatter plots; virtualized lists for 1-day or multi-day views. |
| Roster Awareness | Connect a Yahoo Fantasy league to distinguish rostered players from waiver-wire pickups. |
| Pitcher Streaming | Daily streaming-pick ingestion from public resources, scored against actual results. |
| Mobile Ready | Tailwind CSS + Headless UI give a responsive, accessible UI out of the box. |
| Zero-Config Deploy | One-click Vercel deployment with Edge runtime support. |

---

## 🏗 Tech Stack

| Layer | Library / Service |
| ----- | ----------------- |
| Framework | Next.js 14 `app/` router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3, Headless UI components |
| Charts | [Recharts](https://recharts.org) |
| DB | Neon serverless Postgres |
| State / Data | React 18 Context + SWR-style fetchers |
| Tooling | ESLint 8, Prettier, pnpm |

---

## ⚡ Quick Start

```bash
# 1 — Clone and install deps
git clone https://github.com/jcorum11/fantasy-dashboard.git
cd fantasy-dashboard && pnpm install

# 2 — Create .env.local and fill in your values
cp .env.example .env.local

# 3 — Set up the database (idempotent — creates all tables)
pnpm run migrate

# 4 — Run locally
pnpm dev
```

## 🔧 Configuration

All configuration lives in environment variables — see [`.env.example`](.env.example) for the full annotated list.

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `DATABASE_URL` | yes | Postgres connection string (Neon or any Postgres). |
| `NEXT_PUBLIC_API_URL` | yes | Base URL the frontend uses to reach the API. |
| `YAHOO_CLIENT_ID` / `YAHOO_CLIENT_SECRET` / `YAHOO_REFRESH_TOKEN` | no | Yahoo Fantasy OAuth credentials — without them, roster flagging is skipped gracefully. |
| `YAHOO_LEAGUE_KEY` | no | Your league, as `{game_key}.l.{league_id}`. |
| `YAHOO_REDIRECT_URI` | no | The redirect URI registered with your Yahoo app. |

**Scoring:** point values live in `lib/mlb/points.ts` (`POINTS_SYSTEM`). Edit them there to match your league's scoring settings.

**Never commit secrets** — `.env*` files (except `.env.example`) are gitignored.
