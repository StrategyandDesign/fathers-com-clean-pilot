# Handoff notes for the engineering team

## How to run locally

```bash
git clone https://github.com/StrategyandDesign/fathers-com-clean-pilot.git
cd fathers-com-clean-pilot
npm install
cp .env.example .env.local
# Optional: fill Pilot URL/keys. If left blank, lib/supabase/env.ts uses Pilot.
npm run dev
```

Open http://localhost:3000 → `/login`.

Local `supabase start` is **not** the default path. Prefer the hosted Pilot project.

Signup needs a group `invite_code`. First Leader/admin: `supabase/sql/promote_pilot_role.sql` on Pilot, then sign out and in so the JWT picks up `app_metadata.role`.

## Required vs optional env

See `.env.example` and `handoff/02-INVENTORY.md` §4.

Minimum to click through as a father/leader: Pilot URL + publishable key (or the committed fallback) + an existing seat.
