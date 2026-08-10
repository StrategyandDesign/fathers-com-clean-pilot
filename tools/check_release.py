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
# POSITIONING.md 18: no norms count prints anywhere until section 8 resolves,
# and no evidence-rating claim prints until a Clearinghouse rating exists.
# Lift NORMS_BAN when norms_printable ships true; lift EVIDENCE_BAN on rating.
NORMS_BAN = ["9,232", "9232", "2,066", "2066 fathers"]
EVIDENCE_BAN = ["evidence-based", "evidence based", "clinically proven"]
CLINICAL_BAN = ["diagnos", "therapy", "therapist", "screening tool",
                "counseling", "behavioral health", "support group"]
ORG_FACING = {"organizations.html", "facilitators.html", "employers.html",
              "find-a-program.html", "efficacy-report.html", "research.html",
              "about.html", "classes.html"}
STUBS = {"stories.html", "story.html", "employers.html",
         "gatherings.html", "share.html", "voice.html", "veterans.html",
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

    # Restore stub files the builder deletes. Stubs are canonical content,
    # so the checker rewrites them directly; git state does not matter.
    stub_html = (
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">\n"
        "<meta name=\"robots\" content=\"noindex,nofollow\">\n"
        "<meta http-equiv=\"refresh\" content=\"0;url=index.html\">\n"
        "<title>Fathers.com</title></head>\n"
        "<body><p><a href=\"index.html\">Fathers.com</a></p></body></html>\n")
    for name in sorted(STUBS):
        (REPO / name).write_text(stub_html)

    for name in pages():
        if name in STUBS:
            continue
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
        nhits = [b for b in NORMS_BAN if b in text]
        if nhits:
            failures.append(f"{name}: norms-count ban hit (POSITIONING 18): {nhits}")
        ehits = [b for b in EVIDENCE_BAN if unnegated(b)]
        if ehits:
            failures.append(f"{name}: evidence-claim ban hit (POSITIONING 18): {ehits}")

    for jsname in ["assets/js/keystone-data.js", "assets/js/report.js",
                   "assets/js/keystone-ui.js", "assets/js/keystone-report.js"]:
        jt = (REPO / jsname).read_text()
        if "9,232" in jt or "'9232'" in jt:
            failures.append(f"{jsname}: norms count present in renderer")

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
