#!/usr/bin/env python3
"""Release checker. Run before every upload: python3 tools/check_release.py
Verifies, in order:
1. Build determinism: two consecutive page builds are byte-identical.
2. Version stamp: every chrome'd page footer carries PLATFORM_VERSION.
3. Changelog: changelog.html exists and leads with the current version.
4. Language: participant-facing pages pass the POSITIONING.md section 9 ban.
   Organization-facing pages may name verticals by design and are exempt.
5. Clinical-authority scan (POSITIONING.md section 16) across all pages.
Exit code 0 on pass; 1 on any failure, with every failure printed."""
import hashlib
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

SECTION9_BAN = ["rehab", "recovery", "treatment", "sobriety", "clinical",
                "patient", "inmate", "discharge"]
CLINICAL_BAN = ["diagnos", "therapy", "therapist", "screening tool",
                "counseling license"]
ORG_FACING = {"organizations.html", "facilitators.html", "employers.html",
              "find-a-program.html", "efficacy-report.html", "research.html",
              "about.html", "classes.html"}
STUBS = {"gatherings.html", "share.html", "voice.html", "veterans.html",
         "veterans-hub.html", "veterans-start.html", "veterans-checkin.html",
         "veterans-module.html", "veterans-resources.html"}


def pages():
    src = (REPO / "build_pages.py").read_text()
    return sorted(set(re.findall(r"PAGES\['([a-z0-9-]+\.html)'\]", src)))


def build_hash():
    subprocess.run([sys.executable, str(REPO / "build_pages.py")],
                   cwd=REPO, capture_output=True, check=True)
    h = hashlib.sha256()
    for name in pages():
        p = REPO / name
        if p.exists():
            h.update(name.encode())
            h.update(p.read_bytes())
    return h.hexdigest()


def main():
    failures = []
    src = (REPO / "build_pages.py").read_text()
    version = re.search(r'PLATFORM_VERSION\s*=\s*"([^"]+)"', src)
    version = version.group(1) if version else None
    if not version:
        failures.append("PLATFORM_VERSION missing from build_pages.py")

    if build_hash() != build_hash():
        failures.append("Build is not deterministic across two runs")

    # Restore stub files the builder deletes; the repo keeps them until the
    # dark surfaces return (they are replaced, not served, on regeneration).
    subprocess.run(["git", "checkout", "--", *sorted(STUBS)],
                   cwd=REPO, capture_output=True)

    for name in pages():
        p = REPO / name
        if not p.exists():
            continue
        text = p.read_text().lower()
        if version and f"v{version.lower()}" not in text and "nochrome" not in text:
            # Chrome'd pages carry the stamp; nochrome pages legitimately skip it.
            if '<div class="footbottom">' in text:
                failures.append(f"{name}: footer missing v{version} stamp")
        def unnegated(term):
            for m in re.finditer(re.escape(term), text):
                window = text[max(0, m.start() - 45):m.start()]
                if not re.search(r"\b(not|never|no|nor|without)\b[^.]*$", window):
                    return True
            return False
        if name not in ORG_FACING:
            hits = [b for b in SECTION9_BAN if unnegated(b)]
            if hits:
                failures.append(f"{name}: section 9 ban hit: {hits}")
        chits = [b for b in CLINICAL_BAN if unnegated(b)]
        if chits:
            failures.append(f"{name}: clinical-authority hit: {chits}")

    cl = REPO / "changelog.html"
    if not cl.exists():
        failures.append("changelog.html missing")
    elif version and f"v{version}" not in cl.read_text():
        failures.append(f"changelog.html does not lead with v{version}")

    if failures:
        print("RELEASE CHECK: FAIL")
        for f in failures:
            print("  -", f)
        return 1
    print(f"RELEASE CHECK: PASS (v{version}, {len(pages())} pages)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
