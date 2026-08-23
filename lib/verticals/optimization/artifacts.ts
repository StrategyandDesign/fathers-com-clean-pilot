import {
  confidentialityDefaultsLead,
  hideRehabLabelRule,
  invitationOnlyJoinRule,
  noAnswerDumpRule,
  nonClinicalCopyRule,
  publicGoToMarketRule,
  sponsorshipCapacityRule,
} from "@/lib/verticals/optimization/lexicon";
import {
  OPTIMIZATION_PACK_ARTIFACTS,
  type OptimizationPackSlug,
} from "@/lib/verticals/optimization/pack";

const DRAFT_BANNER = [
  "STATUS: DRAFT FOR COUNSEL AND FORUM-MODERATOR REVIEW.",
  "This file is not an executed agreement and not a public go-to-market.",
  "Fathers.com and the National Center for Fathering do not claim a chief executive officer product launch.",
].join(" ");

function wrapDraft(title: string, body: string) {
  return [`# ${title}`, "", DRAFT_BANNER, "", body.trim(), ""].join("\n");
}

const BODIES: Record<OptimizationPackSlug, () => string> = {
  "confidentiality-defaults": () =>
    wrapDraft(
      "Bonded-group confidentiality defaults",
      `
## Purpose

Quiet defaults for a Performance Optimization Group that wants bonded-group confidentiality. Same Desk spine. No second app.

## Defaults

- ${invitationOnlyJoinRule()}
- ${confidentialityDefaultsLead()}
- ${noAnswerDumpRule()}
- ${hideRehabLabelRule()}

## What stays off this pack

- Clinical chart fields
- Written assessment answers
- Leader notes in Reports or the quality improvement packet
- Paid participant tiers
- A public go-to-market page

${publicGoToMarketRule()}
`
    ),

  "non-clinical-copy": () =>
    wrapDraft(
      "Non-clinical copy note",
      `
## Note (unsigned)

${nonClinicalCopyRule()}

1. It does not diagnose, screen, treat, or provide therapy.
2. It does not keep a clinical chart.
3. Assessments stay educational self-report tools.
4. The commitment board reuses practice completion flags only. It does not grade a man.
5. Certificates record completion of a Fathers.com training. They are not a clinical finding.

## Forum note

A bonded group is still a training cohort. It is not a therapy group and not a scored leaderboard.

## Signatures

Left blank on purpose. A download, a checklist view, or a flag flip is not a signature.
`
    ),

  "forum-moderator-review": () =>
    wrapDraft(
      "Forum-moderator review checklist",
      `
## Before any public go-to-market

A forum moderator and Super-admin sign this list. Until then, vertical_pack_optimization stays off for public talk.

1. Confidentiality defaults are on: invitation-only join, flags-only answers, Leader notes off exports.
2. Copy is non-clinical. No therapy, grades, or clinical chart fields on father chrome.
3. There is no answer dump. Custom assessment answers stay off Leader desks unless a separate org flag unlocks them.
4. The Rehab participation label is hidden on that organization's father chrome.
5. Sponsorship pays for facilitator capacity. There are no paid participant tiers.
6. Films are unchanged. There is no second app.

${publicGoToMarketRule()}

## Sign-off

- Forum moderator: ______________________________ date: __________
- Super-admin: ______________________________ date: __________
`
    ),

  "sponsorship-and-deferral": () =>
    wrapDraft(
      "Sponsorship and public go-to-market deferral",
      `
## Sponsorship

${sponsorshipCapacityRule()}

Seats belong to the organization. Do not sell a very-important-person participant package.

## Deferral

${publicGoToMarketRule()}

This pack is later-wave. Rehab desks stay on the current pilot. Super-admin can open the checklist while the env flag stays off.
`
    ),
};

export function optimizationPackArtifactBody(slug: OptimizationPackSlug) {
  return BODIES[slug]();
}

export function optimizationPackDownload(slug: OptimizationPackSlug) {
  const artifact = OPTIMIZATION_PACK_ARTIFACTS.find((row) => row.slug === slug);
  if (!artifact) return null;
  return {
    ...artifact,
    body: optimizationPackArtifactBody(slug),
  };
}
