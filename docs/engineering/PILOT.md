# Clean Pilot runbook

This Next.js app talks to the Pilot Supabase project. Local and Vercel use that same database. Seats below work in both places.

Repository: https://github.com/StrategyandDesign/fathers-com-clean-pilot
Branch: `review`
Host: https://rootmandate.com
Vercel project: `fathers-com-pilot`

`fathers-com-platform` and `submit/2` are prior lines. `review` is current.

## Local

```bash
git clone https://github.com/StrategyandDesign/fathers-com-clean-pilot.git
cd fathers-com-clean-pilot
git checkout review
cp .env.example .env.local
# NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 is already in .env.example
npm install
npm run dev
```

http://127.0.0.1:3000/login

Supabase keys in `.env.local` may stay blank. The app uses the Pilot project, the same database as the hosted site.

Optional desk flags live in `.env.local`. `desk_consider_next_v1` stays off until ranking is trustworthy. To show Consider next on `/manager`, set `DESK_CONSIDER_NEXT_V1=1`. Leave it unset to keep the prior dashboard. `/manager` always shows Review cadence from the same Companion, roster, and review-queue data. Open items are men mid-work. Pending actions are reviews and certificates waiting on the Leader. Certificates ready are the certificate subset. `npm run dev` keeps the Desktop clone on `review` and reloads the tab. The Shared badge stays at Shared 1-1.101 until the next desk push, which will tick 1.127. Local commits on `review` tick through `scripts/git-hooks/pre-commit` (`cp scripts/git-hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`). GitHub squash merges do not run that hook; after those merges stamp on `review` with `node scripts/shared-revision.mjs --stamp`. Father Home picks up a new leader update without a reload. The dashboard skips avatar signing and answer-bearing columns so the cold open stays lean. `leader_assessment_answers` stays off so Leaders see custom assessment completion only. Super-admin can turn it on per organization. To unlock answers for every org from the platform, set `LEADER_ASSESSMENT_ANSWERS=1`. `fidelity_board_enabled` stays off. To show the living fidelity checklist and Certified Facilitator registry, set `FIDELITY_BOARD_ENABLED=1`. Leave it unset to keep the prior desk. `sso_enabled` stays off per organization. Super-admin turns it on under Identity. Leave it off so login stays email and password. `secure_export_enabled` stays off. Leaders can still download a quality improvement packet from Reports. Set `SECURE_EXPORT_ENABLED=1` only to show destination metadata and the confirm-first send stub. This desk does not send files to an outside host. `vertical_pack_armed_forces` stays off. Super-admin can still open `/admin/verticals/armed-forces`. Set `VERTICAL_PACK_ARMED_FORCES=1` only to show the event closeout preset on Reports. This does not flip `SHOW_MILITARY`. `vertical_pack_optimization` stays off. Super-admin can still open `/admin/verticals/optimization`. Set `VERTICAL_PACK_OPTIMIZATION=1` only to apply the bonded-group copy skin and commitment board on Performance Optimization Group desks. Rehab organizations never receive this pack.

## Hosted

| URL | What it is |
|---|---|
| https://rootmandate.com | Live Pilot. Vercel project `fathers-com-pilot`. |
| https://fathers-com-pilot.vercel.app | Same project. |
| https://fathers-com-platform.vercel.app | A different app. |

Same seats and password work on localhost and on the live Pilot URL. Use separate browser profiles when more than one role is signed in.

### Shared pilot password

**`12345`** for every seat in the tables below. Weak on purpose. Pilot only. Not production.

These shared audit passwords are for the Pilot Supabase project and local review seats only. Do not treat `12345` as a production password policy. Do not copy these seats or this password into a production stack. Production must use unique passwords, leaked-password protection, and (where Super-admin turns it on) organization single sign-on for staff. See `docs/engineering/trust-pack/` for the dated questionnaire.

### Returning Home NWA (English)

Invite code for new fathers: `12345`

| Email | Role | Lands on |
|---|---|---|
| `father@nwa` | Father | `/father` |
| `father2@nwa` | Father | `/father` |
| `manager@nwa` | Leader (Brenda) | `/manager` |
| `reviewer@nwa` | Reviewer, scoped to NWA | `/reviewer` |

### Hebrew Pilot Group (Hebrew)

Invite code: `il`. Same `@il` seats as before. The group name is neutral.
`groups.locale` must stay `'he'` so Account language and RTL stay org-gated.

| Email | Role | Lands on |
|---|---|---|
| `father1@il` | Father | `/father` |
| `father2@il` | Father | `/father` |
| `manager@il` | Leader | `/manager` |
| `reviewer@il` | Reviewer, scoped to Hebrew Pilot Group | `/reviewer` |

### Super-admin

| Email | Role | Lands on |
|---|---|---|
| `admin@fathers` | Super-admin | `/admin` |

Sign out and sign in once if a role looks wrong (JWT refresh). Use three browsers or profiles so cookies do not collide.

Re-run `supabase/sql/seed_returning_home_nwa.sql` or `supabase/sql/seed_unit_8200.sql` in the Pilot SQL editor if a seat loses its organization. Re-run `supabase/sql/pilot_hygiene_issue_17.sql` if Test Training, the test desk note, or the old military-unit org name comes back.

## Current hosts

Use this table. Do not guess from project names.

| Host | What it serves | Use for this Pilot? |
|---|---|---|
| Isolated repo `fathers-com-clean-pilot` (`review`) | Source of the Next.js Pilot app | Yes. Clone this and check out `review`. |
| https://rootmandate.com | Live Pilot. Vercel project `fathers-com-pilot`. | Yes. This is the live site. |
| https://fathers-com-pilot.vercel.app | Same Vercel project if the custom domain is down. | Yes, as a fallback. |
| https://fathers-com-platform.vercel.app | A different app. | No. Do not use it. |
| Supabase `koeplcybddrvbliuepsy` (name: **Pilot**) | Auth + Postgres + Storage for the Next.js app | Yes |
| Supabase `kemqpiboqeqhbuuldmls` (name: fathers-com-platform) | **INACTIVE** | No |

Clone `fathers-com-clean-pilot` and check out `review`. Do not check out `submit/2` for daily work.

## 1. Create a Manager

Signup (`/signup`) is for fathers and requires an invite code. The first Manager cannot use that form.

### In the Supabase dashboard

1. Open the **Pilot** project (not production).
2. **Authentication → Users → Add user**
   - Email and password
   - Auto-confirm the email
3. **SQL Editor** → paste `supabase/sql/promote_pilot_role.sql`
   - Change `manager@example.com` to that email
   - Run
4. Sign in at `/login`, then **sign out and sign in once** so the JWT picks up `role: manager`.

The script sets both places the app reads:

| Store | Used for |
|---|---|
| `auth.users.raw_app_meta_data.role` | Middleware and page routing |
| `public.profiles.role` | RLS (`current_user_role()`) |

Dashboard-only alternative for step 3: open the user → **App Metadata** → `{ "role": "manager" }`, then in SQL:

```sql
update public.profiles
set role = 'manager'
where id = (select id from auth.users where email = 'manager@example.com');
```

A Reviewer is the same flow with the Reviewer block at the bottom of the SQL file.

## 2. Invite code

After the Manager script runs, it creates **Pilot Group** if none exists and prints the code.

**From the app:** sign in as Manager → `/manager` → **Group invite code** → Copy. If no group exists, name it and click **Create group**.

**From SQL:**

```sql
select name, invite_code
from public.groups
order by created_at;
```

Fathers enter that code on `/signup`.

For local testing, turn off **Authentication → Providers → Email → Confirm email** on the Pilot project so signup creates a session immediately.

## 3. Manual test checklist

Use three browsers or three profiles (Manager, Father, Reviewer).

### Manager
- [ ] Sign in at `/login` → lands on `/manager`
- [ ] Summary cards render (zeros are fine)
- [ ] Invite code is visible and Copy works
- [ ] `/manager/participants` is empty until a father joins

### Father join
- [ ] `/signup` with the invite code, email, password
- [ ] Lands on `/father`
- [ ] Manager → Participants shows the new father
- [ ] Bad invite code is rejected

### Father sessions
- [ ] Home shows **Continue Training** and the three trainings
- [ ] Open a session → YouTube placeholder plays
- [ ] **I watched this** → Check-in (3 questions) → Action
- [ ] **I’ll do this later** returns home; session is not complete
- [ ] **I completed this Action** → session counts as done
- [ ] Continue card moves to the next incomplete session

### Father Profile
- [ ] **Start Profile** → Question 1 of 128
- [ ] **Save & Exit** → Home shows in-progress
- [ ] **Continue Profile** resumes the next unanswered question
- [ ] Submit the last question → `/father/profile/results` shows Primary Edge and Determination
- [ ] Manager participant detail shows the same Edge / Determination (no raw answers required)

### Manager actions
- [ ] Assign a training
- [ ] Mark a training complete
- [ ] Send Certificate → serial appears (no PDF yet)
- [ ] Needs Attention updates

### Reviewer
- [ ] Sign in as Reviewer → `/reviewer`
- [ ] Sees totals only and the line **All data is anonymized and aggregated.**
- [ ] No names, emails, or participant links
- [ ] `/manager` and `/father` redirect away

### Locked doors
- [ ] Signed-out `/father`, `/manager`, `/reviewer` → `/login`
- [ ] Father cannot open `/manager` or `/reviewer`

## 4. Deploy to a **new** Vercel project

Do **not** change the existing production Vercel project (`fathers-com-platform.vercel.app` / the static HTML site). Do **not** point that project at `clean-pilot`. Do **not** attach `fathers.com` or the current production domain to this app.

### Create the project

1. [vercel.com/new](https://vercel.com/new) → **Add New Project**
2. Import this GitHub repo
3. Settings:
   - **Project name:** `fathers-com-pilot` (or similar — not the production project name)
   - **Branch:** `clean-pilot` only
   - **Framework Preset:** Next.js
   - **Build command:** `npm run build`
   - **Install command:** `npm install`
4. Environment variables (Pilot Supabase, not production):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Pilot project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pilot publishable/anon key |
   | `NEXT_PUBLIC_SITE_URL` | `https://fathers-com-pilot.vercel.app` (or your new subdomain) |

5. Deploy. After the first URL exists, set `NEXT_PUBLIC_SITE_URL` to that URL and redeploy if needed.

### Supabase Auth allow-list

In the **Pilot** project: **Authentication → URL Configuration**

- Site URL: the new Vercel URL
- Redirect URLs: `http://localhost:3000/**` and `https://<your-pilot-host>/**`

### Custom subdomain (optional)

In the **new** Vercel project only: **Settings → Domains** → add something like `pilot.fathers.com`. Leave production domains on the old project.

### Local

```bash
npm install
# .env.local already points at the Pilot Supabase project
npm run dev
```

Open http://127.0.0.1:3000/login
