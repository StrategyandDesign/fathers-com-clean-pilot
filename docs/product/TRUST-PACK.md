# Security questionnaire pack

Quiet Super-admin surface for a dated hospital information-technology questionnaire. Badge Shared 1-1.115. Not Shared 2.

## Where it lives

Super-admin opens Account, then the collapsed Security questionnaire link, then `/admin/trust`. Downloads reuse `/api/trust/pack/[slug]`.

There is no new ribbon item and no marketing trust wall on father surfaces. Leaders keep the existing Account trust strip from Issue 16. They do not get this pack page.

## What it shows

1. Pack version and last review date.
2. Honest certification status: not System and Organization Controls Type 2 certified, not HITRUST Common Security Framework certified, no such report in the repository.
3. Pilot password scope: shared audit passwords such as 12345 are Pilot only.
4. Downloads of the printable questionnaire, spreadsheet answers, evidence pointers, and the empty last-scan placeholder.

## Roadmap

A System and Organization Controls Type 2 or HITRUST Common Security Framework engagement has not started as of 23 August 2026. The pack records that fact. Do not treat the Super-admin page as a certification.

## Source files

`docs/engineering/trust-pack/` and `lib/trust/questionnaire.ts`.
