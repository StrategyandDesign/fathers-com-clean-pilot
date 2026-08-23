import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  COUNSEL_PACK_ARTIFACTS,
  REPORT_REDISCLOSURE_LINE,
  type CounselPackSlug,
} from "@/lib/counsel/pack";

const DRAFT_BANNER = [
  "STATUS: DRAFT FOR COUNSEL REVIEW.",
  "This file is not an executed agreement.",
  "An unsigned draft is not executed.",
  "Fathers.com and the National Center for Fathering do not claim to be a covered entity by publishing this draft.",
  "Counsel decides whether any statute applies to a partner, and humans confirm outbound use.",
].join(" ");

function wrapDraft(title: string, body: string) {
  return [`# ${title}`, "", DRAFT_BANNER, "", body.trim(), ""].join("\n");
}

function partnerKitQsoa() {
  try {
    return readFileSync(join(process.cwd(), "partner-kit/qsoa-template.md"), "utf8").trim();
  } catch {
    return [
      "# Qualified Service Organization Agreement (QSOA) draft skeleton",
      "",
      "STATUS: DRAFT FOR COUNSEL REVIEW. Not for execution. Title 42 Code of Federal Regulations Part 2 governs;",
      "counsel finalizes jurisdiction, parties, and terms before any signature.",
    ].join("\n");
  }
}

const BODIES: Record<CounselPackSlug, () => string> = {
  "baa-template": () =>
    wrapDraft(
      "Business Associate Agreement template",
      `
This template exists so counsel can review whether a Business Associate Agreement is even the right instrument. Publishing it does not make Fathers.com, the National Center for Fathering, or a partner a covered entity, a business associate, or a hybrid entity.

## Parties (counsel fills)

- Covered entity or hybrid entity, if counsel finds one: [legal name]
- Other party: National Center for Fathering, for fatherhood education services offered as Fathers.com
- Effective date: [counsel]
- Governing law: [counsel]

## What this product is

Fathers.com hosts fatherhood education, educational assessments, participation progress, and completion certificates. It does not diagnose, screen, treat, or provide therapy. It does not keep a clinical chart.

## What this template is not

- Not a signed Business Associate Agreement
- Not a determination that the Health Insurance Portability and Accountability Act applies
- Not a data-processing agreement executed by either party
- Not permission to send protected health information or substance use disorder records into the product

## Draft clauses for counsel to rewrite

1. Purpose. Education hosting only. No treatment, payment, or health-care operations are performed in this product.
2. Information. The data map in the education-only memo lists account, progress, educational assessment, and certificate fields. Counsel strikes anything that would turn this into a clinical record.
3. Use and disclosure. Use is limited to running the education service the organization already chose. Further disclosure follows the redisclosure notice in this pack.
4. Subcontractors. [counsel names processors actually used.]
5. Breach. See the breach contact runbook stub. Clocks and notice text are for counsel.
6. Term and return. [counsel]
7. Signatures. Left blank on purpose. Do not treat a download, a check mark, or an attached-pack mark in the product as a signature.

Counsel replaces this page before anyone signs.
`
    ),

  "education-memo-data-map": () =>
    wrapDraft(
      "Education-only memo and data map",
      `
## Posture

This product certifies education. It does not diagnose, screen, treat, counsel, or provide therapy. Assessments are educational self-report tools. Certificates record completion of a Fathers.com training. They are not a clinical finding.

The National Center for Fathering does not claim covered-entity status by offering this memo.

## Data the platform is designed to hold

- Account: name the person chose, email, role, organization membership, language and palette preferences
- Training progress: which session film, check-in, and action are done, and when
- Educational assessments: completion status by default. Answer bodies only when the organization turns leader_assessment_answers on
- Certificates: serial, issue date, issuer display name, training title
- Organization operations: invite code, roster, assignments, Reports exports, Home updates

## Data the platform is designed not to hold

- Clinical chart fields
- Diagnosis, treatment, medication, or referral for substance use disorder
- Protected health information collected as a health-care record
- Title 42 Code of Federal Regulations Part 2 patient identifying records from a federally assisted substance use disorder program

If a partner is such a program, the Qualified Service Organization Agreement draft is the starting paper. The parties intend that those records do not cross to this product.

## Education-only use

Leaders see participation and completion flags so they can assign training and issue completion proof. They do not see custom assessment answers unless leader_assessment_answers is on. Reviewers see aggregated counts. Super-admins see organization operations. Fathers own the account after they leave a partner setting.

Counsel edits this map before a partner relies on it.
`
    ),

  "part2-applicability-memo": () =>
    wrapDraft(
      "Title 42 Code of Federal Regulations Part 2 applicability memo",
      `
## Placeholder

Counsel answers whether Title 42 Code of Federal Regulations Part 2 applies to a named partner program. This page is not that answer.

Part 2 attaches because a program is a federally assisted substance use disorder program, not because this education product exists and not because research is federally funded.

## Questions for counsel (not for the product to answer)

1. Is the partner a federally assisted substance use disorder program as those rules define it?
2. If yes, will any patient identifying information related to substance use disorder diagnosis, treatment, or referral ever be sent to Fathers.com?
3. If the answer to (2) is no, does the partner still want a Qualified Service Organization Agreement on file?
4. If the answer to (2) is yes, stop. This product is not built to receive those records. Counsel and the partner keep them out.

## Product intent

No clinical information is stored here. The certificate and public verification page never name the referring organization. The participant owns his account after discharge from a partner setting.

This memo stays a placeholder until counsel writes the determination for a specific partner. A Super-admin attached-pack mark is not that determination.
`
    ),

  qsoa: () =>
    [
      DRAFT_BANNER,
      "",
      "The body below is the partner-kit Qualified Service Organization Agreement draft. Acronyms in that draft: QSOA means Qualified Service Organization Agreement. 42 CFR Part 2 means Title 42 Code of Federal Regulations Part 2. NCF means National Center for Fathering.",
      "",
      partnerKitQsoa(),
      "",
    ].join("\n"),

  "redisclosure-notice": () =>
    wrapDraft(
      "Redisclosure notice for exports",
      `
## One-liner for Reports

${REPORT_REDISCLOSURE_LINE}

## Longer form for counsel

This information, if it includes identifiers, has been disclosed from an education participation export. It is not a clinical record.

If Title 42 Code of Federal Regulations Part 2 applies to the program that asked for this export, those federal rules restrict further disclosure of patient identifying information related to substance use disorder diagnosis, treatment, or referral unless written consent or another Part 2 permission allows it.

This product still does not claim to be a covered entity. The one-liner appears on a Reports CSV or PDF only when Super-admin turns counsel_pack_required on for the organization. Turning the flag on does not execute this notice.

Humans confirm outbound sharing.
`
    ),

  "breach-contact-runbook": () =>
    wrapDraft(
      "Breach contact runbook stub",
      `
## Purpose

A short list of who to call if education-account data may have been exposed. Counsel writes the clocks, legal notice text, and who must be told. This stub does not send notices and does not decide that a breach occurred.

## Contacts (organization fills)

- Organization privacy lead: [name, phone, email]
- National Center for Fathering contact: Team@Fathers.com until counsel names another address
- Counsel: [firm and after-hours number]
- Processors actually in use: [counsel names them]

## First hours (counsel rewrites)

1. Contain the exposure. Do not publish a public statement from this product.
2. Write down what was visible, to whom, and for how long. Education fields only. Do not collect clinical chart fields to "complete" the file.
3. Call the people on this list. Humans confirm outbound notice.
4. Counsel decides whether any statute requires notice, including Title 42 Code of Federal Regulations Part 2 or a Business Associate Agreement that counsel has actually executed outside this product.

## What the product will not do

- It will not auto-notify individuals.
- It will not treat a Super-admin attached-pack mark as proof that notice rules were followed.
- It will not store signatures on this runbook.
`
    ),
};

export function counselPackArtifactBody(slug: CounselPackSlug) {
  return BODIES[slug]();
}

export function counselPackDownload(slug: CounselPackSlug) {
  const artifact = COUNSEL_PACK_ARTIFACTS.find((row) => row.slug === slug);
  if (!artifact) return null;
  return {
    ...artifact,
    body: counselPackArtifactBody(slug),
  };
}
