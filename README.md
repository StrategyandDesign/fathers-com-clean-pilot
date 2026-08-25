# Fathers.com Pilot

Work here.

- Repo: https://github.com/StrategyandDesign/fathers-com-clean-pilot
- Branch: `review`
- Live site: https://rootmandate.com

That is the only copy we judge. Do not use `fathers-com-platform`, `submit/2`, or https://fathers-com-platform.vercel.app for day-to-day work.

## How we work

Open a branch from `review`. Open a PR back into `review`. Merge when checks are green.

There is no second repo to keep in sync. An old script used to copy from `fathers-com-platform`. It is held. Ignore it.

The Shared 1-1.N number in the corner is a desk stamp on this same branch. It is not another repo and not another branch.

`submit/2` is a frozen snapshot from 19 Aug 2026. Daily work is not there.

## Run it

```bash
git clone https://github.com/StrategyandDesign/fathers-com-clean-pilot.git
cd fathers-com-clean-pilot
git checkout review
cp .env.example .env.local
npm install
npm run dev
```

Open http://127.0.0.1:3000/login

Leave the Supabase keys blank. Local uses the Pilot database.

Password for Pilot seats is `12345`. Super-admin is `admin@fathers`.

## What this app is

Next.js in `app/`, `components/`, `lib/`, and `supabase/`. Old static HTML lives in `archive/` and is not served.

Seats, flags, and schema notes: `docs/engineering/PILOT.md`.
