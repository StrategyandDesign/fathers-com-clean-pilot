/**
 * Quality improvement field dictionary. Education participation only.
 * Does not include clinical outcomes.
 */

import {
  FACILITATOR_CREDENTIAL_HEADERS,
  FIDELITY_SUMMARY_HEADERS,
} from "@/lib/fidelity/export";

export const QI_DICTIONARY_TITLE = "Quality improvement field dictionary";

export const QI_SCOPE_LINE =
  "This dictionary describes education participation fields only. It does not include clinical outcomes.";

export const QI_EXCLUSIONS = [
  "clinical outcomes",
  "diagnosis codes",
  "medication data",
  "court packets",
  "clinical chart fields",
  "answer text",
  "login emails",
] as const;

export type QiFieldAllowedValue = {
  value: string;
  meaning: string;
};

export type QiDictionaryField = {
  column: string;
  definition: string;
  allowedValues: QiFieldAllowedValue[];
};

export type QiDictionarySection = {
  id: "completion" | "fidelity" | "facilitator" | "certificate_serials";
  title: string;
  file: string;
  lead: string;
  fields: QiDictionaryField[];
};

const COMPLETION_STATUS_VALUES: QiFieldAllowedValue[] = [
  { value: "not_started", meaning: "Assigned with zero sessions finished, or none assigned." },
  { value: "in_progress", meaning: "At least one session finished, not all." },
  { value: "completed", meaning: "Every session in that training is finished." },
];

const PRACTICE_VALUES: QiFieldAllowedValue[] = [
  { value: "completed", meaning: "The man tapped that he used the skill." },
  { value: "not_yet", meaning: "The man tapped that he had not used the skill yet." },
  { value: "dismissed", meaning: "The man dismissed the skill-use card." },
  { value: "stale", meaning: "The last tap is older than the quiet window." },
  { value: "(empty)", meaning: "No tap, or the roster practice light is off." },
];

const YES_NO: QiFieldAllowedValue[] = [
  { value: "yes", meaning: "The checklist item is marked complete." },
  { value: "no", meaning: "The checklist item is still open." },
];

const FACILITATOR_STATUS_VALUES: QiFieldAllowedValue[] = [
  { value: "training", meaning: "In training. Attestation only." },
  { value: "certified", meaning: "Certified Facilitator attestation." },
  { value: "suspended", meaning: "Attestation suspended." },
  { value: "(empty)", meaning: "No attestation recorded yet." },
];

export const CERTIFICATE_SERIAL_HEADERS = [
  "certificate_serial",
  "issued_at",
  "participant_id",
  "name",
  "training",
  "group",
  "organization",
] as const;

export const COMPLETION_COLUMNS = [
  "Name",
  "Participant ID",
  "Group",
  "Training",
  "Status",
  "Practice",
  "Sessions completed",
  "Sessions total",
  "Assigned on",
  "Completed on",
  "Certificate serial",
  "Certificate issued",
  "Last program activity",
  "Generated at UTC",
  "Organization",
] as const;

export const QI_DICTIONARY_SECTIONS: QiDictionarySection[] = [
  {
    id: "completion",
    title: "Completion spreadsheet",
    file: "completion.csv",
    lead: "One row per assigned training. Flag only. No answer text.",
    fields: [
      { column: "Name", definition: "Display name on the roster.", allowedValues: [] },
      { column: "Participant ID", definition: "Internal father id. Not an email.", allowedValues: [] },
      { column: "Group", definition: "Cohort or organization group name.", allowedValues: [] },
      { column: "Training", definition: "Assigned training title, or None assigned.", allowedValues: [] },
      {
        column: "Status",
        definition: "Education completion for that training.",
        allowedValues: COMPLETION_STATUS_VALUES,
      },
      {
        column: "Practice",
        definition: "Did-you-use-this-skill flag. Not a score and not answer text.",
        allowedValues: PRACTICE_VALUES,
      },
      { column: "Sessions completed", definition: "Finished sessions in that training.", allowedValues: [] },
      { column: "Sessions total", definition: "Session count in that training.", allowedValues: [] },
      { column: "Assigned on", definition: "Day the training was assigned.", allowedValues: [] },
      { column: "Completed on", definition: "Day the last session in that training finished.", allowedValues: [] },
      { column: "Certificate serial", definition: "Public completion serial when issued.", allowedValues: [] },
      { column: "Certificate issued", definition: "Day the serial was issued.", allowedValues: [] },
      {
        column: "Last program activity",
        definition: "Latest of assignment, session, or certificate. Join date is not counted.",
        allowedValues: [],
      },
      { column: "Generated at UTC", definition: "When this spreadsheet was built.", allowedValues: [] },
      { column: "Organization", definition: "Organization name on the export.", allowedValues: [] },
    ],
  },
  {
    id: "fidelity",
    title: "Fidelity checklist summary",
    file: "fidelity-summary.csv",
    lead: "Education supervision marks. Not a clinical chart.",
    fields: [
      { column: "hook", definition: "Packet hook name. Always fidelity_summary.", allowedValues: [] },
      { column: "organization", definition: "Cohort or organization name.", allowedValues: [] },
      { column: "group_id", definition: "Internal group id.", allowedValues: [] },
      { column: "training", definition: "Training title, or Whole cohort.", allowedValues: [] },
      { column: "training_id", definition: "Internal training id when the board is per training.", allowedValues: [] },
      {
        column: "section",
        definition: "Checklist section.",
        allowedValues: [
          { value: "session_one", meaning: "Session one." },
          { value: "mid_cohort", meaning: "Mid-cohort (session three)." },
          { value: "the_final", meaning: "The final." },
          { value: "credential", meaning: "Credential decision." },
        ],
      },
      { column: "item_key", definition: "Stable checklist item key.", allowedValues: [] },
      { column: "prompt", definition: "Supervision prompt from the partner-kit list.", allowedValues: [] },
      { column: "completed", definition: "Whether the item is marked.", allowedValues: YES_NO },
      { column: "completed_by", definition: "Leader who marked the item.", allowedValues: [] },
      { column: "completed_at", definition: "When the item was marked.", allowedValues: [] },
      { column: "notes", definition: "Short coaching note. Not a clinical note.", allowedValues: [] },
      { column: "completed_count", definition: "Completed items on that board.", allowedValues: [] },
      { column: "total_count", definition: "Total items on that board.", allowedValues: [] },
    ],
  },
  {
    id: "facilitator",
    title: "Certified Facilitator registry",
    file: "facilitator-credentials.csv",
    lead: "Attestation only. Not a clinical license.",
    fields: [
      { column: "hook", definition: "Packet hook name. Always facilitator_credentials.", allowedValues: [] },
      { column: "organization", definition: "Organization name.", allowedValues: [] },
      { column: "org_id", definition: "Internal organization id.", allowedValues: [] },
      { column: "user_id", definition: "Internal leader id.", allowedValues: [] },
      { column: "name", definition: "Leader display name.", allowedValues: [] },
      { column: "status", definition: "Attestation status.", allowedValues: FACILITATOR_STATUS_VALUES },
      { column: "earned_at", definition: "Day recorded for the attestation, if any.", allowedValues: [] },
      { column: "evidence_path", definition: "Offline exam note or a short file path.", allowedValues: [] },
      { column: "attested_by", definition: "Who last attested the row.", allowedValues: [] },
    ],
  },
  {
    id: "certificate_serials",
    title: "Certificate serial list",
    file: "certificate-serials.csv",
    lead: "Issued completion serials only. Not a fitness finding.",
    fields: [
      { column: "certificate_serial", definition: "Public serial a person can verify.", allowedValues: [] },
      { column: "issued_at", definition: "When the serial was issued.", allowedValues: [] },
      { column: "participant_id", definition: "Internal father id.", allowedValues: [] },
      { column: "name", definition: "Display name on the roster.", allowedValues: [] },
      { column: "training", definition: "Training the serial belongs to.", allowedValues: [] },
      { column: "group", definition: "Cohort name.", allowedValues: [] },
      { column: "organization", definition: "Organization name on the export.", allowedValues: [] },
    ],
  },
];

function renderAllowed(values: QiFieldAllowedValue[]) {
  if (values.length === 0) return "Free text or a date. No enumerated clinical codes.";
  return values.map((row) => `${row.value}: ${row.meaning}`).join(" ");
}

export function renderQiDictionaryMarkdown() {
  const lines = [
    `# ${QI_DICTIONARY_TITLE}`,
    "",
    QI_SCOPE_LINE,
    "",
    "Allowed values are education flags only. The packet does not include " +
      QI_EXCLUSIONS.join(", ") +
      ".",
    "",
    "Downloads stay on this desk. A person still confirms any outbound send.",
    "",
  ];

  for (const section of QI_DICTIONARY_SECTIONS) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(`File: \`${section.file}\`. ${section.lead}`);
    lines.push("");
    lines.push("| Column | Definition | Allowed values |");
    lines.push("|---|---|---|");
    for (const field of section.fields) {
      lines.push(`| ${field.column} | ${field.definition} | ${renderAllowed(field.allowedValues)} |`);
    }
    lines.push("");
  }

  lines.push("## What this packet is not");
  lines.push("");
  lines.push(
    "This is not a clinical outcomes file, not an electronic health record extract, and not a court packet."
  );
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function dictionaryColumnNames() {
  return QI_DICTIONARY_SECTIONS.flatMap((section) => section.fields.map((field) => field.column));
}

export function assertDictionaryCoversExportHeaders() {
  const completion = new Set(QI_DICTIONARY_SECTIONS[0]?.fields.map((field) => field.column));
  const fidelity = new Set(
    QI_DICTIONARY_SECTIONS.find((section) => section.id === "fidelity")?.fields.map((field) => field.column)
  );
  const facilitator = new Set(
    QI_DICTIONARY_SECTIONS.find((section) => section.id === "facilitator")?.fields.map((field) => field.column)
  );
  const serials = new Set(
    QI_DICTIONARY_SECTIONS.find((section) => section.id === "certificate_serials")?.fields.map(
      (field) => field.column
    )
  );
  return {
    completion: COMPLETION_COLUMNS.every((column) => completion.has(column)),
    fidelity: FIDELITY_SUMMARY_HEADERS.every((column) => fidelity.has(column)),
    facilitator: FACILITATOR_CREDENTIAL_HEADERS.every((column) => facilitator.has(column)),
    serials: CERTIFICATE_SERIAL_HEADERS.every((column) => serials.has(column)),
  };
}
