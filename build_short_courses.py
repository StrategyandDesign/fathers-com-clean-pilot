#!/usr/bin/env python3
"""Generate short-session marketing pages for anger / reentry / coparenting.

Reads content/short-course-pages.json and writes:
  - course-steady-under-pressure.html
  - course-coming-home-present.html
  - course-same-team.html

Also exposes helpers used by build_pages.py so future rebuilds do not wipe
the 12 x ~12-minute session bodies.
"""
from __future__ import annotations

import html as html_lib
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content" / "short-course-pages.json"

COURSE_KEYS = ("anger", "reentry", "coparenting")


def load_courses():
    with open(CONTENT, encoding="utf-8") as f:
        data = json.load(f)
    return data


def _e(s: str) -> str:
    return html_lib.escape(s or "", quote=False)


def _q(s: str) -> str:
    """Wrap a quote with typographic quotes for HTML bodies."""
    return "&ldquo;" + _e(s) + "&rdquo;"


def practice_html(sess: dict) -> str:
    before = sess.get("before_return")
    after = sess.get("after_return")
    parts = [
        '<div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">',
        '    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>',
    ]
    if before or after:
        if before:
            parts.append(
                f'    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> {_e(before)}</p>'
            )
        if after:
            parts.append(f'    <p class="small"><b>After the return:</b> {_e(after)}</p>')
    else:
        parts.append(f'    <p class="small">{_e(sess.get("practice", ""))}</p>')
    parts.append("  </div>")
    return "\n".join(parts)


def session_article(course: dict, sess: dict) -> str:
    prefix = course["id_prefix"]
    ord_ = sess["ord"]
    sid = f"{prefix}{ord_}"
    vkey = f"{course['video_prefix']}{ord_}"
    slug = course["slug"]
    demo_href = f"course.html?preview=1&amp;cert={_e(slug)}"
    science = sess.get("science")
    science_html = (
        f'  <p class="fine" style="color:var(--ash)">The science in the room: {_e(science)}</p>\n'
        if science
        else ""
    )
    return f'''<article class="card" style="padding:26px 28px;margin-bottom:18px" id="{sid}">
  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION {ord_}</span><span class="fine mono">~12 MIN</span></div>
  <h3 class="d-28" style="margin-bottom:12px">{_e(sess["title"])}</h3>
  <div class="video-slot" data-video="{vkey}" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">
    <p class="eyebrow brass" style="margin-bottom:8px">PREVIEW SESSION</p>
    <p class="fine" style="color:var(--ash);margin:0 0 14px;max-width:42ch;margin-left:auto;margin-right:auto">Film still finishing. Open the full preview player for this course (all 12 sessions).</p>
    <a class="btn btn-yellow btn-sm" href="{demo_href}">Watch the preview player</a>
  </div>
  <p class="lead" style="font-size:17px;margin-bottom:12px">{_q(sess["quote"])}</p>
  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> {_e(sess["scene"])}</p>
  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> {_e(sess["in_room"])}</p>
  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> {_e(sess["leave_with"])}</p>
  {practice_html(sess)}
{science_html}</article>'''


def glance_html(course: dict) -> str:
    items = []
    prefix = course["id_prefix"]
    for sess in course["sessions"]:
        items.append(
            f'<a class="sag-item" href="#{prefix}{sess["ord"]}" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit">'
            f'<span class="fine mono" style="color:var(--ash);min-width:26px">{sess["ord"]}</span>'
            f'<span class="small"><b>{_e(sess["title"])}</b> <span style="color:var(--ash)">&middot; {_q(sess["quote"])}</span></span></a>'
        )
    n = len(course["sessions"])
    return (
        '<section class="tight"><div class="container" style="max-width:860px">'
        '<div class="eyebrow" style="margin-bottom:6px">SESSIONS AT A GLANCE</div>'
        f'<p class="fine" style="color:var(--ash);margin:0 0 6px">The {n} sessions, about twelve minutes of film each. Tap any one to read it in full. Films are still finishing — open the <a class="link" href="course.html?preview=1&amp;cert={_e(course["slug"])}">full preview player</a> for the course flow.</p>'
        + "".join(items)
        + "</div></section>"
    )


def billboard_html(course: dict) -> str:
    n = len(course["sessions"])
    disc = ""
    if course.get("disclaimer"):
        disc = (
            f'  <p class="fine" style="color:var(--ash);max-width:62ch;margin-bottom:14px">{_e(course["disclaimer"])}</p>\n'
        )
    # Keep the intentional double-close pattern used by existing course pages / build_pages
    return f'''
<section class="band"><div class="container" style="max-width:860px">
  <a class="link ash" href="certificates.html" style="font-size:13px;display:inline-block;margin-bottom:20px">&larr; All courses</a>
  <div class="course-billboard">
    <img src="{_e(course["photo"])}" alt="">
    <div class="cb-shade"></div>
    <div class="cb-copy"><div class="eyebrow">FILM COURSE &middot; {n} SESSIONS</div><h2>{_e(course["title"])}</h2></div>
  </div>
  <div class="eyebrow brass" style="margin-bottom:14px">FILM COURSE &middot; {n} SESSIONS &middot; ~12 MINUTES EACH</div>
  <h1 class="d-36" style="margin-bottom:14px">{_e(course["title"])}</h1>
  <p class="fine mono" style="letter-spacing:.08em;margin-bottom:10px;color:var(--ash)">{_e(course["eyebrow_track"])}</p>
  <p class="lead" style="max-width:62ch;margin-bottom:10px">{_e(course["lead"])}</p>
  <p class="fine" style="color:var(--ash);max-width:62ch;margin-bottom:6px">{_e(course["fine1"])}</p>
  <p class="fine" style="color:var(--ash);max-width:62ch;margin-bottom:14px">{_e(course["fine2"])}</p>
{disc}  <div class="row wrap" style="gap:10px;margin-bottom:8px"><a class="btn btn-yellow" href="profile.html">Start with free Profile</a><a class="btn btn-secondary" href="course.html?preview=1&amp;cert={_e(course["slug"])}">Watch the preview player</a><a class="btn btn-secondary" href="certificates.html#catalog">Browse courses</a></div>
</div></section></div></section>
'''


def cta_html() -> str:
    return '''
<section class="band"><div class="container" style="max-width:860px;text-align:center">
  <h2 class="d-28" style="margin-bottom:10px">Start free. Train on film.</h2>
  <p style="color:var(--ash);max-width:56ch;margin:0 auto 20px">Start with the Keystone Father Profile and your twelve-week plan, or bring this course to the men your organization serves. Facilitator-supported, self-paced.</p>
  <div class="row" style="gap:12px;justify-content:center"><a class="btn btn-primary" href="profile.html">Start with the Profile</a><a class="btn btn-secondary" href="organizations.html">Bring it to your organization</a></div>
</div></section>
'''


def render_course_body(course: dict) -> str:
    articles = "\n".join(session_article(course, s) for s in course["sessions"])
    return (
        billboard_html(course)
        + glance_html(course)
        + '\n<section><div class="container" style="max-width:860px">\n'
        + articles
        + "\n</div></section>"
        + cta_html()
    )


def page_meta(course: dict) -> dict:
    return dict(
        title=f'{course["title"]}: the sessions',
        desc=course["desc"],
        active="The Courses",
        mode="public",
        body=render_course_body(course),
    )


def sess_peek_ol(course: dict) -> str:
    items = []
    for sess in course["sessions"]:
        items.append(
            f'<li style="margin:5px 0"><b>{_e(sess["title"])}</b> '
            f'<span style="color:var(--ash)">&middot; {_q(sess["quote"])}</span></li>'
        )
    return (
        '<ol class="small" style="margin:8px 0 2px;padding-left:18px">'
        + "".join(items)
        + "</ol>"
    )


def sess_visible_ol(course: dict, n: int = 3) -> str:
    items = []
    for sess in course["sessions"][:n]:
        items.append(
            f'<li><b>{_e(sess["title"])}</b> <span>&middot; {_q(sess["quote"])}</span></li>'
        )
    return '<ol class="sess-visible">\n        ' + "\n        ".join(items) + "\n      </ol>"


def cert_card_html(course: dict) -> str:
    """Static catalog card fragment for certificates.html / build_pages."""
    slug = course["slug"]
    title = course["title"]
    n = len(course["sessions"])
    href = course["html"]
    photo = course["photo"]
    hours = "3.0"
    if slug == "reentry":
        blurb = "Presence after time away. The return spine: body, child, deposits, reunion. Twelve short sessions. Facilitator support when claimed."
        data_desc = "Presence after time away, whatever kept you away. Self-paced film with a Certified Facilitator available for questions, checkpoints, and a certificate a court or program can trust."
    elif slug == "anger":
        blurb = "Steadiness on film: the pause, the repair, and the habits underneath. Twelve short sessions. Facilitator available for questions."
        data_desc = "Steadiness, trained on film: the pause, the repair, and the habits underneath them. Self-paced, with a Certified Facilitator available for questions. Sessions logged, checkpoints, and a final assessment at eighty percent to pass."
    else:
        blurb = "Co-parenting on film. One team for your children, whatever the arrangement. Twelve short sessions. Facilitator available for questions."
        data_desc = "Co-parenting, trained on film. One team for your children, whatever the arrangement between you. Self-paced, with a Certified Facilitator available for questions. Sessions logged, checkpoints, and a final assessment at eighty percent to pass."

    disc = ""
    if course.get("disclaimer"):
        disc = (
            f'      <p class="fine" style="color:var(--ash);margin-top:0;margin-bottom:10px">{_e(course["disclaimer"])}</p>\n'
        )

    peek = sess_peek_ol(course)
    visible = sess_visible_ol(course)
    return f'''    <div class="cert-card" style="cursor:default" data-cert="{slug}" data-title="{_e(title)}" data-hours="{hours}" data-desc="{_e(data_desc)}">
      <div class="course-card-media">
        <img src="{_e(photo)}" alt="">
        <div class="ccm-overlay"></div>
        <div class="ccm-badges"><span class="pill">Film course</span><span class="ccm-n">{n} sessions</span></div>
      </div>
      <div class="cert-card-top"><span class="pill">Film course</span><span class="cert-card-hrs">{n} sessions</span></div>
      <h3>{_e(title)}</h3>
      <p>{_e(blurb)}</p>
{disc}      {visible}
      <details class="sess-peek" style="margin-top:4px"><summary class="fine" style="cursor:pointer;color:var(--brass,#c9a227)">All {n} sessions</summary>{peek}<p class="fine" style="margin:6px 0 0"><a class="link" href="{href}">Open the course &rarr;</a></p></details>
      <div class="cert-card-foot"><span class="mono">Free</span><a class="cert-card-go" href="{href}">Open the course &rarr;</a></div>
    </div>'''


def apply_to_build_pages(build_pages_path: Path, courses: dict) -> None:
    """Replace giant PAGES[...] body strings with helper-loaded bodies."""
    text = build_pages_path.read_text(encoding="utf-8")

    if "from build_short_courses import" not in text:
        # Insert import after the standard library imports block near top
        m = re.search(r"^(import |from )", text, flags=re.M)
        # Place after VERSION / feature flags area: right before PAGES = {}
        if "PAGES = {}" in text:
            text = text.replace(
                "PAGES = {}",
                "from build_short_courses import load_courses as _load_short_courses, page_meta as _short_course_page_meta, cert_card_html as _short_cert_card\n\n"
                "_SHORT_COURSES = _load_short_courses()\n\n"
                "PAGES = {}",
                1,
            )
        else:
            raise SystemExit("Could not find PAGES = {} in build_pages.py")

    # Replace each course page assignment with helper meta
    for key in COURSE_KEYS:
        course = courses[key]
        fname = course["html"]
        pattern = re.compile(
            r"PAGES\['" + re.escape(fname) + r"'\] = dict\([\s\S]*?\)\n(?=PAGES\[|SHOW_|# |def |if __name__|for fname)",
            re.M,
        )
        replacement = (
            f"PAGES['{fname}'] = _short_course_page_meta(_SHORT_COURSES['{key}'])\n"
        )
        new_text, n = pattern.subn(replacement, text, count=1)
        if n != 1:
            # Fallback: line-anchored replace of the assignment start through next PAGES[
            start = text.find(f"PAGES['{fname}'] = dict(")
            if start < 0:
                raise SystemExit(f"Could not find PAGES['{fname}'] assignment")
            # Find matching end: next line that starts with PAGES[ after this one,
            # scanning carefully because body has nested quotes. The assignment ends
            # with ")\n" after the closing of dict(... body='...').
            # Use a simpler approach: find start, then find "\nPAGES[" after a line that is just ")"
            rest = text[start:]
            # Each of these is one long line historically; match until newline after closing )
            m2 = re.match(
                r"PAGES\['" + re.escape(fname) + r"'\] = dict\(.*\)\n",
                rest,
                flags=re.S,
            )
            if not m2:
                # multi-line already replaced?
                if f"PAGES['{fname}'] = _short_course_page_meta" in text:
                    continue
                raise SystemExit(f"Could not parse assignment for {fname}")
            text = text[:start] + replacement + rest[m2.end():]
        else:
            text = new_text

    # Patch catalog session counts / hours / cards inside certificates body
    # Replace data-hours and session labels for the three courses in the certificates string.
    replacements = [
        ('data-cert="reentry" data-title="Coming Home Present" data-hours="8.0"',
         'data-cert="reentry" data-title="Coming Home Present" data-hours="3.0"'),
        ('data-cert="anger" data-title="Steady Under Pressure" data-hours="6.0"',
         'data-cert="anger" data-title="Steady Under Pressure" data-hours="3.0"'),
        ('data-cert="coparenting" data-title="Same Team" data-hours="6.0"',
         'data-cert="coparenting" data-title="Same Team" data-hours="3.0"'),
        ("var SESS = {fundamentals:'5', reentry:'8', anger:'6', coparenting:'6', manhood:'6'};",
         "var SESS = {fundamentals:'5', reentry:'12', anger:'12', coparenting:'12', manhood:'6'};"),
        ('<span class="fine mono">6 sessions</span></div>\n        <h3 style="margin-bottom:6px">Steady Under Pressure</h3>',
         '<span class="fine mono">12 sessions</span></div>\n        <h3 style="margin-bottom:6px">Steady Under Pressure</h3>'),
        ('<span class="fine mono">8 sessions</span></div>\n        <h3 style="margin-bottom:6px">Coming Home Present</h3>',
         '<span class="fine mono">12 sessions</span></div>\n        <h3 style="margin-bottom:6px">Coming Home Present</h3>'),
    ]
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)

    # Replace entire cert cards for the three courses inside PAGES['certificates.html']
    for key in COURSE_KEYS:
        course = courses[key]
        slug = course["slug"]
        card = cert_card_html(course)
        # Match existing card block by data-cert
        card_pat = re.compile(
            r'    <div class="cert-card" style="cursor:default" data-cert="'
            + re.escape(slug)
            + r'"[\s\S]*?</div>\n      <div class="cert-card-foot">[\s\S]*?</div>\n    </div>',
            re.M,
        )
        text2, n = card_pat.subn(card, text, count=1)
        if n == 1:
            text = text2
        else:
            print(f"warn: cert card for {slug} not replaced in build_pages.py ({n})")

    # Preview title for Steady Under Pressure
    text = text.replace(
        '<h3>The Alarm System</h3>\n        <p>&ldquo;The surge is a signal, not an order.&rdquo;</p>',
        '<h3>The Surge Is a Signal</h3>\n        <p>&ldquo;The surge is a signal, not an order.&rdquo;</p>',
    )

    # class.html metas if present
    text = text.replace(
        'data-metas="6 sessions &middot; Certificate of Completion|8 sessions &middot; Certificate of Completion|6 sessions &middot; Certificate of Completion"',
        'data-metas="12 sessions &middot; Certificate of Completion|12 sessions &middot; Certificate of Completion|12 sessions &middot; Certificate of Completion"',
    )

    build_pages_path.write_text(text, encoding="utf-8")
    print("patched", build_pages_path)


def _chrome_from_existing(sample_path: Path):
    """Reuse head/nav/trust-bar/footer from an existing forged course page."""
    raw = sample_path.read_text(encoding="utf-8")
    # Split: head through trust-bar end, then footer through scripts
    m = re.search(r"(?s)(.*?</div></div>\n)\n<section class=\"band\">", raw)
    if not m:
        # trust-bar closes then blank line then section
        m = re.search(r"(?s)(^.*?<div class=\"trust-bar\"[\s\S]*?</div></div>\n)", raw)
    if not m:
        raise SystemExit("Could not locate chrome prefix in %s" % sample_path)
    prefix = m.group(1)
    fm = re.search(r"(?s)(<footer>[\s\S]*)</html>\s*$", raw)
    if not fm:
        raise SystemExit("Could not locate footer in %s" % sample_path)
    suffix = fm.group(1) + "\n</html>\n"
    return prefix, suffix


def _retitle_prefix(prefix: str, title: str, desc: str, fname: str) -> str:
    prefix = re.sub(r"<title>.*?</title>", f"<title>{title} | Fathers.com</title>", prefix, count=1)
    # Some titles already include | Fathers.com in page_meta title
    prefix = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", prefix, count=1)
    prefix = re.sub(
        r'<meta name="description" content=".*?">',
        f'<meta name="description" content="{desc}">',
        prefix,
        count=1,
    )
    prefix = re.sub(
        r'<link rel="canonical" href="https://fathers-com-platform\.vercel\.app/.*?">',
        f'<link rel="canonical" href="https://fathers-com-platform.vercel.app/{fname}">',
        prefix,
        count=1,
    )
    for prop, val in [
        ("og:title", title),
        ("og:description", desc),
        ("og:url", f"https://fathers-com-platform.vercel.app/{fname}"),
        ("twitter:title", title),
        ("twitter:description", desc),
    ]:
        prefix = re.sub(
            rf'<meta property="{prop}" content=".*?">',
            f'<meta property="{prop}" content="{val}">',
            prefix,
            count=1,
        )
        prefix = re.sub(
            rf'<meta name="{prop}" content=".*?">',
            f'<meta name="{prop}" content="{val}">',
            prefix,
            count=1,
        )
    return prefix


def write_course_html_files(courses: dict) -> None:
    """Write standalone HTML using chrome cloned from an existing course page."""
    sample = ROOT / "course-steady-under-pressure.html"
    prefix0, suffix = _chrome_from_existing(sample)
    for key in COURSE_KEYS:
        course = courses[key]
        meta = page_meta(course)
        fname = course["html"]
        # page_meta title already includes ": the sessions"
        title = f"{meta['title']} | Fathers.com" if "| Fathers.com" not in meta["title"] else meta["title"]
        # Existing pages use "Title: the sessions | Fathers.com"
        title = f"{course['title']}: the sessions | Fathers.com"
        prefix = _retitle_prefix(prefix0, title, meta["desc"], fname)
        html = prefix + "\n" + meta["body"] + suffix
        # Ensure Courses nav stays active
        html = html.replace('href="certificates.html" >', 'href="certificates.html" class="active">')
        out = ROOT / fname
        out.write_text(html, encoding="utf-8")
        print("wrote", out)


def main():
    courses = load_courses()
    apply_to_build_pages(ROOT / "build_pages.py", courses)
    write_course_html_files(courses)
    print("done")


if __name__ == "__main__":
    main()
