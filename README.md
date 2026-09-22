# Apex Productivity

Local-first personal execution system: daily schedule, tasks, roadmaps, habits, focus sessions, and a few life-area guides. Works as a guest in the browser; optional Supabase account syncs data across devices.

Built with React 19, TypeScript, Vite, IndexedDB, and optional [Supabase](https://supabase.com). Production deploys to [Cloudflare Pages](https://pages.cloudflare.com).

## Features

- **Today’s Engine** — scheduled day, overdue rollover, quick capture
- **Tasks & calendar** — priorities, recurrence, subtasks, undo delete
- **Roadmaps** — templates, milestones linked into daily tasks
- **Habits, focus/Pomodoro, settings, onboarding**
- **Guides** — learning, fitness, recipes/groceries, investment, location errands
- **Guest mode** — IndexedDB; sign-in migrates guest data to the account
- **PWA** — service worker registered in production builds
- **Theme** — dark/light persisted in `localStorage`

## Prerequisites

- Node.js 20+ (npm)
- Optional: a [Supabase](https://supabase.com) project for auth and cloud sync
- Optional: [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (included as a dev dependency) and a Cloudflare account to deploy

## Quick start

```bash
git clone https://github.com/jayanth-999/Task-Manager.git
cd Task-Manager
npm install
cp .env.example .env   # optional; skip for guest-only local use
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Without Supabase keys, the app uses a placeholder client and stays local. Dummy/demo placeholder keys are treated as unconfigured.

## Environment

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | For cloud sync | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For cloud sync | Public anon key (safe for the client; protect data with RLS) |

Vite only exposes variables prefixed with `VITE_`. Never put the Supabase **service role** key in this frontend.

For Cloudflare Pages, set the same two variables in the project’s environment settings so production builds can talk to Supabase.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck (`tsc -b`) then production bundle |
| `npm run test` | Vitest (service-layer tests) |
| `npm run lint` | Oxlint |
| `npm run preview` | Build, then `wrangler dev` against `dist` |
| `npm run deploy` | Build, then deploy `dist` to Cloudflare Pages (`task-manager`) |

## Supabase setup

1. Create a project and copy URL + anon key into `.env`.
2. Enable Email auth (or the providers you want).
3. Apply SQL in `supabase/migrations/` in order:
   - `00001_initial_schema.sql` — tables, RLS, triggers
   - `00002_schema_fixes.sql` — task/roadmap column fixes
   - `00003_subtasks_relationship.sql` — subtasks FK for PostgREST
4. Confirm Row Level Security is on; policies are written so users only see their own rows.

## Architecture

```
src/
  App.tsx              Hash-routed tabs, user/task/roadmap state
  components/          Views, header, sidebar, modals
  services/            IndexedDB + optional Supabase (tasks, habits, sync, auth)
  types/               Domain models
supabase/migrations/   Postgres schema and RLS
public/                PWA manifest and service worker
```

- **Local source of truth:** IndexedDB database `apex-productivity-db` via `src/services/syncEngine.ts`
- **Cloud:** when configured, changes queue and sync through Supabase; `isCloudConfigured` in `supabaseClient.ts` gates this
- **Routing:** URL hash (`#/today`, `#/tasks`, …)

## Deploy (Cloudflare Pages)

```bash
npm run deploy
```

This runs `wrangler pages deploy dist --project-name task-manager`. First-time deploy may need Cloudflare login (`npx wrangler login`) and a Pages project named `task-manager`. Output directory is `dist` (`wrangler.jsonc`).

## License

Private project (`"private": true` in `package.json`).
