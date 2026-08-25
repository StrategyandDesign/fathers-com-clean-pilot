# How we work

One repo. One working branch.

https://github.com/StrategyandDesign/fathers-com-clean-pilot
Branch: `review`

PRs go into `review`. Keep them small.

Eric owns `app/`, `lib/`, `supabase/`, and `tests/`.
Micah owns product notes and the live Pilot.

Do not edit `archive/static-site` to change the product.
Every database change is a new file in `supabase/migrations/`.
Roles stay `father` / `manager` / `reviewer` / `admin`.

`submit/2` is a frozen snapshot from 19 Aug 2026. Daily work is not there.
