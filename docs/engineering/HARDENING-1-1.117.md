# Hardening after Shared 1-1.117

Code-only pass. No Desk tick. No Shared 2. Father film, checkpoint, and practice loop unchanged. This is not a System and Organization Controls Type 2 claim and not a live production cutover.

**Start here for operators:** [PILOT.md](PILOT.md). Root [README.md](../../README.md) points at that runbook.

## Closed findings

| Finding | Before | After |
|---|---|---|
| Session middleware fail-open | If session refresh threw, a gated desk continued without a role check | Gated paths (`/father`, `/manager`, `/reviewer`, `/admin`) redirect to login. Public pages stay up |
| Rate-limit fail-open | A store error allowed the request | Auth, verify, and other limited routes fail closed |
| Secret compare | Cron and System for Cross-domain Identity Management tokens used string equality | Timing-safe compare in `lib/security/secrets.ts` |
| User-facing driver errors | Export and organization sign-in catch blocks could show `error.message` | Generic copy. Real text stays on the server log |
| System for Cross-domain Identity Management errors | Provision failures returned Postgres or Auth driver text | Generic "Could not provision" / "Could not deprovision" |
| Missing transport header | No HTTP Strict Transport Security | `Strict-Transport-Security` on all routes |
| No route error boundary | Only `app/global-error.tsx` | `app/error.tsx` shows a short recovery page with no stack |
| Open-redirect `next` | `safeInternalPath` accepted some encoded `//` and `://` shapes | Decode, reject protocol-relative and control characters |
| Push subscribe | No origin check, no rate limit | Same-origin plus `push.subscribe` limit |
| Completion feed token | Accepted `?token=` (referrer and log leak) | Authorization Bearer header only |
| Certificate download throw | A storage error could 500 | Catch returns a generic not-found |
| Cron auth duplication | Two copies of header compare | Shared `cronAuthorized` |

## Residual accepted risks

- In-memory rate limits are per isolate, not global. A later Redis or Upstash store can plug into the same call sites.
- Content-Security-Policy still allows `'unsafe-inline'` and `'unsafe-eval'` because Next.js 15 and the current script bootstrap need them.
- Pilot publishable fallback in `lib/supabase/env.ts` stays for this review repo when env keys are blank. Production launch still requires its own project. See [production-launch.md](production-launch.md).
- Shared Pilot seats still use the documented audit password. That password is not a production control.
- Public `/verify` is rate-limited and uses a row-level security function. A valid serial still shows the recipient name when one is stored. That is the product.
- Completion-feed tokens in query strings are rejected. Existing local clients must send `Authorization: Bearer`.
- Service role stays server-only (`server-only` admin client). It is never a `NEXT_PUBLIC_*` value.
- No live outbound push of participant data. Secure-export stays a confirm-first stub unless Super-admin turns it on, and even then it does not send to an outside host from this desk.
- No vulnerability-scan or penetration-test summary is on file. An empty evidence folder is not a clean scan.
- `npm audit` reports three high findings on Next.js 15.5.23 through nested `postcss` and `sharp`. The advertised fix is Next.js 16.3.2, a major framework jump. This pass does not take that jump.

## What this pass did not do

- Did not tick Shared 1-1.118. Nothing here is Desk-visible.
- Did not flip `SHOW_MILITARY` or enable vertical packs.
- Did not rewrite films or the father walk.
- Did not claim Vercel production is live.
