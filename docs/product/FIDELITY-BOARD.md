# Fidelity board and Certified Facilitator registry

Quiet Desk surfaces for a living supervision checklist and a thin facilitator attestation list. Badge Shared 1-1.111. Not Shared 2.

## Where it lives

`fidelity_board_enabled` defaults off. Leave `FIDELITY_BOARD_ENABLED` unset to keep the prior desk. When on, Leaders open Account, then the collapsed Team link, or the quiet Dashboard card. Routes are `/manager/fidelity`, `/manager/fidelity/[cohortOrTrainingId]`, and `/manager/team/facilitators`.

There is no new ribbon item. The Participants roster is unchanged.

## Living checklist

Items come from `partner-kit/supervision-checklist.md`: session one, mid-cohort (session three), the final, and the credential decision. One run is stored per cohort, or per cohort training. Completing an item records who, when, and a short note.

This is education supervision. It is not a clinical chart and not a staff learning system.

## Certified Facilitator registry

Leaders attest In training, Certified, or Suspended. The exam can stay offline. `evidence_path` is a short note or path. This is attestation, not a clinical license.

## Quality Improvement packet hooks

`collectQiPacketSections` in `lib/fidelity/export.ts` returns a fidelity summary and a facilitator credential list. Downloads stay local. A person still confirms any outbound send. Issue 5 may consume the same hooks later.
