# Quality improvement field dictionary

Badge Shared 1-1.114. Not Shared 2.

This dictionary describes education participation fields only. It does not include clinical outcomes.

The in-product quality improvement packet on `/manager/reports` is a zip a Leader downloads. It is not a live push to a customer URL, S3 bucket, webhook, electronic health record, or third-party host.

## Packet files

| File | What it is |
|---|---|
| `completion.csv` | One row per assigned training. Same columns as the existing Reports spreadsheet. |
| `fidelity-summary.csv` | Living supervision checklist marks from Issue 8 hooks. |
| `facilitator-credentials.csv` | Certified Facilitator attestation list. |
| `certificate-serials.csv` | Issued completion serials. |
| `field-dictionary.md` | This dictionary, copied into the zip. |

Source of truth for columns and allowed values is `lib/qi/dictionary.ts`.

## Completion spreadsheet

| Column | Definition | Allowed values |
|---|---|---|
| Name | Display name on the roster. | Free text. |
| Participant ID | Internal father id. Not an email. | UUID. |
| Group | Cohort or organization group name. | Free text. |
| Training | Assigned training title, or None assigned. | Catalog title. |
| Status | Education completion for that training. | `not_started`, `in_progress`, `completed` |
| Practice | Did-you-use-this-skill flag. Not a score and not answer text. | `completed`, `not_yet`, `dismissed`, `stale`, or empty |
| Sessions completed | Finished sessions in that training. | Integer. |
| Sessions total | Session count in that training. | Integer. |
| Assigned on | Day the training was assigned. | Date or empty. |
| Completed on | Day the last session in that training finished. | Date or empty. |
| Certificate serial | Public completion serial when issued. | Serial or empty. |
| Certificate issued | Day the serial was issued. | Date or empty. |
| Last program activity | Latest of assignment, session, or certificate. Join date is not counted. | Date or empty. |
| Generated at UTC | When this spreadsheet was built. | Timestamp. |
| Organization | Organization name on the export. | Free text. |

## Fidelity checklist summary

Education supervision marks. Not a clinical chart.

| Column | Definition | Allowed values |
|---|---|---|
| hook | Packet hook name. | `fidelity_summary` |
| organization | Cohort or organization name. | Free text. |
| group_id | Internal group id. | UUID. |
| training | Training title, or Whole cohort. | Free text. |
| training_id | Internal training id when the board is per training. | UUID or empty. |
| section | Checklist section. | `session_one`, `mid_cohort`, `the_final`, `credential` |
| item_key | Stable checklist item key. | Partner-kit key. |
| prompt | Supervision prompt from the partner-kit list. | Free text. |
| completed | Whether the item is marked. | `yes`, `no` |
| completed_by | Leader who marked the item. | Name or empty. |
| completed_at | When the item was marked. | Timestamp or empty. |
| notes | Short coaching note. Not a clinical note. | Short text. |
| completed_count | Completed items on that board. | Integer. |
| total_count | Total items on that board. | Integer. |

## Certified Facilitator registry

Attestation only. Not a clinical license.

| Column | Definition | Allowed values |
|---|---|---|
| hook | Packet hook name. | `facilitator_credentials` |
| organization | Organization name. | Free text. |
| org_id | Internal organization id. | UUID. |
| user_id | Internal leader id. | UUID. |
| name | Leader display name. | Free text. |
| status | Attestation status. | `training`, `certified`, `suspended`, or empty |
| earned_at | Day recorded for the attestation, if any. | Date or empty. |
| evidence_path | Offline exam note or a short file path. | Short text. |
| attested_by | Who last attested the row. | Name or empty. |

## Certificate serial list

Issued completion serials only. Not a fitness finding.

| Column | Definition | Allowed values |
|---|---|---|
| certificate_serial | Public serial a person can verify. | Serial. |
| issued_at | When the serial was issued. | Timestamp. |
| participant_id | Internal father id. | UUID. |
| name | Display name on the roster. | Free text. |
| training | Training the serial belongs to. | Catalog title. |
| group | Cohort name. | Free text. |
| organization | Organization name on the export. | Free text. |

## What this packet does not include

This packet does not include clinical outcomes. It also does not include diagnosis codes, medication data, court packets, clinical chart fields, answer text, or login emails.

## Secure export flag

`secure_export_enabled` defaults off. Leave `SECURE_EXPORT_ENABLED` unset to keep prior Reports CSV and PDF unchanged. Destination rows and push-event audit tables may exist. The send action is a confirm-first stub that records intent locally or returns not-configured / not-enabled. No code path here transmits participant data to an external destination.
