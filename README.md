# Fathers.com Pilot

Current line:

- https://github.com/StrategyandDesign/fathers-com-clean-pilot
- branch `review`
- https://rootmandate.com

`fathers-com-platform` and `submit/2` are prior lines. `review` is current.

## Local

```bash
git clone https://github.com/StrategyandDesign/fathers-com-clean-pilot.git
cd fathers-com-clean-pilot
git checkout review
cp .env.example .env.local
npm install
npm run dev
```

http://127.0.0.1:3000/login

Supabase keys in `.env.local` may stay blank. The app uses the Pilot project, the same database as the hosted site.

Pilot password: `12345`

| Seat | Role |
|---|---|
| `admin@fathers` | Super-admin |
| `manager@rehab` | Leader, Returning Home |
| `father1@rehab` | Father, Returning Home |

Use separate browser profiles when more than one role is signed in.

Additional seats, invite codes, flags, and schema notes: `docs/engineering/PILOT.md`.

## Changes

Branch from `review`. Open the PR into `review`.

Hosted deploys are CLI to the Vercel project `fathers-com-pilot`. GitHub merge does not publish the site.

Shared 1-1.N is a revision stamp on this branch. An earlier copy script from `fathers-com-platform` is held in `shared-source.json`.

App code is `app/`, `components/`, `lib/`, `supabase/`. Collaboration notes: `CONTRIBUTING.md`. Frozen snapshots: `SUBMITS.md`. Revision log: `SHARED.md`.
