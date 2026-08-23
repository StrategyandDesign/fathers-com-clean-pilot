#!/usr/bin/env npx tsx
/**
 * Phrase scan for frozen overclaim marketing. Used by tests/copy-hygiene
 * and runnable as: npx tsx tools/scan-overclaim.ts
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CITATION_WATCH_ROOTS,
  FUNDER_BRIEF_PATH,
  GOVERNED_LIVE_ROOTS,
  GOVERNED_SALES_ROOTS,
  HARD_OVERCLAIM_RULES,
  SALES_ALLOWLIST,
  SCAN_EXTENSIONS,
  SCAN_SKIP_DIR_NAMES,
  citationNeedsShapeAnalog,
  findOverclaimHits,
  type OverclaimHit,
} from "../lib/copy/overclaim-lexicon";

export type ScanFinding = {
  file: string;
  hits: OverclaimHit[];
};

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

function walk(rootRelative: string): string[] {
  const abs = join(REPO_ROOT, rootRelative);
  const found: string[] = [];

  function visit(dir: string) {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (SCAN_SKIP_DIR_NAMES.has(name)) continue;
      const full = join(dir, name);
      const info = statSync(full);
      if (info.isDirectory()) {
        visit(full);
        continue;
      }
      if (!SCAN_EXTENSIONS.has(extname(name))) continue;
      found.push(relative(REPO_ROOT, full));
    }
  }

  visit(abs);
  return found.sort();
}

export function governedLiveFiles() {
  return GOVERNED_LIVE_ROOTS.flatMap((root) => walk(root));
}

export function governedSalesFiles() {
  return GOVERNED_SALES_ROOTS.flatMap((root) => walk(root)).filter(
    (file) => !SALES_ALLOWLIST.has(file)
  );
}

export function citationWatchFiles() {
  return [
    ...governedLiveFiles(),
    ...governedSalesFiles(),
    ...CITATION_WATCH_ROOTS.flatMap((root) => walk(root)),
    FUNDER_BRIEF_PATH,
  ];
}

function readRepo(relativePath: string) {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

export function scanGovernedPaths(): ScanFinding[] {
  const findings: ScanFinding[] = [];

  for (const file of governedLiveFiles()) {
    const hits = findOverclaimHits(readRepo(file));
    if (hits.length) findings.push({ file, hits });
  }

  for (const file of governedSalesFiles()) {
    const hits = findOverclaimHits(readRepo(file));
    if (hits.length) findings.push({ file, hits });
  }

  const briefHits = findOverclaimHits(readRepo(FUNDER_BRIEF_PATH), HARD_OVERCLAIM_RULES);
  if (briefHits.length) findings.push({ file: FUNDER_BRIEF_PATH, hits: briefHits });

  return findings;
}

export function scanCitationShape(): string[] {
  return citationWatchFiles().filter((file) => citationNeedsShapeAnalog(readRepo(file)));
}

export function formatFindings(findings: ScanFinding[]) {
  return findings.flatMap((finding) =>
    finding.hits.map((hit) => `${finding.file}: ${hit.label} (${hit.match})`)
  );
}

function main() {
  const findings = scanGovernedPaths();
  const citations = scanCitationShape();
  if (!findings.length && !citations.length) {
    console.log("OVERCLAIM SCAN: PASS");
    return;
  }
  console.log("OVERCLAIM SCAN: FAIL");
  for (const line of formatFindings(findings)) {
    console.log("  -", line);
  }
  for (const file of citations) {
    console.log("  -", `${file}: Cioffi citation missing content-shape analog`);
  }
  process.exitCode = 1;
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invoked) {
  main();
}

