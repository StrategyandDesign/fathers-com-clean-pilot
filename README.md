# Fathers.com — clean-pilot (Next.js)

This repository is the **Next.js clean-pilot app** for review and hardening. It is not the older static HTML Fathers.com site, and it is not a production cutover of `fathers.com`.

Official copies are even-numbered and date-stamped. See `SUBMITS.md`. The first official stamp is **Submit 2** (19 Aug 2026) on frozen branch `submit/2`. `review` is the moving draft.

| What | Where |
|---|---|
| Official submit record | `SUBMITS.md` |
| Frozen copy to review | branch `submit/2` |
| Runbook | `PILOT.md` |
| App | `app/` — Next.js 15 App Router |
| Auth / data | Pilot Supabase project `koeplcybddrvbliuepsy` |
| Handoff for reviewers | `handoff/` |

```bash
git clone https://github.com/StrategyandDesign/fathers-com-clean-pilot.git
cd fathers-com-clean-pilot
git checkout submit/2
npm install
# Copy .env.example to .env.local. Missing Supabase keys fall back to the Pilot project.
npm run dev
```

Open http://localhost:3000/login

Pilot seats (password `12345` on local and Vercel): `father@nwa`, `manager@nwa`, `reviewer@nwa`, plus the Unit 8200 `*@il` seats and `admin@fathers`. See `PILOT.md`.

- Lint: `npm run lint`
- Unit tests: `npx tsx --test tests/*.test.ts`
- Typecheck: `npx tsc --noEmit`

Start here: `handoff/00-SUBMISSION-GUIDE.md`

This repo is the review line. https://fathers-com-platform.vercel.app is current `main` with the same Pilot seats. It is not the Submit 2 tree.
