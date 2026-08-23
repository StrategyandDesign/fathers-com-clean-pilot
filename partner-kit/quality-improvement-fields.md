# Quality improvement field dictionary

Partner-facing copy of `docs/product/QUALITY-IMPROVEMENT-FIELDS.md`. Education participation only. This dictionary does not include clinical outcomes.

A Leader downloads the quality improvement packet from Reports inside the Desk. That zip is a local download. It is not a send to your case system, an electronic health record, or any outside host.

## Columns and allowed values

### Completion spreadsheet

Name, Participant ID, Group, Training, Status (`not_started`, `in_progress`, `completed`), Practice (`completed`, `not_yet`, `dismissed`, `stale`, or empty), Sessions completed, Sessions total, Assigned on, Completed on, Certificate serial, Certificate issued, Last program activity, Generated at UTC, Organization.

Status is education completion. Practice is a did-you-use-this-skill flag. No answer text.

### Fidelity checklist summary

hook (`fidelity_summary`), organization, group_id, training, training_id, section (`session_one`, `mid_cohort`, `the_final`, `credential`), item_key, prompt, completed (`yes` or `no`), completed_by, completed_at, notes, completed_count, total_count.

Education supervision. Not a clinical chart.

### Certified Facilitator registry

hook (`facilitator_credentials`), organization, org_id, user_id, name, status (`training`, `certified`, `suspended`, or empty), earned_at, evidence_path, attested_by.

Attestation only. Not a clinical license.

### Certificate serial list

certificate_serial, issued_at, participant_id, name, training, group, organization.

Issued completion serials. Not a fitness finding.

## What this packet does not include

This packet does not include clinical outcomes. It also does not include diagnosis codes, medication data, court packets, clinical chart fields, answer text, or login emails.
