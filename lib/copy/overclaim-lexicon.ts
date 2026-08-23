/**
 * Frozen marketing-claim list. Live product copy, partner-kit sales notes,
 * and release checks fail when these appear as product status.
 * docs/product/EVIDENCE-BAR.md and partner-kit/funder-brief.md are the
 * doctrine and the only clearinghouse-adjacent sales artifact.
 */

export type OverclaimKind = "hard" | "sales";

export type OverclaimRule = {
  id: string;
  kind: OverclaimKind;
  label: string;
  pattern: RegExp;
  allowNegated: boolean;
};

export const OVERCLAIM_RULES: OverclaimRule[] = [
  {
    id: "clinical-efficacy",
    kind: "hard",
    label: "clinical-efficacy marketing",
    pattern: /clinical(?:ly)?[\s-]+(?:efficac\w+|effective|proven)/i,
    allowNegated: true,
  },
  {
    id: "title-iv-e-drawdown",
    kind: "hard",
    label: "Title IV-E drawdown as product status",
    pattern: /title\s*iv-?e\s+(?:drawdown|eligible|reimburs\w+|approved|rated)/i,
    allowNegated: true,
  },
  {
    id: "ffpsa-drawdown",
    kind: "hard",
    label: "Family First Prevention Services Act drawdown as product status",
    pattern:
      /(?:ffpsa|family first prevention services act)\s+(?:drawdown|eligible|reimburs\w+|approved|rated)/i,
    allowNegated: true,
  },
  {
    id: "mflc-approved",
    kind: "hard",
    label: "Military and Family Life Counseling approved without record",
    pattern:
      /(?:(?:mflc|military and family life counseling)\s+approved|approved(?:\s+for)?\s+(?:mflc|military and family life counseling))/i,
    allowNegated: true,
  },
  {
    id: "bsrt-approved",
    kind: "hard",
    label: "Building Strong and Ready Teams approved without record",
    pattern:
      /(?:(?:bsrt|building strong and ready teams)\s+approved|approved(?:\s+for)?\s+(?:bsrt|building strong and ready teams))/i,
    allowNegated: true,
  },
  {
    id: "reunification-ready",
    kind: "hard",
    label: "reunification-ready",
    pattern: /reunification[\s-]+ready/i,
    allowNegated: false,
  },
  {
    id: "risk-reduction-proven",
    kind: "hard",
    label: "risk-reduction proven",
    pattern: /(?:risk[\s-]+reduction\s+proven|proven\s+risk[\s-]+reduction)/i,
    allowNegated: true,
  },
  {
    id: "evidence-based",
    kind: "sales",
    label: "evidence-based as product status",
    pattern: /evidence[\s-]+based/i,
    allowNegated: true,
  },
  {
    id: "clearinghouse-rated",
    kind: "sales",
    label: "clearinghouse rating as product status",
    pattern: /clearinghouse[\s-]+(?:rated|approved|eligible)/i,
    allowNegated: true,
  },
  {
    id: "clearinghouse-mention",
    kind: "sales",
    label: "clearinghouse-adjacent sales mention",
    pattern:
      /(?:title\s*iv-?e|ffpsa|family first prevention services act|prevention services clearinghouse|\bclearinghouse\b)/i,
    allowNegated: false,
  },
  {
    id: "soc-type-2-certified",
    kind: "hard",
    label: "System and Organization Controls Type 2 certification as product status",
    pattern:
      /(?:soc\s*(?:2|ii|type\s*2)|system and organization controls(?:\s+type\s*2)?).{0,80}(?:certif\w+|attest\w+|validated)/i,
    allowNegated: true,
  },
  {
    id: "hitrust-certified",
    kind: "hard",
    label: "HITRUST certification as product status",
    pattern: /hitrust.{0,40}(?:certif\w+|validated|assessed)/i,
    allowNegated: true,
  },
];

export const HARD_OVERCLAIM_RULES = OVERCLAIM_RULES.filter((rule) => rule.kind === "hard");
export const SALES_OVERCLAIM_RULES = OVERCLAIM_RULES.filter((rule) => rule.kind === "sales");

export const GOVERNED_LIVE_ROOTS = [
  "app",
  "components",
  "lib/i18n",
  "lib/certificates",
  "lib/trust",
  "lib/verticals",
] as const;

export const GOVERNED_SALES_ROOTS = ["partner-kit"] as const;

/** Internal doctrine may name the bar. Sales copy may not, except the funder brief. */
export const CITATION_WATCH_ROOTS = ["docs/product"] as const;

/** Only sales artifact allowed to name the Clearinghouse or Title IV-E. */
export const FUNDER_BRIEF_PATH = "partner-kit/funder-brief.md";

export const SALES_ALLOWLIST = new Set([
  FUNDER_BRIEF_PATH,
]);

export const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".json",
]);

export const SCAN_SKIP_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  ".next",
  ".git",
]);

const NEGATION_RE = /\b(not|never|no|nor|without|isn't|is not|aren't|are not)\b[\s\S]*$/i;

export type OverclaimHit = {
  id: string;
  kind: OverclaimKind;
  label: string;
  match: string;
};

export function sentenceStart(text: string, index: number) {
  const before = text.slice(0, index);
  const found = Math.max(
    before.lastIndexOf("."),
    before.lastIndexOf("?"),
    before.lastIndexOf("!"),
    before.lastIndexOf("\n\n")
  );
  return found < 0 ? 0 : found + 1;
}

export function isNegatedClaim(text: string, index: number) {
  const window = text.slice(sentenceStart(text, index), index);
  return NEGATION_RE.test(window);
}

export function findOverclaimHits(
  text: string,
  rules: readonly OverclaimRule[] = OVERCLAIM_RULES
): OverclaimHit[] {
  const hits: OverclaimHit[] = [];
  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : `${rule.pattern.flags}g`);
    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0;
      if (rule.allowNegated && isNegatedClaim(text, index)) continue;
      hits.push({
        id: rule.id,
        kind: rule.kind,
        label: rule.label,
        match: match[0],
      });
    }
  }
  return hits;
}

export function citationNeedsShapeAnalog(text: string) {
  return /cioffi/i.test(text) && !/content-shape analog/i.test(text);
}
