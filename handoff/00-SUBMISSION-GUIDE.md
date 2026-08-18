# Handoff Submission Guide

**Audience:** you (the submitter)  
**Date:** 18 August 2026  
**Rule:** send only the isolated clean-pilot repository. Do not send `fathers-com-platform`. Do not send `main`.

This guide is written from a completed audit of `origin/clean-pilot` plus the cleanup on `cursor/clean-pilot-handoff-audit-7c78`. Probe evidence is from the same day.

GitHub collaborator access is **per repository**, not per branch. Anyone invited to `fathers-com-platform` can see `main` and every other branch. That is why the review copy lives in a **separate private repo**.

---

## 1. GitHub submission

### What to point the team at

| Point them here | Do not point them here |
|---|---|
| Isolated repo: https://github.com/StrategyandDesign/fathers-com-clean-pilot | https://github.com/StrategyandDesign/fathers-com-platform |
| That repo’s `main` (clean-pilot Next.js app only) | `main` on `fathers-com-platform` |
| `handoff/` in the isolated repo | Pull request **#109** on the old repo (internal only) |
| | Any `cursor/*-7c78` PR whose **base is `main`** (PRs 103–108) |
| | Draft PR **#92** (532 files, dirty) |
| | The `0b8c` stack (PRs 93–99) |

**Send one repository.** Do not also send the old repo “for context.” Do not ask them to review a pile of stacked PRs.

### How to invite (this repo only)

1. Open https://github.com/StrategyandDesign/fathers-com-clean-pilot
2. **Settings → Collaborators → Add people**
3. Invite each engineer as **Write** (or **Read** if they should not push)
4. Do **not** invite them to `fathers-com-platform`

You need their GitHub usernames to send the invite. Access is repo-wide on the isolated repo; that is intended, because that repo has only the clean-pilot line.

Start here after clone: `handoff/00-SUBMISSION-GUIDE.md`.
