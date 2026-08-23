import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ROLE_ACCOUNT, ROLE_HELP, ROLE_HOME } from "../lib/auth/roles";

const root = fileURLToPath(new URL("..", import.meta.url));

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "archive",
  "assets",
  "coverage",
]);

function walkFiles(dir: string, suffixes: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkFiles(full, suffixes));
      continue;
    }
    if (suffixes.some((suffix) => name.endsWith(suffix))) out.push(full);
  }
  return out;
}

function collectAppRoutes() {
  const pages = walkFiles(join(root, "app"), ["page.tsx", "route.ts"]);
  const routes = new Set<string>();
  for (const file of pages) {
    const rel = relative(join(root, "app"), file).replace(/\\/g, "/");
    const withoutGroup = rel.replace(/\([^/]+\)\//g, "");
    const cleaned = withoutGroup.replace(/(^|\/)(page|route)\.tsx?$/, "");
    const path = `/${cleaned}`.replace(/\/+$/, "");
    routes.add(path === "" || path === "/" ? "/" : path);
  }
  return routes;
}

function routeExists(routes: Set<string>, href: string) {
  const path = href.split("#")[0].split("?")[0];
  if (!path || path === "/") return routes.has("/");
  if (path.startsWith("/api/")) {
    return [...routes].some((route) => {
      if (!route.startsWith("/api/")) return false;
      const routeParts = route.split("/").filter(Boolean);
      const pathParts = path.split("/").filter(Boolean);
      if (routeParts.length !== pathParts.length) return false;
      return routeParts.every((part, index) => {
        return part.startsWith("[") || part === pathParts[index];
      });
    });
  }
  if (routes.has(path)) return true;
  return [...routes].some((route) => {
    const routeParts = route.split("/").filter(Boolean);
    const pathParts = path.split("/").filter(Boolean);
    if (routeParts.length !== pathParts.length) return false;
    return routeParts.every((part, index) => {
      return part.startsWith("[") || part === pathParts[index];
    });
  });
}

function collectStaticHrefs(file: string) {
  const source = readFileSync(file, "utf8");
  const hrefs = new Set<string>();
  const patterns = [
    /href=["'`](\/[^"'`{}$]*)["'`]/g,
    /href:\s*["'`](\/[^"'`{}$]*)["'`]/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const href = match[1];
      if (!href || href.startsWith("//") || href.startsWith("/http")) continue;
      hrefs.add(href);
    }
  }
  return hrefs;
}

describe("internal product links", () => {
  it("keeps role nav and account doors on real routes", () => {
    const routes = collectAppRoutes();
    const doors = [
      ...Object.values(ROLE_HOME),
      ...Object.values(ROLE_ACCOUNT),
      ...Object.values(ROLE_HELP),
      "/father/trainings",
      "/father/assessments",
      "/father/certificates",
      "/manager/trainings",
      "/manager/participants",
      "/manager/assessments",
      "/manager/impact",
      "/manager/reports",
      "/manager/account/photos",
      "/reviewer/summary",
      "/admin/organizations",
      "/admin/trainings",
      "/admin/assessments",
      "/admin/users",
      "/admin/gathering",
      "/admin/support",
      "/admin/messages",
      "/admin/appearance",
      "/logout",
      "/login",
      "/privacy",
      "/terms",
      "/verify",
      "/admin/trust",
      "/admin/verticals/armed-forces",
      "/admin/verticals/optimization",
      "/manager/account/security",
      "/manager/account/counsel",
      "/admin/account/counsel",
      "/admin/organizations",
    ];
    const missing = doors.filter((href) => !routeExists(routes, href));
    assert.deepEqual(missing, []);
  });

  it("does not leave static product hrefs pointing at missing pages", () => {
    const routes = collectAppRoutes();
    const files = [
      ...walkFiles(join(root, "app"), [".tsx", ".ts"]),
      ...walkFiles(join(root, "components"), [".tsx", ".ts"]),
    ];
    const orphans: string[] = [];
    for (const file of files) {
      for (const href of collectStaticHrefs(file)) {
        if (!routeExists(routes, href)) {
          orphans.push(`${relative(root, file)} -> ${href}`);
        }
      }
    }
    assert.deepEqual(orphans, []);
  });

  it("keeps the documented start-here and audit notes on disk", () => {
    assert.equal(existsSync(join(root, "docs/engineering/PILOT.md")), true);
    assert.equal(
      existsSync(join(root, "docs/engineering/ACTION-SEQUENCE-AUDIT-1-1.117.md")),
      true
    );
    assert.equal(existsSync(join(root, "docs/engineering/DOMAIN.md")), true);
    assert.equal(existsSync(join(root, "docs/product/VERIFIED-COMPLETION.md")), true);
    assert.equal(existsSync(join(root, "docs/product/EVIDENCE-BAR.md")), true);
    assert.equal(
      existsSync(join(root, "docs/engineering/NETWORK-REQUIREMENTS.md")),
      true
    );
  });
});
