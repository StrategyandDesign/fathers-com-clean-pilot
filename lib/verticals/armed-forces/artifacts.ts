import {
  comingHomePresentFraming,
  militaryApprovalRecordRule,
  recruitingLexiconLead,
  sponsorshipSeatsRule,
} from "@/lib/verticals/armed-forces/lexicon";
import {
  ARMED_FORCES_PACK_ARTIFACTS,
  type ArmedForcesPackSlug,
} from "@/lib/verticals/armed-forces/pack";

const DRAFT_BANNER = [
  "STATUS: DRAFT FOR COUNSEL AND CHANNEL REVIEW.",
  "This file is not an executed agreement and not a government approval.",
  "Fathers.com and the National Center for Fathering do not claim Military and Family Life Counseling approved or Building Strong and Ready Teams approved status.",
].join(" ");

function wrapDraft(title: string, body: string) {
  return [`# ${title}`, "", DRAFT_BANNER, "", body.trim(), ""].join("\n");
}

const BODIES: Record<ArmedForcesPackSlug, () => string> = {
  "content-inventory": () =>
    wrapDraft(
      "Armed Forces content inventory",
      `
## Purpose

A chaplain or unit channel can see what this product offers before any cohort starts. This is training material. It is not a clinical chart.

## Coming Home Present

${comingHomePresentFraming()}

Inventory for review:

- Coming Home Present session films and written session pages
- Facilitator notes and the triage-and-referral protocol from the partner kit
- Certificate of Completion (serial, issue date, issuer display name)
- Event closeout printable (attendance and completion aggregates)

## What this inventory does not include

- Clinical chart fields
- Diagnosis, medication, or counseling notes
- Armed-conflict imagery or a deployment-first story
- Rank VIP packages

## Lexicon

${recruitingLexiconLead()}

## Sponsorship

${sponsorshipSeatsRule()}

## Approvals

${militaryApprovalRecordRule()}
`
    ),

  "non-clinical-attestation": () =>
    wrapDraft(
      "Non-clinical attestation",
      `
## Attestation (unsigned)

The National Center for Fathering, offering fatherhood education as Fathers.com, attests that this Armed Forces and chaplain materials pack is education and training.

1. It does not diagnose, screen, treat, or provide therapy.
2. It does not keep a clinical chart.
3. Assessments stay educational self-report tools.
4. Certificates record completion of a Fathers.com training. They are not a clinical finding.
5. Event closeout records attendance and completion aggregates only. It does not record counseling content.

## Channel note

Chaplain confidentiality is the stigma solution named in the military readiness spec. Nothing in this product routes through behavioral health.

## Signatures

Left blank on purpose. A download, a checklist view, or a flag flip is not a signature.
`
    ),

  "title-10-usc-1789-note": () =>
    wrapDraft(
      "Title 10 United States Code section 1789 cost-category note",
      `
## What this note is

A fit note for counsel and a unit resource manager. Title 10 United States Code section 1789 authorizes family support programs. Training materials can sit in that cost conversation.

This page is not a claim that funds are available. It is not a claim that this product is an approved family support program. This product is not Military and Family Life Counseling approved. This product is not Building Strong and Ready Teams approved. This page is not permission to bill counseling or therapy.

## Cost-category fit

If a unit or chaplain office already buys training materials under a family support line, this inventory (films, facilitator notes, and completion proof) is the category to discuss. Seats are organization seats. There are no rank VIP tiers. The father stays free.

Counsel and the paying office decide whether any line item applies. Humans confirm outbound use.
`
    ),

  "event-closeout-printable": () =>
    wrapDraft(
      "Event closeout printable",
      `
## How to use

Fill attendance and completion aggregates after a training event. Do not write counseling notes, diagnoses, or clinical chart fields on this sheet.

When Super-admin turns vertical_pack_armed_forces on, Reports can fill the same totals from participation data. Flag off leaves Reports as they are.

## Event

- Organization: ______________________________
- Channel (chaplain office or unit): ______________________________
- Training title: ______________________________
- Dates: ______________ to ______________

## Aggregates only

- Men in the event: __________
- Sessions completed (count of finished sessions): __________
- Trainings completed: __________
- Trainings in progress: __________
- Trainings not started: __________
- Certificates issued: __________

## What stays off this sheet

- Counseling content
- Clinical chart fields
- Individual written answers
- Rank or VIP status

${sponsorshipSeatsRule()}

${militaryApprovalRecordRule()}
`
    ),
};

export function armedForcesPackArtifactBody(slug: ArmedForcesPackSlug) {
  return BODIES[slug]();
}

export function armedForcesPackDownload(slug: ArmedForcesPackSlug) {
  const artifact = ARMED_FORCES_PACK_ARTIFACTS.find((row) => row.slug === slug);
  if (!artifact) return null;
  return {
    ...artifact,
    body: armedForcesPackArtifactBody(slug),
  };
}
