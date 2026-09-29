# tennis-tournament-system

A website to create and view local tennis tournaments, and to follow the current ATP and WTA draws.
It is built to be read at a glance: large legible type, a calm document-like design, and one round at a time on phones.

## What it does

- **Create a tournament** at `/new`. You get two codes:
  - an **organiser code** (e.g. `ABCD-EFGH`) that unlocks editing on any device;
  - a **draw code** (e.g. `K7Q2MX`) to share with players and spectators.
- **Organise** at `/t/<draw code>/manage`: add players, pick seeds, make the draw (seeds kept apart,
  byes go to the top seeds, everyone else random), mark matches as playing now, enter scores and
  tiebreaks, retirements and walkovers, and clear a result if it was entered by mistake.
- **Follow** a tournament at `/t/<draw code>`. The page refreshes itself every 30 seconds.
- **Pro tours** at `/pro`: ATP and WTA singles draws being played this week, with live scores.

## Running it locally

```bash
cp .env.example .env     # then edit the values
npm install
npm run db:migrate       # creates dev.db (SQLite)
npm run dev
```

### Environment

| Variable         | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`   | SQLite file, e.g. `file:./dev.db`                                       |
| `SESSION_SECRET` | Signs the organiser cookie. Required in production.                     |
| `API_TENNIS_KEY` | [api-tennis.com](https://api-tennis.com) key. Empty = sample pro draws. |

## How it's built

- Next.js 16 (App Router, server actions), Tailwind CSS v4, Prisma 7 with SQLite.
- `src/lib/bracket.ts`: draw placement, seeding and score rules (no database code).
- `src/app/actions.ts`: every change to a tournament; each checks the organiser cookie.
- `src/lib/pro/`: pro data. `api-tennis.ts` fetches fixtures (cached for 60 s for all visitors),
  `assemble.ts` rebuilds the draw tree from match results, and `demo.ts` provides sample draws.
- `src/components/DrawView.tsx`: the draw sheet shared by club and pro tournaments.

### Deploying

SQLite needs a persistent disk (a VPS, Fly.io, Railway…). For serverless hosts like Vercel, switch the
Prisma datasource to Postgres (for example Neon) and use the matching driver adapter in `src/lib/db.ts`.
