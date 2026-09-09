# Fantasy Dashboard

A **Next.js 14 + TypeScript** web app that pulls daily MLB player data and visualizes how each performance translates into ESPN fantasy-baseball points. I built it for my own 7-team H2H league, but it can be adapted to other scoring systems.

[Live Demo →](https://fantasy-dashboard-phi.vercel.app)

[Video Demo →](https://www.loom.com/share/06fd3adc246d4eaa8d0170f01e1268d7)

---

## ✨ Features

| Area | Highlights |
| ---- | ---------- |
| Data Ingestion | Serverless Postgres (Neon) stores raw box-score dumps & computed fantasy points. |
| Visuals | Recharts-powered line / bar / scatter plots; virtualized lists for 1-day or multi-day views. |
| Roster Filters | Toggle between full MLB slate, my ESPN roster, or custom player watchlists. |
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

# 2 — Create .env.local
cp .env.example .env.local
# then fill in:
# DATABASE_URL=postgres://...
# NEXT_PUBLIC_API_URL=https://site-that-serves/mlb-json

# 3 — Set up the database (creates tables & seed indexes)
pnpm run migrate

# 4 — Run locally
pnpm dev

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
