# Trust status

Quiet Account and organization strip for single sign-on and data-processing posture. Badge Shared 1-1.108, wired to live status in Shared 1-1.113. Not Shared 2.

## Where it lives

Leaders see muted lines on `/manager/account`. Super-admin sees the same lines on `/admin/account` and an Organization trust block on `/admin/organizations/[id]`.

There is no new ribbon item and no red trust wall on other pages.

## What it says

1. Single sign-on: Not connected, with Off unless Super-admin turns sso_enabled on, unless a connection is already present. The line links to `/manager/account/security` or `/admin/organizations/[id]/identity`.
2. Business Associate Agreement and education-only pack: draft, checklist-open, or attached-mark status. The link reuses `/manager/account/counsel` or `/admin/account/counsel`.
3. Data-processing contact: a stub that opens the same counsel pack. This product does not send notices on its own.

The strip does not list the six counsel downloads again. Identity-provider single sign-on is configured on Identity, not in this strip. It does not claim an executed agreement.

Shared 1-1.115 adds a Super-admin-only security questionnaire at `/admin/trust`. That page is not this strip and is not a father-facing trust wall.
