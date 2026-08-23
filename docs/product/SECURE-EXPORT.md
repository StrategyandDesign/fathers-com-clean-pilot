# Secure export scaffold

Badge Shared 1-1.114. Not Shared 2.

`secure_export_enabled` defaults off. Leave `SECURE_EXPORT_ENABLED` unset so prior Reports stay as they are. The quality improvement packet download stays on `/manager/reports` either way.

## What this is

Scaffolding for a later customer-managed destination. Super-admin or a Leader may save destination metadata when the flag is on: a label, a kind (HTTPS URL, S3 URI, webhook, electronic health record host, local completion feed, or other), an endpoint hint, and a short note.

Tables:

- `org_export_destinations`
- `export_push_events`

The confirm-first send action records local intent. It does not fetch, POST, or otherwise transmit participant data to a customer URL, S3 bucket, webhook, electronic health record, courier, pastebin, or anonymous file host.

## Local completion feed

Documented local API shape, served only by this application:

`GET /api/export/completions`

Authorization: `Bearer <token>` (or `?token=`).

```json
{
  "schema": "fathers.com.completion_feed.v1",
  "scope": "completion_flags_only",
  "includes_answer_text": false,
  "includes_clinical_outcomes": false,
  "generated_at": "2026-08-23T12:00:00.000Z",
  "organization": "Example",
  "destination_label": "Local feed",
  "items": [],
  "note": "This dictionary describes education participation fields only. It does not include clinical outcomes."
}
```

Items are issued completion serials. No answer text. The route does not call an outside host. When the flag is off the route returns not-enabled.

## What stays off

No live network push. No new ribbon item. Flag off leaves CSV and PDF exports unchanged.
