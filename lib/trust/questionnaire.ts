export const TRUST_PACK_VERSION = "1";
export const TRUST_PACK_REVIEWED_ON = "2026-08-23";
export const TRUST_PACK_TITLE = "Fathers.com security questionnaire pack";

export type TrustQuestionnaireRow = {
  id: string;
  section: string;
  question: string;
  answer: string;
  evidence: string;
};

export const TRUST_CERTIFICATION_STATUS = [
  "This product is not System and Organization Controls Type 2 certified.",
  "This product is not HITRUST Common Security Framework certified.",
  "No such report is in this repository.",
].join(" ");

export const TRUST_PILOT_PASSWORD_STATUS = [
  "Shared audit passwords, including 12345 on Pilot seats, are for the Pilot project only.",
  "They are not a production control and must not be copied into a production stack.",
].join(" ");

export const TRUST_SCAN_STATUS =
  "No vulnerability-scan or penetration-test summary is on file in this repository. An empty evidence folder is not a clean scan.";

export const TRUST_ROADMAP_STATUS = [
  "A System and Organization Controls Type 2 or HITRUST Common Security Framework engagement has not started as of 23 August 2026.",
  "The honest next steps are an inventory of live controls, a named assessor, and evidence collection.",
  "Do not treat this pack as a certification, a letter of attestation, or a scheduled audit.",
].join(" ");

export const TRUST_QUESTIONNAIRE: TrustQuestionnaireRow[] = [
  {
    id: "auth",
    section: "Authentication",
    question: "How do people sign in?",
    answer:
      "Default sign-in is email and password through Supabase Auth. Fathers also enter an organization invite code at signup. Leaders and Reviewers may use organization single sign-on only when Super-admin turns sso_enabled on and links one OpenID Connect or Security Assertion Markup Language 2.0 provider. Super-admin break-glass stays email and password. The application authorizes from Auth app_metadata.role, never from user-editable user_metadata.",
    evidence:
      "docs/product/SINGLE-SIGN-ON.md; lib/auth/roles.ts; lib/auth/session.ts; app/(auth)/login",
  },
  {
    id: "passwords",
    section: "Authentication",
    question: "What is the password posture, including Pilot seats?",
    answer: TRUST_PILOT_PASSWORD_STATUS,
    evidence: "docs/engineering/PILOT.md; docs/engineering/production-launch.md",
  },
  {
    id: "authz",
    section: "Authorization",
    question: "How are roles and row-level security enforced?",
    answer:
      "Four roles exist: Father, Leader (stored as manager), Reviewer, and Super-admin. Next.js middleware and requireRole gate routes. Postgres row-level security is the data boundary. Fathers reach their own progress, notes, assessments, and certificates. Leaders reach the organization they staff. Reviewers see cohort totals, not names or individual answers. Super-admins operate catalog and organizations. Custom assessment written answers stay off Leader desks unless Super-admin turns leader_assessment_answers on for that organization.",
    evidence:
      "supabase/migrations/20260817033531_pilot_rls_policies.sql; lib/auth/roles.ts; docs/product/FACILITATOR-SUPPORT-MODEL.md",
  },
  {
    id: "encryption",
    section: "Encryption",
    question: "How is data protected in transit and at rest?",
    answer:
      "The application is served over HTTPS. The browser talks to Supabase over HTTPS and WebSocket Secure. Certificates and avatars live in private Storage buckets and are read through signed URLs or authenticated download routes, not public object URLs. Supabase documents encryption at rest for hosted Postgres and Storage. This repository does not contain a customer-managed key setup or a separate encryption attestation.",
    evidence:
      "next.config.ts Content-Security-Policy; docs/engineering/production-launch.md storage section; privacy security copy",
  },
  {
    id: "logging",
    section: "Logging",
    question: "What is logged, and is there a security information and event management product?",
    answer:
      "Sign-in activity lives in Supabase Auth. Application errors may go to Sentry when a data source name is configured. Session notes and assessment responses are not sent to Sentry as a matter of product design. Rate limits are in-memory sliding windows per isolate and fail open. There is no dedicated security information and event management product in this repository.",
    evidence:
      "lib/observability/sentry-dsn.ts; lib/security/rate-limit.ts; docs/engineering/production-launch.md",
  },
  {
    id: "subprocessors",
    section: "Subprocessors",
    question: "Which processors run the service?",
    answer:
      "Supabase (authentication, Postgres, Storage). Vercel (application hosting). Resend (transactional email when a key is set; local and Pilot degrade without it). Sentry (optional error monitoring). YouTube or Vimeo (session film embeds). There is no live push of participant data to a customer electronic health record, webhook, or object store. The secure-export scaffold records local intent only and stays off unless Super-admin turns secure_export_enabled on.",
    evidence:
      "AGENTS.md; docs/engineering/EMAIL-SETUP.md; docs/product/SECURE-EXPORT.md; next.config.ts frame-src",
  },
  {
    id: "retention",
    section: "Data retention",
    question: "How long is education-account data kept?",
    answer:
      "Results, progress, and certificates stay while the account is active so the person and the Leader can use them. Photos and certificate files stay in private buckets. If an organization administrator asks to delete an account, personal data is removed on a reasonable schedule except where a record must be kept. This product does not keep a clinical chart.",
    evidence: "lib/i18n/messages/en.ts legal.privacyPage.retentionBody; lib/counsel/artifacts.ts education memo",
  },
  {
    id: "breach",
    section: "Breach contact",
    question: "Who is contacted if education-account data may have been exposed?",
    answer:
      "Start with the draft breach contact runbook in the counsel pack. Organization privacy lead and counsel fill names and clocks. National Center for Fathering contact is Team@Fathers.com until counsel names another address. This product does not send breach notices on its own. A Super-admin attached-pack mark is not proof that notice rules were followed.",
    evidence: "lib/counsel/artifacts.ts breach-contact-runbook; /manager/account/counsel; /admin/account/counsel",
  },
  {
    id: "sso",
    section: "Single sign-on",
    question: "What is the single sign-on status?",
    answer:
      "sso_enabled defaults off per organization. Super-admin configures one identity provider on Identity. Staff with a matching work email can use Continue with your organization. First login maps identity-provider claims into app_metadata.role and organization_staff. Revoke desk access disables organization_staff and deletes Auth sessions. Refresh tokens stop immediately. Access tokens expire within one hour. System for Cross-domain Identity Management 2.0 inbound is accepted only when IDENTITY_SCIM_TOKEN is set. Fathers stay on invite code and email.",
    evidence:
      "docs/product/SINGLE-SIGN-ON.md; docs/engineering/SSO-OFFBOARDING.md; /admin/organizations/[id]/identity",
  },
  {
    id: "baa",
    section: "Business Associate Agreement",
    question: "What is the Business Associate Agreement posture?",
    answer:
      "The counsel pack ships a draft Business Associate Agreement template and an education-only memo with a data map. Every file is labeled Draft. An unsigned draft is not an executed agreement. This product does not claim to be a covered entity. counsel_pack_required defaults off. A Super-admin attached-pack mark is metadata only and is not a signature.",
    evidence: "docs/product/COUNSEL-PACK.md; /admin/account/counsel; /manager/account/counsel",
  },
  {
    id: "soc",
    section: "Certification",
    question:
      "Has a System and Organization Controls Type 2 report or a HITRUST Common Security Framework report been added to this repository?",
    answer: `${TRUST_CERTIFICATION_STATUS} ${TRUST_ROADMAP_STATUS}`,
    evidence: "docs/engineering/trust-pack/README.md; docs/product/TRUST-PACK.md",
  },
  {
    id: "evidence",
    section: "Evidence",
    question: "Where are the architecture map and the last scan summary?",
    answer: `Architecture and data fields live in the Issue 1 education-only memo and data map, plus the Issue 5 quality-improvement field dictionary. ${TRUST_SCAN_STATUS}`,
    evidence:
      "lib/counsel/artifacts.ts education-memo-data-map; docs/product/QUALITY-IMPROVEMENT-FIELDS.md; docs/engineering/trust-pack/scans/README.md",
  },
  {
    id: "transfer",
    section: "External transfer",
    question: "Does the product send participant data to an outside host?",
    answer:
      "No live external data transfer is implemented. Reports CSV, PDF, and the quality-improvement zip are Leader downloads. The secure-export destination form, when the flag is on, stores metadata and a local send-intent row. It does not POST, fetch, or otherwise transmit participant data to a customer URL, S3 bucket, webhook, or electronic health record.",
    evidence: "docs/product/SECURE-EXPORT.md; lib/export/push.ts",
  },
];
