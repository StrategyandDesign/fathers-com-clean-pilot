# Security questionnaire pack

Badge Shared 1-1.115. Not Shared 2.

Dated hospital information-technology pack. Pack version 1. Last reviewed 2026-08-23.

This product is not System and Organization Controls Type 2 certified. This product is not HITRUST Common Security Framework certified. No such report is in this repository.

Shared audit passwords, including 12345 on Pilot seats, are for the Pilot project only. They are not a production control.

## Files

| File | Use |
|---|---|
| [SECURITY-QUESTIONNAIRE.md](SECURITY-QUESTIONNAIRE.md) | Printable questions and answers |
| [answers.csv](answers.csv) | Spreadsheet-friendly copy of the same answers |
| [scans/README.md](scans/README.md) | Last scan summary placeholder. None on file. |

Source of truth for the answers is `lib/trust/questionnaire.ts`. Super-admin opens `/admin/trust` for the version and last review date, then downloads the same files.

## Evidence pointers

- Architecture and data map: counsel pack education-only memo (Issue 1), plus `docs/product/QUALITY-IMPROVEMENT-FIELDS.md`
- Single sign-on: `docs/product/SINGLE-SIGN-ON.md`
- Business Associate Agreement drafts: `docs/product/COUNSEL-PACK.md`
- Last scan: [scans/README.md](scans/README.md)

## What this pack does not claim

Do not read a certification, a penetration-test result, or a production password policy out of Pilot seats.
