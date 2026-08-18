# Executive summary

**Line under review:** isolated repo `fathers-com-clean-pilot` (snapshot of `clean-pilot` `b950131` plus cleanup from `cursor/clean-pilot-handoff-audit-7c78`)  
**Date:** 18 August 2026  
**Verdict:** The Next.js clean-pilot app is a coherent signed-in product. It is **not** production-ready. Do not treat `fathers-com-platform` or its `main` branch as this review.

## Current state

The live product on this line is a Next.js 15 App Router app (`app/`). Four roles: father, manager (chrome: Leader), reviewer, admin. Core loop is Film → Check-in → Action. Auth is email/password via Supabase. RLS is on every public table the app uses.

Two public Vercel hosts both serve Next.js today (probed 18 Aug 2026):

- `fathers-com-pilot.vercel.app` — stale clean-pilot deploy (old login sentence).
- `fathers-com-platform.vercel.app` — `main` (current login sentence). Static HTML paths 404.

Reviewers must clone `fathers-com-clean-pilot` and run it locally (or a Vercel preview of **that** repo), not those two URLs.

Data is Pilot Supabase `koeplcybddrvbliuepsy`. The project named `fathers-com-platform` is **INACTIVE**.
