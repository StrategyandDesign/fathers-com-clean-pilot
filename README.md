# Fathers.com — clean-pilot (Next.js)

This branch is the **Next.js clean-pilot app**. It is not the older static HTML Fathers.com site, and it is not a production cutover of `fathers.com`.

| What | Where |
|---|---|
| Runbook | `PILOT.md` |
| App | `app/` — Next.js 15 App Router |
| Auth / data | Pilot Supabase project `koeplcybddrvbliuepsy` |
| Handoff for reviewers | `handoff/` |

```bash
npm install
# Copy .env.example to .env.local. Missing Supabase keys fall back to the Pilot project.
npm run dev
```

Open http://localhost:3000

- Lint: `npm run lint`
- Unit tests: `npx tsx --test tests/*.test.ts`
- Typecheck: `npx tsc --noEmit`

Root `*.html`, `assets/`, `build_*.py`, `content/`, and `tools/` are leftover static-site source. `.vercelignore` keeps them out of the Next.js deploy. `npm run dev` does not serve them.

Do **not** merge this branch to `main` unless a human explicitly decides that. `main` is a separate line.
