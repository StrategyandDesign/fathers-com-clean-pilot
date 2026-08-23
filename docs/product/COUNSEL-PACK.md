# Counsel pack

Quiet Account surface for draft counsel papers. Badge Shared 1-1.107. Not Shared 2.

## Where it lives

Leaders open Account, then the collapsed Counsel pack link, then `/manager/account/counsel`. Super-admin has the same downloads on `/admin/account/counsel` and the requirement controls on each organization, collapsed by default.

There is no new ribbon item and no red trust wall on other pages.

## What you can download

All six files are labeled Draft. An unsigned draft is not an executed agreement.

1. Business Associate Agreement template
2. Education-only memo and data map
3. Title 42 Code of Federal Regulations Part 2 applicability memo
4. Qualified Service Organization Agreement from `partner-kit/qsoa-template.md`
5. Redisclosure notice for exports
6. Breach contact runbook stub

The product does not claim to be a covered entity. Counsel decides whether any statute applies. Humans confirm outbound use.

## `counsel_pack_required` (default off)

Super-admin may turn this organization flag on. When it is on, Account counsel shows a checklist until Super-admin records that a pack was attached. That mark is metadata only. It is not a signature and it does not execute the drafts.

When the flag is off, the checklist is hidden. Downloads stay available.

Organization type never turns this flag on.

## Reports

When the flag is on, a Reports CSV or PDF includes a short redisclosure one-liner. The same line can appear under the download buttons. It stays off when the flag is off.
