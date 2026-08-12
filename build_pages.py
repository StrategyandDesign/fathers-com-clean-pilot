#!/usr/bin/env python3
"""Page generator for the Fathers.com static platform. Shared chrome, per-page bodies."""
import os
import re

# Absolute base URL for share cards and canonical links.
# CHANGE THIS ONE LINE if the site moves to a custom domain (e.g. https://www.fathers.com).
SITE_URL = "https://fathers-com-platform.vercel.app"
OG_IMAGE = SITE_URL + "/assets/img/og-image.jpg"

# Release stamp. Shown in the footer of every generated page and linked to
# changelog.html. Bump BOTH constants on every release, add a CHANGELOG entry
# below, regenerate, and upload. The stamp is the answer to "what version is
# live": read any page footer.
PLATFORM_VERSION = "4.16.2"
VERSION_DATE = "2026-08-11"

# v4.0 reposition flags (ADR-4: rollout is a data change, not a redesign).
# SHOW_MILITARY dark-launches the entire veteran surface: pages are not generated,
# routes are removed from nav and footers, and stale generated files are deleted.
# Flipping this back to True restores the vertical after a copy pass.
SHOW_MILITARY = False

# SHOW_MANHOOD_COURSE dark-stages The Man Before You (Manhood Track course,
# spec Rev 1, gated on Dr. Canfield review). While False the course page is
# not generated and no public surface mentions it. Flip to True on adoption:
# the page publishes, the catalog card appears, the detail CTA maps, and the
# track fit line names it. One line, one batch.
SHOW_MANHOOD_COURSE = False

# SHOW_DIRECTORY dark-launches the program directory until a rating methodology,
# appeals process, and counsel review exist (build-spec 4.7). SHOW_GIFT rests the
# gift-code surface for the MVP (build-spec 8.3). Both follow the stub pattern.
SHOW_DIRECTORY = False
SHOW_GIFT = False

# SHOW_GATHERINGS dark-launches the events surface exactly as SHOW_MILITARY does
# for veterans: the page is not generated, any stale file is deleted, and every
# route into it is stripped from the footer, the home page and the About page.
# Flip to True to restore it. Nothing is deleted from this file, so restoring
# is a one-word change.
SHOW_GATHERINGS = False

# SHOW_STORIES dark-launches the film surface the same way: pages are not
# generated, and every route into them is stripped from the nav and footer.
# Nothing is deleted from this file; flipping this back to True restores
# Stories whole when there is capacity to produce them.
SHOW_STORIES = False

# SHOW_EMPLOYERS dark-launches the employer surface the same way. The page and
# every route into it rest until the employer offer is ready to sell. Flip to
# True to restore it whole.
SHOW_EMPLOYERS = False
GATHERINGS_PAGES = {'gatherings.html'}
STORIES_PAGES = {'stories.html', 'story.html'}
EMPLOYERS_PAGES = {'employers.html'}
MILITARY_PAGES = {
    'veterans.html', 'veterans-hub.html', 'veterans-start.html', 'veterans-checkin.html',
    'veterans-module.html', 'veterans-resources.html', 'voice.html', 'share.html',
}

# Private / transactional pages: keep them out of Google's index. Everything else is indexable.
NOINDEX = {'dashboard.html', 'recover.html', 'report.html', 'organizations.html', 'share.html', 'account.html', 'plan.html', 'circles.html', 'player.html', 'checkout.html', 'enroll.html', 'login.html', 'veterans-hub.html', 'veterans-start.html', 'veterans-checkin.html', 'voice.html', 'find-a-program.html', 'classes.html', 'veterans-resources.html'}


def _esc(s):
    """Escape for an HTML attribute without breaking entities that are already there (e.g. &middot;)."""
    s = re.sub(r'&(?!#?\w+;)', '&amp;', s)
    return s.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')


def social_meta(fname, title, desc):
    """Open Graph + Twitter card + canonical + app icon + robots, per page."""
    url = SITE_URL + "/" + fname
    ttl = _esc(title + " | Fathers.com")
    ds = _esc(desc)
    robots = '<meta name="robots" content="noindex,follow">\n' if fname in NOINDEX else ''
    return (
        robots
        + f'<link rel="canonical" href="{url}">\n'
        + '<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">\n'
        + '<meta name="theme-color" content="#000000">\n'
        + '<meta property="og:type" content="website">\n'
        + '<meta property="og:site_name" content="Fathers.com">\n'
        + f'<meta property="og:title" content="{ttl}">\n'
        + f'<meta property="og:description" content="{ds}">\n'
        + f'<meta property="og:url" content="{url}">\n'
        + f'<meta property="og:image" content="{OG_IMAGE}">\n'
        + '<meta property="og:image:width" content="1200">\n'
        + '<meta property="og:image:height" content="630">\n'
        + '<meta property="og:image:alt" content="Fathers.com, know where you stand as a father">\n'
        + '<meta name="twitter:card" content="summary_large_image">\n'
        + f'<meta name="twitter:title" content="{ttl}">\n'
        + f'<meta name="twitter:description" content="{ds}">\n'
        + f'<meta name="twitter:image" content="{OG_IMAGE}">'
    )

HEAD = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} | Fathers.com</title>
<meta name="description" content="{desc}">
<link rel="icon" type="image/png" href="assets/img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Poppins:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<script>document.documentElement.dataset.theme={THEME};</script>
<link rel="stylesheet" href="assets/css/forge.css">
{meta}
</head>
<body>
'''

def nav(active='', mode='public'):
    if mode=='app':
        links = [('Home','dashboard.html'),('My Plan','plan.html'),('The Courses','certificates.html'),('Stories','stories.html'),('Circles','circles.html')]
        if not SHOW_STORIES: links = [l for l in links if l[1] != 'stories.html']
        active = {'Certificates':'The Courses','Classes':'The Courses'}.get(active, active)
    else:
        links = [('The Profile','profile.html'),('The Courses','certificates.html'),('Stories','stories.html'),('Log in','login.html')]
        if not SHOW_STORIES: links = [l for l in links if l[1] != 'stories.html']
        # Legacy page actives map onto the new public nav so highlighting stays sane.
        # Log in lives in .nav-links so the mobile MENU drawer can reach it (nav-right hide-m cannot).
        active = {'For Groups':'For Organizations','For Veterans':'For Organizations','Classes':'The Courses','Certificates':'The Courses','My Plan':'Home'}.get(active, active)
    lis = ''.join(f'<li><a href="{h}" {"class=\"active\"" if t==active else ""}>{t}</a></li>' for t,h in links)
    right = ('<a href="sponsor.html" class="hide-m">Sponsor</a><a class="btn btn-yellow btn-sm" href="profile.html">Start your Profile</a>'
             if mode=='public' else
             '<a href="#" data-open-search class="hide-m">Search</a><a href="sponsor.html" class="hide-m">Sponsor</a><a href="account.html" class="avatarchip" title="Account" style="text-decoration:none">M</a>')
    return f'''<nav class="nav"><div class="container nav-inner">
<a class="brand" href="index.html"><img class="lg-dark" src="assets/img/logomark-light.png" alt="Fathers.com logomark"><img class="lg-light" src="assets/img/logomark-dark.png" alt="Fathers.com logomark"><b>Fathers.com</b></a>
<ul class="nav-links" id="fc-nav-links">{lis}</ul>
<div class="nav-right">{right}<button class="themeswitch" data-themeswitch aria-label="Switch palette" title="Switch palette"><span class="tsw-dot"></span></button><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="fc-nav-links">MENU</button></div>
</div></nav>
'''

FOOT = '''<footer><div class="container">
<div class="footgrid">
  <div><a class="brand" href="index.html" style="margin-bottom:16px"><img class="lg-dark" src="assets/img/logomark-light.png" alt="" style="height:34px"><img class="lg-light" src="assets/img/logomark-dark.png" alt="" style="height:34px"><b>Fathers.com</b></a>
    <p class="small" style="margin-top:14px;max-width:32ch">Presence is a skill. Train it.</p>
    <p class="fine" style="margin-top:14px">PO Box 996, Tontitown, AR 72770<br>Team@Fathers.com</p></div>
  <div><h4>Measure</h4><ul><li><a href="profile.html">The Keystone Profile</a></li><li><a href="research.html">The Research</a></li></ul></div>
  <div><h4>Train &amp; Prove</h4><ul><li><a href="stories.html">Stories</a></li><li><a href="certificates.html">The Courses</a></li><li><a href="verify.html">Verify a credential</a></li></ul></div>
  <div><h4>Certification</h4><ul><li><a href="organizations.html">Certified Organizations</a></li><li><a href="facilitators.html">Certified Facilitators</a></li><li><a href="groups.html">Groups &amp; Circles</a></li><li><a href="employers.html">Employers</a></li><li><a href="sponsor.html">Sponsor a Man</a></li></ul></div>
  <div><h4>Company</h4><ul><li><a href="about.html">About NCF</a></li><li><a href="research.html">Research</a></li><li><a href="gatherings.html">Gatherings</a></li><li><a href="mailto:Team@Fathers.com">Contact</a></li></ul></div>
  <div><h4>Legal</h4><ul><li><a href="terms.html">Terms</a></li><li><a href="privacy.html">Privacy</a></li><li><a href="security.html">Security</a></li><li><a href="verify.html">Verify a credential</a></li></ul></div>
</div>
<div style="margin-top:48px;max-width:420px"><h4 style="font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ash);margin-bottom:12px">One useful thing for fathers, weekly</h4>
<form class="row" data-lead="newsletter" data-done="You are on the list. One useful thing, weekly."><input class="input" name="email" type="email" required placeholder="Email address"><button class="btn btn-secondary btn-sm">Send it</button></form></div>
<div class="footbottom"><span class="fine">Fathers.com is a program of the National Center for Fathering, a 501(c)(3) nonprofit.</span><span class="fine"><a class="link ash" href="#" onclick="if(window.FCHelp){FCHelp.show();return false;}">Help</a></span><span class="fine">© <span data-year></span> National Center for Fathering</span><span class="fine"><a class="link" href="changelog.html" style="font-family:var(--font-mono)">v''' + PLATFORM_VERSION + ''' · ''' + VERSION_DATE + '''</a></span></div>
</div></footer>
<script src="assets/js/config.js"></script>
<script src="assets/js/supabase-client.js"></script>
<script src="assets/js/roles.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/help.js"></script>
'''

PAGES = {}

# Release notes rendered on changelog.html. Newest first. Public copy:
# POSITIONING.md section 9 language rules apply.
CHANGELOG = [
    ("4.16.2", "2026-08-11",
     "The Studio tells the platform's truth. Its courses tab now reads "
     "the real course tables: actual publish states, actual session and "
     "film counts, a link to each live course page, and the content rail "
     "named as how courses ship. The legacy class-library editor and its "
     "phantom catalog are retired."),
    ("4.16.1", "2026-08-11",
     "The course catalog reads clean: every card carries its boundary "
     "inside itself, session counts print once, the free foot lines up "
     "across all four, and card contents anchor top and bottom without "
     "the void between. The Guide now minimizes to its icon instead of "
     "hiding; the question mark never leaves the corner."),
    ("4.16.0", "2026-08-11",
     "Membership steps out of the course path everywhere. The flagship "
     "workbook is included free with the course, the course page lists "
     "what is free instead of what a membership includes, and checkout "
     "becomes what it always was underneath: Support the work, a "
     "founding-supporter membership that funds the films, the kits, and "
     "free seats, and never gates a thing."),
    ("4.15.3", "2026-08-11",
     "The Guide's launcher wears the site's colors: a white question mark "
     "on black. The panel it opens stays light and high-contrast."),
    ("4.15.2", "2026-08-11",
     "The content seed speaks the database's actual language: the video "
     "column by its real name, a publish flag the schema was missing, "
     "and the unique keys that make every re-run land in place."),
    ("4.15.1", "2026-08-11",
     "The whole course seed compiles to one SQL file that runs in the "
     "dashboard editor: five courses, every checkpoint, every final, and "
     "the publish flags, in a single idempotent paste."),
    ("4.15.0", "2026-08-11",
     "The whole course system stands before the first film. Every course "
     "carries its full checkpoints and written finals; a session without "
     "its film shows the placeholder card, links the written session, and "
     "opens its checkpoint immediately; passing unlocks the next session; "
     "and the room gains Previous and Next arrows, keyboard included, so "
     "a man moves back and forward through his sessions freely. When each "
     "film lands, one import swaps it in and measured time begins."),
    ("4.14.1", "2026-08-11",
     "The Guide reads the way help should: dark text on a white panel at "
     "high contrast, the path shown as an honest eight-step map that only "
     "says you are here when the page itself proves it, and no topic "
     "listed twice."),
    ("4.14.0", "2026-08-11",
     "The Guide arrives: a floating help layer on every page, written for "
     "one reader, the father, with a path stepper to the certificate, "
     "topics for the screen he is on, and a way back after hiding it. And "
     "every course now shows its sessions at a glance: an index atop each "
     "course page and an expandable preview on every catalog card, each "
     "session with its one-line thread."),
    ("4.13.2", "2026-08-11",
     "The public registry stands on a real table. The legacy view "
     "silently hid revoked serials as not-found; now a revoked serial "
     "says revoked, which is what gives staying on the registry its "
     "meaning."),
    ("4.13.1", "2026-08-11",
     "Every server function is a single self-contained file, so it "
     "deploys from the dashboard editor as pasted."),
    ("4.13.0", "2026-08-11",
     "Launch hardening. The review engine ships as a real file the page "
     "actually loads; every certificate now carries a name the "
     "facilitator confirms, and signing refuses an empty one; serials "
     "grow to a billion-value space; the public registry answers through "
     "a rate-limited lookup so names cannot be harvested, and the record "
     "it shows carries contact hours, measured minutes, and how identity "
     "was confirmed; a man who misses a checkpoint three times gets a "
     "human sentence and a clock instead of a broken screen; and a fresh "
     "database now cold-starts from the repo with one script."),
    ("4.12.2", "2026-08-11",
     "The enroll page tells the pilot truth: identity is attested in "
     "person by the facilitator, sessions are completed and measured on "
     "the server, and the panel no longer echoes an hours figure from "
     "the address bar."),
    ("4.12.1", "2026-08-11",
     "The lock is installed and the approval path exists. The database "
     "rejects any client write to the integrity tables; the answer key is "
     "unreadable and checkpoint attempts are budgeted; time credits only "
     "against a real film on the course being watched; submitting for "
     "approval requires the work to actually be done, and the evidence "
     "freezes into the record; a facilitator can now review, approve with "
     "contact hours, return with a note, or sign and mint the serial. The "
     "release gate now scans every script and builder for claim language "
     "and fails if any referenced file is missing, so the repository is "
     "provably the whole application."),
    ("4.12.0", "2026-08-11",
     "The record's authority moves to the server: grading, time on task, "
     "and award status now go through server functions, and the client "
     "can no longer author any of them. Claims got corrected to match: "
     "hours figures are gone until they are measured, instrument numbers "
     "live in one canonical block on the Research page, norm-referenced "
     "claims are withdrawn until a technical summary publishes, the "
     "overlay sections are deleted, the testimonial is deleted, and the "
     "FAQ now gives the plain secular answer. The program directory and "
     "gift codes rest dark for the pilot."),
    ("4.11.9", "2026-08-11",
     "Two dead ends healed and one integrity gate added. Enrolling in any "
     "course works again: the retired waitlist branch that blanked the "
     "enroll page is gone. A course whose films are in production points "
     "an enrolled man to his live written sessions instead of an empty "
     "room. And hours can only be logged against a real film: the demo "
     "simulate control no longer exists in live mode."),
    ("4.11.8", "2026-08-11",
     "The signed-in catalog tells the same truth as the page: correct "
     "hours, session counts, an honest status pill, and no course ever "
     "drops out while the database catches up."),
    ("4.11.7", "2026-08-11",
     "The homepage measure and start-free sections are redesigned: one "
     "primary action instead of two competing buttons, a four-step line "
     "that shows the whole system at a glance, an honest sample label on "
     "the score card, and a cleaner ledger of what free includes."),
    ("4.11.6", "2026-08-11",
     "The flagship course states its audience like the rest of the slate."),
    ("4.11.5", "2026-08-11",
     "The Manhood Track is told the truth about its courses. Fundamentals "
     "and Steady Under Pressure serve every man today; Coming Home Present "
     "and Same Team are built for fathers, and say so. The draft Manhood "
     "instrument runs while its review continues, and the research page now "
     "says exactly that."),
    ("4.11.4", "2026-08-11",
     "The platform promises the record, not the outcome. The certificate "
     "band, the referral card, the lesson note, and the about heading now "
     "say exactly what we certify, and leave the change where it lives: "
     "with him."),
    ("4.11.3", "2026-08-11",
     "The platform counts its own slate correctly: four courses, everywhere "
     "it speaks of them, with true session counts beside each."),
    ("4.11.2", "2026-08-11",
     "The certificate specimen now reads as a specimen: your name where "
     "yours will go, the word itself on the document, and a masked serial. "
     "Every issued certificate carries a live serial that resolves at "
     "verify."),
    ("4.11.1", "2026-08-11",
     "Waitlists retire. Every course is live in written sessions, the course "
     "detail points straight to them, and the films arrive on their own "
     "schedule."),
    ("4.11.0", "2026-08-11",
     "All three certificate courses publish their complete written sessions: "
     "Coming Home Present in eight, Steady Under Pressure in six, Same Team in "
     "six. Films upload as they finish. The education line and the facilitator "
     "referral protocol are now published, with a downloadable copy. The "
     "verify, legal, research, and groups pages are tightened."),
    ("4.10.1", "2026-08-10",
     "One Dashboards button, as intended. The employer surface rests for "
     "now; certification and verification are unchanged."),
    ("4.10.0", "2026-08-10",
     "Stories are resting for now. The Profile, the plan, and the courses "
     "carry the front of the house; the films return when there is room to "
     "make them well."),
    ("4.9.0", "2026-08-10",
     "Coming Home Present grows a module: catching up on how your child grew "
     "while you were away. Facilitator materials add guidance for a man in "
     "distress, with a clear next step and a referral path. Course completion "
     "modes and per-program language are now recorded by the platform."),
    ("4.8.0", "2026-08-10",
     "Precision. The Profile now states its lineage plainly: grown from the "
     "Personal Fathering Profile research program of Dr. Ken Canfield. "
     "Norming language states magnitude while the full technical "
     "documentation is prepared. A funding guide joins the partner kit."),
    ("4.7.0", "2026-08-10",
     "The engine opens to partner programs. A program with its own standard "
     "can carry its own signing authority, its own serial prefix, and its "
     "own entry page on the same verification spine. The standard stays the "
     "standard: a Certificate of Completion, publicly verifiable, revocable, "
     "education only."),
    ("4.6.0", "2026-08-10",
     "The verification sheet. A Certified Facilitator can download one sheet "
     "of the men he claimed, their certificate serials, and current status, "
     "for any coordinator who requires proof. The facilitator quick start, "
     "ceremony guide, and supervision checklist join the partner kit."),
    ("4.5.1", "2026-08-10",
     "The version stamp. Every page now carries its release number in the "
     "footer, linked to this page."),
    ("4.5.0", "2026-08-10",
     "Same Team, a fourth course on co-parenting, joins the catalog as coming "
     "soon. The education line enters the positioning record: we certify "
     "education, and the boundaries are written down. Partner and operations "
     "documents enter the repository. Retired pages now route home."),
    ("4.0", "2026-07",
     "The reposition. Certified Organizations and Certified Facilitators "
     "carry the standard. Every course is free to the man who takes it. "
     "Course seats flow through claims placed by certified people. A "
     "finished Profile now survives the sign-in round trip."),
    ("Foundation", "2026",
     "The Keystone Father Profile, the ninety-day plan, the film library, "
     "the Certificate of Completion with public verification, and the "
     "certification registries."),
]

_cl = ['<section><div class="container" style="max-width:720px;padding-top:34px">',
       '<div class="eyebrow" style="margin-bottom:12px">RELEASE NOTES</div>',
       '<h1 class="d-36" style="margin-bottom:10px">What\'s new.</h1>',
       '<p class="small" style="color:var(--ash);margin-bottom:34px">The live version is printed in the footer of every page. This page is the record of what shipped.</p>']
for _v, _d, _t in CHANGELOG:
    _label = _v if _v == "Foundation" else "v" + _v
    _cl.append('<div style="margin-bottom:26px"><h3 style="margin-bottom:6px">' + _label
               + ' <span class="fine" style="color:var(--ash);font-family:var(--font-mono)">· ' + _d + '</span></h3>'
               + '<p class="small" style="color:var(--ash)">' + _t + '</p></div>')
_cl.append('</div></section>')

# Engine verticals (v4.7.0): a partner program with its own standard gets its
# own entry page as a page-set, no app rewrite. Each entry below renders
# <slug>.html with the vertical's name, headline, and authority line. Pair it
# with a platform_verticals row (migration 20260810140000) so its
# certificates mint under its prefix with its signing authority, and with an
# instrument in Studio carrying its norms_authority. Empty list = NCF-only
# surface, zero output change. Example:
# VERTICALS = [dict(slug='athlete-fathers', name='Athlete Fathers',
#     eyebrow='THE ATHLETE FATHERS PROGRAM',
#     headline='Train fatherhood the way you train.',
#     blurb='A measured profile, a plan, cohort training with your crew, and a certificate anyone can verify.',
#     authority_name='Program Authority Name',
#     authority_line='The Athlete Fathers standard is carried by its own authority on its own instrument, proven on the same verification spine.')]
VERTICALS = []

for _v in VERTICALS:
    PAGES[_v['slug'] + '.html'] = dict(
        title=_v['name'], desc=_v['blurb'], active='', mode='public', body=(
        '<section class="hero tight"><div class="container" style="max-width:760px">'
        '<div class="eyebrow" style="margin-bottom:14px">' + _v.get('eyebrow', _v['name'].upper()) + '</div>'
        '<h1 class="d-44" style="margin-bottom:14px">' + _v['headline'] + '</h1>'
        '<p style="color:var(--ash);max-width:56ch;margin-bottom:10px">' + _v['blurb'] + '</p>'
        '<p class="fine" style="color:var(--ash);max-width:60ch;margin-bottom:26px">' + _v.get('authority_line', '') + '</p>'
        '<div class="row wrap" style="gap:12px">'
        '<a class="btn btn-yellow" href="certificates.html">See the courses</a>'
        '<a class="btn btn-secondary" href="mailto:Team@Fathers.com">Bring a cohort</a>'
        '</div></div></section>'
        '<section class="tight"><div class="container"><div class="grid3">'
        '<div class="card" style="padding:26px"><div class="eyebrow" style="margin-bottom:10px">MEASURE</div><p class="small" style="color:var(--ash)">A profile built for this community, on its own instrument, stating who standardized it and on whom.</p></div>'
        '<div class="card" style="padding:26px"><div class="eyebrow" style="margin-bottom:10px">TRAIN</div><p class="small" style="color:var(--ash)">Cohort courses led by certified facilitators. Sessions logged, checkpoints, a final read by the facilitator.</p></div>'
        '<div class="card" style="padding:26px"><div class="eyebrow" style="margin-bottom:10px">PROVE</div><p class="small" style="color:var(--ash)">A Certificate of Completion under this program\'s own serial and signing authority, verifiable by anyone in ten seconds, revocation always shown.</p></div>'
        '</div></div></section>'))

PAGES['changelog.html'] = dict(title='What\'s new', desc='Release notes for the Fathers.com platform.', active='', mode='public', body='\n'.join(_cl))

# ================================================== index.html (P1)
PAGES['index.html'] = dict(title='Know where you stand', desc='Take the free Keystone Father Profile. About twenty minutes. Four scores, one honest read, and a ninety-day plan built for you.', active='', mode='public', body='''
<header class="hero"><div class="container split">
  <div>
    <div class="eyebrow" style="margin-bottom:18px">FATHERS.COM</div>
    <h1 class="d-48" style="font-weight:700;letter-spacing:-.02em">Know where you stand.</h1>
    <p class="lead" style="margin:22px 0 28px">Start with the free Keystone Father Profile. About twenty minutes. You get scores on the four things that matter, and a ninety-day plan built from your answers&mdash;not a lecture, not a label.</p>
    <div class="hero-cta" style="display:flex;flex-direction:column;align-items:flex-start;gap:14px;max-width:420px">
      <a class="btn btn-yellow" href="profile.html" style="width:100%;text-align:center">Start free Profile &middot; about 20 min</a>
      <div class="row wrap" style="gap:16px;align-items:center">
        <a class="btn btn-secondary btn-sm" href="login.html">Log in</a>
        <a class="link ash" href="organizations.html" style="font-size:13px">I have a facilitator</a>
      </div>
      <p class="fine" style="margin:0;color:var(--ash)">Free for participants &middot; Facilitator-led &middot; Certificate you can verify</p>
      <p class="fine" style="margin:0"><a class="link ash" href="profile.html?assessment=keystone-manhood-profile" style="font-size:12px">Preparing, mentoring, or growing? The Manhood track</a></p>
    </div>
  </div>
  <div class="heromarquee" aria-hidden="true">
    <div class="hm-col hm-col-a">
      <div class="hm-track">
        <figure class="hm-card"><img src="assets/img/photos/hero-01.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-03.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-05.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/testimonial-01.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-07.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-01.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-03.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-05.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/testimonial-01.jpg" alt=""></figure>
      </div>
    </div>
    <div class="hm-col hm-col-b">
      <div class="hm-track hm-track-slow">
        <figure class="hm-card"><img src="assets/img/photos/hero-02.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-06.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-04.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-02.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-06.jpg" alt=""></figure>
        <figure class="hm-card"><img src="assets/img/photos/hero-04.jpg" alt=""></figure>
      </div>
    </div>
  </div>
</div></header>

<section class="tight" style="padding-top:8px;padding-bottom:8px"><div class="container">
  <div class="eyebrow brass" style="margin-bottom:18px">HOW IT WORKS</div>
  <div class="grid-3" style="gap:18px">
    <div class="card" style="padding:22px">
      <div class="mono ash" style="margin-bottom:8px">01</div>
      <b>Profile</b>
      <p class="small" style="margin-top:8px;color:var(--ash)">Take the free Keystone Father Profile. About twenty minutes. Your results stay private.</p>
    </div>
    <div class="card" style="padding:22px">
      <div class="mono ash" style="margin-bottom:8px">02</div>
      <b>Plan</b>
      <p class="small" style="margin-top:8px;color:var(--ash)">Get a ninety-day plan built from your gaps&mdash;small moves you can keep on a busy week.</p>
    </div>
    <div class="card" style="padding:22px">
      <div class="mono ash" style="margin-bottom:8px">03</div>
      <b>Course <span class="fine" style="font-weight:400">(with a facilitator)</span></b>
      <p class="small" style="margin-top:8px;color:var(--ash)">When a Certified Facilitator claims your seat, enroll free and earn a certificate anyone can verify.</p>
    </div>
  </div>
</div></section>

<section class="band"><div class="container split" style="align-items:center">
  <div>
    <div class="eyebrow" style="margin-bottom:14px">MEASURE &middot; YOUR BASELINE</div>
    <h2 class="d-36">Four things you can train.</h2>
    <p style="color:var(--ash);margin:18px 0 28px;max-width:52ch">Involvement. Consistency. Awareness. Nurturance. The Keystone Father Profile measures all four. You get a score, an honest read on where you stand, and a ninety-day plan built from your gaps. Free, before you pay for anything.</p>
    <div style="display:flex;flex-wrap:wrap;border-top:1px solid rgba(127,127,127,.25)">
      <div style="flex:1 1 46%;min-width:150px;padding:14px 18px 14px 0;border-bottom:1px solid rgba(127,127,127,.25)"><div class="fine mono" style="letter-spacing:.1em;color:var(--ash)">01</div><div class="small" style="margin-top:4px"><b>Measure</b></div><div class="fine" style="color:var(--ash);margin-top:2px">Your baseline, in one sitting.</div></div>
      <div style="flex:1 1 46%;min-width:150px;padding:14px 18px 14px 0;border-bottom:1px solid rgba(127,127,127,.25)"><div class="fine mono" style="letter-spacing:.1em;color:var(--ash)">02</div><div class="small" style="margin-top:4px"><b>Plan</b></div><div class="fine" style="color:var(--ash);margin-top:2px">Ninety days, built from your gaps.</div></div>
      <div style="flex:1 1 46%;min-width:150px;padding:14px 18px 14px 0;border-bottom:1px solid rgba(127,127,127,.25)"><div class="fine mono" style="letter-spacing:.1em;color:var(--ash)">03</div><div class="small" style="margin-top:4px"><b>Train</b></div><div class="fine" style="color:var(--ash);margin-top:2px">Cohorts led by men who lived it.</div></div>
      <div style="flex:1 1 46%;min-width:150px;padding:14px 18px 14px 0;border-bottom:1px solid rgba(127,127,127,.25)"><div class="fine mono" style="letter-spacing:.1em;color:var(--ash)">04</div><div class="small" style="margin-top:4px"><b>Verify</b></div><div class="fine" style="color:var(--ash);margin-top:2px">Hours logged. A serial anyone can check.</div></div>
    </div>
    <a class="link" href="profile.html" style="display:inline-block;margin-top:20px">Start your Profile &rarr;</a>
  </div>
  <div class="card" style="padding:32px">
    <div class="eyebrow" style="margin-bottom:16px">THE FOUR DIMENSIONS</div>
    <div class="bigscore" style="font-size:72px;margin-bottom:24px">71</div>
    <div class="domain"><div class="row1"><span>Involvement</span><span class="score">78</span></div><div class="bar"><span style="width:78%"></span></div></div>
    <div class="domain gap"><div class="row1"><span>Consistency</span><span class="score">55</span></div><div class="bar"><span style="width:55%"></span></div></div>
    <div class="domain"><div class="row1"><span>Awareness</span><span class="score">74</span></div><div class="bar"><span style="width:74%"></span></div></div>
    <div class="domain" style="margin-bottom:0"><div class="row1"><span>Nurturance</span><span class="score">77</span></div><div class="bar"><span style="width:77%"></span></div></div>
    <p class="fine" style="color:var(--ash);margin:20px 0 0">A sample baseline, for illustration. Your numbers will be your own.</p>
  </div>
</div></section>

<section class="band tight" id="start-free"><div class="container split" style="align-items:center">
  <div>
    <div class="eyebrow" style="margin-bottom:12px">START FREE</div>
    <h2 class="d-28" style="margin-bottom:14px">Start free. Grow on a plan.</h2>
    <p class="fine" style="color:var(--ash);max-width:46ch;margin-bottom:24px">Every course is free to the man who takes it. Sponsorship funds seats and materials inside certified programs: a facilitator-led cohort with logged sessions and a final, not a self-serve video. The completion is still his to earn.</p>
    <div class="row wrap" style="align-items:center;gap:18px"><a class="btn btn-yellow" href="profile.html">Start your Profile</a><a class="link" href="sponsor.html">Or sponsor a man &rarr;</a></div>
  </div>
  <div>
    <div class="fine mono" style="letter-spacing:.08em;margin-bottom:4px;color:var(--ash)">WHAT FREE INCLUDES</div>
    <div style="display:flex;gap:14px;align-items:baseline;padding:13px 0;border-top:1px solid rgba(127,127,127,.25)"><span class="fine mono" style="color:var(--ash);min-width:22px">01</span><span class="small">Your Keystone Profile and ninety-day plan</span></div>
    <div style="display:flex;gap:14px;align-items:baseline;padding:13px 0;border-top:1px solid rgba(127,127,127,.25)"><span class="fine mono" style="color:var(--ash);min-width:22px">02</span><span class="small">Dr. Canfield&rsquo;s Fundamentals of Fathering</span></div>
    <div style="display:flex;gap:14px;align-items:baseline;padding:13px 0;border-top:1px solid rgba(127,127,127,.25)"><span class="fine mono" style="color:var(--ash);min-width:22px">03</span><span class="small">Classes taught by fathers who lived it</span></div>
    <div style="display:flex;gap:14px;align-items:baseline;padding:13px 0;border-top:1px solid rgba(127,127,127,.25)"><span class="fine mono" style="color:var(--ash);min-width:22px">04</span><span class="small">A Certificate of Completion when you finish the work, at no cost</span></div>
    <div style="display:flex;gap:14px;align-items:baseline;padding:13px 0;border-top:1px solid rgba(127,127,127,.25)"><span class="fine mono" style="color:var(--ash);min-width:22px">05</span><span class="small">Your certificate&rsquo;s public verification page</span></div>
    <div style="display:flex;gap:14px;align-items:baseline;padding:13px 0;border-top:1px solid rgba(127,127,127,.25);border-bottom:1px solid rgba(127,127,127,.25)"><span class="fine mono" style="color:var(--ash);min-width:22px">06</span><span class="small">30-day money-back guarantee on anything paid</span></div>
  </div>
</div></section>

<section><div class="container">
  <div class="billboard">
    <a class="slot r-21x9 play-overlay filled" data-slot="IMG-P1-BILL-01" href="class.html" aria-label="Watch The Fundamentals of Fathering"><img src="assets/img/photos/billboard-home.jpg" alt="A father with his son"><span class="tri"></span></a>
    <div class="overlay">
      <div class="eyebrow" style="margin-bottom:12px">TRAIN &middot; THE FLAGSHIP CLASS</div>
      <h2 class="d-36" style="margin:0 0 8px">The Fundamentals of Fathering</h2>
      <p class="small" style="margin-bottom:18px">The Keystone Profile grows out of the work of Dr. Ken Canfield, founder of the National Center for Fathering. Start with his flagship class on presence. Free.</p>
      <a class="btn btn-secondary play" href="class.html">Watch The Fundamentals</a>
    </div>
  </div>
</div></section>

<section class="tight"><div class="container">
  <div class="eyebrow" style="margin-bottom:12px">TRAIN &middot; YOUR PLAN</div>
  <h2 class="d-28" style="margin-bottom:12px">A plan you actually work.</h2>
  <p style="color:var(--ash);margin:0 0 24px;max-width:56ch">Your Profile becomes a ninety-day plan, one clear step at a time. New films and lessons every month, on the drive or on the couch. The Profile and your plan are always free.</p>
  <div class="grid-3" id="homeclasses" style="margin-top:6px">
    <a class="card" href="class.html" style="padding:0;overflow:hidden;text-decoration:none">
      <div class="slot r-2x3 filled" data-slot="IMG-P1-CAT-1" style="max-height:280px"><img src="assets/img/photos/action-01.jpg" alt="Fathering Fundamentals"></div>
      <div style="padding:20px 22px">
        <div class="row between" style="margin-bottom:8px"><span class="pill">FREE COURSE</span><span class="fine mono">5 sessions</span></div>
        <h3 style="margin-bottom:6px">Fathering Fundamentals</h3>
        <p class="fine" style="color:var(--ash)">The 7 Secrets of Effective Fathers, taught by Dr. Ken Canfield. Five sessions, usable the same night. Free to train; completion recognized.</p>
      </div>
    </a>
    <a class="card" href="course-steady-under-pressure.html" style="padding:0;overflow:hidden;text-decoration:none">
      <div class="slot r-2x3 filled" data-slot="IMG-P1-CAT-2" style="max-height:280px"><img src="assets/img/photos/action-02.jpg" alt="Steady Under Pressure"></div>
      <div style="padding:20px 22px">
        <div class="row between" style="margin-bottom:8px"><span class="pill">SESSIONS LIVE</span><span class="fine mono">6 sessions</span></div>
        <h3 style="margin-bottom:6px">Steady Under Pressure</h3>
        <p class="fine" style="color:var(--ash)">Steadiness, trained. All six written sessions are live; films are in production.</p>
      </div>
    </a>
    <a class="card" href="course-coming-home-present.html" style="padding:0;overflow:hidden;text-decoration:none">
      <div class="slot r-2x3 filled" data-slot="IMG-P1-CAT-3" style="max-height:280px"><img src="assets/img/photos/community-01.jpg" alt="Coming Home Present"></div>
      <div style="padding:20px 22px">
        <div class="row between" style="margin-bottom:8px"><span class="pill">SESSIONS LIVE</span><span class="fine mono">8 sessions</span></div>
        <h3 style="margin-bottom:6px">Coming Home Present</h3>
        <p class="fine" style="color:var(--ash)">Presence after time away. All eight written sessions are live; films are in production.</p>
      </div>
    </a>
  </div>
  <p style="margin-top:20px"><a class="link" href="certificates.html">See the courses</a></p>
</div></section>

<section class="tight" style="padding:10px 0 34px"><div class="container">
  <div class="row wrap" style="gap:26px;justify-content:center;text-align:center">
    <span class="fine">Change measured per man, baseline to exit</span><span class="fine ash">&middot;</span><span class="fine">Built by the National Center for Fathering since 1990</span><span class="fine ash">&middot;</span><span class="fine">Every credential publicly verifiable</span>
  </div>
</div></section>

<section class="band-brass"><div class="container split">
  <div>
    <div class="eyebrow brass" style="margin-bottom:14px">PROVE &middot; THE CERTIFICATE OF COMPLETION</div>
    <h2 class="d-36" style="font-size:32px">Proof you did the work.</h2>
    <p style="color:var(--ash);margin:16px 0 26px;max-width:50ch">Checkpoints passed, a written final reviewed by the facilitator who led him, and a serial any court, program, or employer can confirm online. Signed by Dr. Ken Canfield and the Certified Facilitator who led your cohort. Free to every man who earns it.</p>
    <a class="btn btn-secondary" href="certificates.html">See the Certificate</a>
    <p class="fine" style="margin-top:16px">Run a program? Become a Certified Organization and your facilitators present these at completion. <a class="link ash" href="organizations.html" style="font-size:12px">Get certified</a>.</p>
  </div>
  <div class="card brass-card">
    <div class="row" style="gap:20px">
      <div class="slot r-1x1 filled" data-slot="IMG-P0-CARD-03" style="flex:0 0 84px"><img src="assets/img/photos/hero-05.jpg" alt="A father"></div>
      <div><h3 style="margin-bottom:6px">Certificate of Completion &middot; Fathering Fundamentals</h3>
        <div class="mono small">5 sessions &middot; facilitator-verified</div>
        <div class="mono fine" style="margin-top:8px">FC-2026-000000</div></div>
    </div>
  </div>
</div></section>





<section><div class="container split">
  <div>
    <div class="eyebrow" style="margin-bottom:14px">GATHERINGS</div>
    <h2 class="d-36" style="font-size:32px">We gather fathers in real life.</h2>
    <p style="color:var(--ash);margin:16px 0 26px;max-width:52ch">The work is not only on a screen. Fathers.com hosts gatherings that bring men, mentors, and the people who lead them into the same room. Get notified about a gathering near you.</p>
  </div>
  <div>
    <a class="btn btn-secondary" href="gatherings.html">See gatherings</a>
    <p class="fine" style="margin-top:12px">One or two flagship events to start. Bring one to your city.</p>
  </div>
</div></section>



<section><div class="container" style="max-width:820px">
  <div class="eyebrow" style="margin-bottom:12px">QUESTIONS</div>
  <h2 class="d-28" style="margin-bottom:24px">Frequently asked questions</h2>
  <details open><summary>What is Fathers.com?</summary><div class="body">Fathers.com is the home of the Keystone Standard, from the National Center for Fathering. Men measure where they stand and complete the courses free. NCF certifies the organizations and facilitators who lead them, and every man who finishes holds a Certificate of Completion anyone can verify. Programs and agencies use the same standard to show whether men are changing.</div></details>
<details><summary>Who gets certified?</summary><div class="body">Organizations and facilitators. An organization earns Certified status against a published standard. A facilitator earns the Certified Facilitator credential through training, an exam, and a supervised first cohort. The man who completes a course receives a Certificate of Completion: earned, serialed, signed, and free to him. Certification is the institutional layer. Completion is his.</div></details>
  <details><summary>How much does it cost?</summary><div class="body">For the man doing the work: nothing. The Keystone Profile, the ninety-day plan, the courses, and the Certificate of Completion are free. Organizations pay for certification and facilitator credentialing. An optional founding-supporter membership funds the film library: $79 a year at founding pricing, $120 after, with a 30-day money-back guarantee. It funds the work; it never gates it.</div></details>
  <details><summary>How does the Keystone Profile work?</summary><div class="body">The full Keystone Father Profile, in one sitting. The exact item and scale counts, the response format, and the measured median completion time live on the <a class="link" href="research.html">Research page</a>. You get four domain scores, an overall baseline, and a plan built from your answers. Your results are yours. We never share them.</div></details>
  <details><summary>Do you rate other programs?</summary><div class="body">No. We certify organizations and facilitators against our own published standard, and we publish who currently holds that certification and who has had it revoked. We do not rate or rank programs that are not certified with us.</div></details>
  <details><summary>Are the Certificates of Completion accepted by courts?</summary><div class="body">Each certificate carries logged sessions, passed checkpoints, and a public verification page. Acceptance is decided by each court or program, so confirm with yours before enrolling.</div></details>
  <details><summary>Is this religious?</summary><div class="body">No. Fathers.com is a secular education program. The courses are built on parenting and behavioral research and are open to men of any belief or none. Some certified organizations are faith-based and may add their own material in their own rooms; that content is theirs, not ours, and it is never part of the course requirements or the Certificate of Completion.</div></details>
</div></section>
''')

# ================================================== profile.html (P2)
PAGES['report.html'] = dict(title='Your Written Report', desc='Every dimension: what it measures, where you stand, and your first moves.', active='', mode='public', body='''
<section class="tight" style="padding-top:36px"><div class="container">
  <div id="rpRoot">
    <div class="center" style="padding:80px 0">
      <div class="eyebrow" style="margin-bottom:12px">PREPARING YOUR REPORT</div>
      <p class="ash">One moment.</p>
    </div>
  </div>
</div></section>
<script src="assets/js/journey.js"></script>
<script src="assets/js/keystone-data.js"></script>
<script src="assets/js/keystone-full.js"></script>
<script src="assets/js/keystone-manhood-data.js"></script>
<script src="assets/js/assessment-registry.js"></script>
<script src="assets/js/plan-engine.js"></script>
<script src="assets/js/keystone-report.js"></script>
''')

PAGES['profile.html'] = dict(title='The Keystone Father Profile', desc='About twenty minutes. Four scores. One plan.', active='', mode='public', nochrome=True, body='''
<div id="ksIntro" style="max-width:680px;margin:0 auto;padding:64px 24px 40px;text-align:center">
  <div class="eyebrow" style="margin-bottom:16px">THE KEYSTONE PROFILE</div>
  <h1 class="d-36" style="margin-bottom:14px">Twenty minutes that shape the next ninety days.</h1>
<p class="fine" style="max-width:60ch;margin:14px 0 0;color:var(--ash)">The Keystone Father Profile is an educational tool, not a clinical, diagnostic, or medical instrument, and it is not a substitute for professional care. If you are carrying something heavy, tell your facilitator; connecting you with the right help, the same day, is part of the job.</p>

  <p style="color:var(--ash);max-width:52ch;margin:0 auto 28px">The full inventory, in one sitting; the canonical spec lives on the <a class="link" href="research.html">Research page</a>. Grown from the Personal Fathering Profile research program of Dr. Ken Canfield at the National Center for Fathering. You get your score on the four dimensions you can train, and a ninety-day plan built from your answers.</p>
  <div class="row wrap" style="justify-content:center;gap:22px;margin-bottom:30px">
    <span class="fine">About twenty minutes</span><span class="fine ash">&middot;</span>
    <span class="fine">Pause anytime, every answer saves</span><span class="fine ash">&middot;</span>
    <span class="fine">Private. Your answers are never shown to anyone.</span>
  </div>
  <button class="btn btn-yellow" id="ksBegin" style="font-size:16px;padding:14px 34px">Begin the Profile</button>
  <p class="fine" style="margin-top:16px">Already started? It picks up right where you left off.</p>
</div>
<div class="assess" id="keystone" hidden></div>
<p class="center fine" style="padding:0 0 28px"><a class="link ash" href="index.html" style="font-size:12px">Back to Fathers.com</a></p>
<script>(function(){
  var intro=document.getElementById('ksIntro'), app=document.getElementById('keystone');
  function begin(){ intro.hidden=true; app.hidden=false; try{sessionStorage.setItem('ks_intro_done','1')}catch(_){} window.scrollTo(0,0); }
  var b=document.getElementById('ksBegin'); if(b) b.addEventListener('click', begin);
  try{ if(sessionStorage.getItem('ks_intro_done')==='1') begin(); }catch(_){}
})();</script>
''')

# ================================================== stories.html (P3)
PAGES['stories.html'] = dict(title='Stories', desc='Epic fatherhood films. Origin, crisis, the turn, the standard.', active='Stories', mode='public', body='''
<section class="tight" style="padding-top:48px"><div class="container">
  <div style="margin-bottom:22px">
    <h1 class="d-36" style="margin-bottom:6px">Fathers who did the work.</h1>
    <p class="small" style="color:var(--ash)">Origin, crisis, the turn, the standard. Every story ends with the step you can take.</p>
  </div>
  <div class="billboard">
    <a class="slot r-21x9 play-overlay filled" data-slot="IMG-P3-BILL-01" href="story.html" aria-label="Watch the story"><img src="assets/img/photos/billboard-stories.jpg" alt="A father at the kitchen table"><span class="tri"></span></a>
    <div class="overlay">
      <div class="eyebrow" style="margin-bottom:12px">STORIES</div>
      <h2 class="d-48" style="margin-bottom:8px">Home by Six</h2>
      <p class="small" style="margin-bottom:18px">A father who chose to be there, one ordinary evening at a time.</p>
      <div class="row"><a class="btn btn-secondary play" href="story.html">Watch</a><a class="btn btn-secondary" href="story.html">Trailer</a><span class="tag">24 min</span></div>
    </div>
  </div>
</div></section>

<section class="tight"><div class="container stack-32">
  <div><h2 style="font-family:var(--font-display);font-size:24px;margin-bottom:18px">After the Sentence</h2>
  <div class="rowscroll" data-repeat="4" data-prefix="IMG-P3-ROW2-" data-ratio="r-16x9" data-href="story.html"
    data-titles="Visitation Day|Eight Years, Every Letter|The First Pickup|Walking Papers"
    data-metas="22 min|19 min|25 min|20 min"></div></div>
  <div><h2 style="font-family:var(--font-display);font-size:24px;margin-bottom:18px">Starting Over</h2>
  <div class="rowscroll" data-repeat="4" data-prefix="IMG-P3-ROW3-" data-ratio="r-16x9" data-href="story.html"
    data-titles="Two Households|The Apology|Sundays at Noon|Step by Step"
    data-metas="20 min|17 min|23 min|19 min"></div></div>
  <div><h2 style="font-family:var(--font-display);font-size:24px;margin-bottom:18px">The First Year</h2>
  <div class="rowscroll" data-repeat="4" data-prefix="IMG-P3-ROW4-" data-ratio="r-16x9" data-href="story.html"
    data-titles="Night Shift|Three Weeks of Leave|The Carrier|What My Father Did"
    data-metas="16 min|18 min|15 min|22 min"></div></div>
</div></section>

<section class="band tight"><div class="container row between wrap">
  <h2 class="d-28">Every man in these films took the Profile.</h2>
  <a class="btn btn-yellow" href="profile.html">Get your baseline</a>
</div></section>
''')

# ================================================== story.html (P3 detail + submission)
PAGES['story.html'] = dict(title='Back to the Kitchen Table', desc='One father. Origin, crisis, the turn, the standard.', active='Stories', mode='public', body='''
<div class="slot r-21x9 flush filled" data-slot="IMG-P3-DET-01" style="max-height:62vh"><img src="assets/img/photos/hero-06.jpg" alt="Back to the kitchen table"></div>
<section class="tight"><div class="container" style="display:grid;grid-template-columns:1.4fr .9fr;gap:56px">
  <div>
    <h1 class="d-36">Back to the Kitchen Table</h1>
    <p class="small" style="margin:10px 0 30px">Ray M. Father of two. Three years away. All the way back.</p>
    <div class="stack-8">
      <div class="row between" style="padding:14px 16px;border:1px solid var(--ember);border-radius:8px"><span><b class="mono" style="margin-right:14px;color:var(--ember-hi)">00:00</b>Origin</span><span class="tag" style="color:var(--ember-hi)">PLAYING</span></div>
      <div class="row between" style="padding:14px 16px;border:1px solid var(--hairline);border-radius:8px"><span><b class="mono ash" style="margin-right:14px">06:40</b>Crisis</span></div>
      <div class="row between" style="padding:14px 16px;border:1px solid var(--hairline);border-radius:8px"><span><b class="mono ash" style="margin-right:14px">14:10</b>The Turn</span></div>
      <div class="row between" style="padding:14px 16px;border:1px solid var(--hairline);border-radius:8px"><span><b class="mono ash" style="margin-right:14px">19:30</b>The Standard</span></div>
    </div>
    <div class="row" style="margin-top:26px"><a class="link ash" href="#" data-share="copy" style="font-size:13px">Share link</a><a class="link ash" href="#" data-share="sms" style="font-size:13px">Text it</a><a class="link ash" href="#" data-share="email" style="font-size:13px">Email it</a><a class="link ash" href="#" data-share="report" style="font-size:13px;margin-left:auto">Report</a></div>
  </div>
  <aside class="stack-24">
    <div class="card"><div class="eyebrow" style="margin-bottom:14px">WHAT HE WISHED HE KNEW SOONER</div>
      <p class="quote" style="font-size:19px;margin-bottom:12px">"Coming home is work, not a doorway."</p>
      <p class="quote" style="font-size:19px;margin-bottom:12px">"Your kids don't need the story. They need the schedule."</p>
      <p class="quote" style="font-size:19px">"Repair beats explain. Every time."</p></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:14px">WHAT HE TRAINS NOW</div>
      <div class="row" style="gap:16px"><div class="slot r-2x3" data-slot="IMG-P3-DET-02" style="flex:0 0 72px"></div>
      <div><b style="font-size:15px">Watch Ray's class: Coming Home Present</b><p class="small" style="margin-top:6px">5 sessions &middot; 1h 25m</p></div></div>
      <a class="btn btn-secondary btn-sm" href="class.html" style="margin-top:16px">Go to the class</a></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:12px">WHERE HE STARTED</div>
      <p class="small" style="margin-bottom:14px">Ray's first Presence Baseline: <b class="mono bone">43</b></p>
      <a class="btn btn-yellow btn-sm" href="profile.html">Get yours</a></div>
  </aside>
</div></section>

<section class="band"><div class="container split" style="align-items:start">
  <div><h2 class="d-36">Your story is another man's map.</h2>
    <p style="color:var(--ash);margin-top:16px;max-width:46ch">Tell us what you went through and what you overcame. We film a handful of these every quarter. Every submission gets read.</p>
    <div class="grid-3" style="margin-top:32px;gap:14px">
      <div class="slot r-16x9" data-slot="IMG-P3-SUB-01"></div><div class="slot r-16x9" data-slot="IMG-P3-SUB-02"></div><div class="slot r-16x9" data-slot="IMG-P3-SUB-03"></div>
    </div><p class="fine" style="margin-top:10px">Filmed from submissions.</p></div>
  <form class="card" style="padding:32px" data-lead="story" data-done="Sent. Every submission gets read.">
    <div class="field"><label>The season that almost broke you</label><textarea name="season" required></textarea></div>
    <div class="field"><label>The turn</label><textarea name="turn" required></textarea></div>
    <div class="field"><label>The standard you hold now</label><textarea name="standard" required></textarea></div>
    <div class="field"><label>Contact email</label><input class="input" name="email" type="email" required placeholder="you@example.com"></div>
    <label style="display:flex;gap:10px;align-items:center;color:var(--bone);font-size:14px;margin-bottom:20px"><input type="checkbox" name="consent" required style="accent-color:var(--pine)"> You may contact me about filming.</label>
    <button class="btn btn-secondary">Send it</button>
  </form>
</div></section>
''')

# ================================================== classes.html (P4 catalog)
PAGES['classes.html'] = dict(title='The Courses', desc='Four courses, free to every man.', active='', mode='public', nochrome=True, body='''
<meta http-equiv="refresh" content="0;url=certificates.html">
<script>location.replace('certificates.html');</script>
<p class="center fine" style="padding:60px 0">The classes now live inside the courses. <a class="link" href="certificates.html">Continue to The Courses &rarr;</a></p>
''')

PAGES['class.html'] = dict(title='The Fundamentals of Fathering', desc='The flagship class on presence, taught by Dr. Ken Canfield.', active='Classes', mode='public', body='''
<div class="billboard">
  <div class="slot r-21x9 flush filled" data-slot="IMG-P4-DET-01" style="max-height:64vh"><img src="assets/img/photos/community-02.jpg" alt="Fathers who took the course"></div>
  <div class="overlay container" style="left:50%;transform:translateX(-50%);max-width:var(--max)">
    <div class="eyebrow" style="margin-bottom:10px">THE FREE COURSE &middot; THE 7 SECRETS OF EFFECTIVE FATHERS</div>
    <h1 class="d-48">The Fundamentals of Fathering</h1>
<p class="fine mono" style="letter-spacing:.08em;margin:10px 0 0;color:var(--ash)">FOR EVERY MAN, ON EITHER TRACK</p>
    <p class="small" style="margin-top:10px">Dr. Ken Canfield. Founder, National Center for Fathering, since 1990. One standard.</p>
  </div>
</div>
<div class="nav" style="top:72px;z-index:50"><div class="container nav-inner" style="height:60px">
  <b style="font-size:15px">The Fundamentals of Fathering</b>
  <div class="nav-right"><a class="btn btn-yellow btn-sm" href="profile.html">Get your baseline</a></div>
</div></div>

<section class="tight"><div class="container" style="display:grid;grid-template-columns:1.45fr .85fr;gap:56px;align-items:start">
  <div>
    <h2 class="d-22" style="font-family:var(--font-display);font-size:22px;margin-bottom:18px">What you will train</h2>
    <div class="stack-8" style="margin-bottom:44px">
      <div class="actionrow"><span class="checkmark">&rarr;</span><div class="txt">Read your kids' inner weather.</div></div>
      <div class="actionrow"><span class="checkmark">&rarr;</span><div class="txt">Build a schedule they can trust.</div></div>
      <div class="actionrow"><span class="checkmark">&rarr;</span><div class="txt">Say what you stand for out loud.</div></div>
      <div class="actionrow"><span class="checkmark">&rarr;</span><div class="txt">Repair fast when you blow it.</div></div>
    </div>
    <h2 style="font-family:var(--font-display);font-size:22px;margin-bottom:8px">The five sessions</h2>
    <p class="fine" style="margin-bottom:14px">Five filmed sessions. Each ends in a checkpoint, and the course closes with the written Final Q&amp;A your facilitator reads.</p>
    <details open><summary><span><b class="mono ash" style="margin-right:14px">01</b>Why Presence Wins</span><span class="tag">17:16</span></summary>
      <div class="body"><div class="row" style="align-items:flex-start;gap:18px"><div class="slot r-16x9" data-slot="IMG-P4-DET-02" style="flex:0 0 180px"></div>
      <p style="font-size:14px">The research case for father presence, and your four Keystone scores read honestly. What your kids get when you show up, what it costs when you don't, and where you actually stand today.</p></div></div></details>
    <details><summary><span><b class="mono ash" style="margin-right:14px">02</b>A Schedule They Can Trust</span><span class="tag">18:51</span></summary><div class="body">Consistency mechanics: standing time, the calendar as a promise, and the distracted father. Attention your kids can feel.</div></details>
    <details><summary><span><b class="mono ash" style="margin-right:14px">03</b>Enter Their World</span><span class="tag">17:07</span></summary><div class="body">Awareness training: friends' names, inner weather, questions without fixing.</div></details>
    <details><summary><span><b class="mono ash" style="margin-right:14px">04</b>Repair Fast, Stand for Something</span><span class="tag">18:15</span></summary><div class="body">The 24-hour repair standard, values out loud, and discipline that builds instead of frightens.</div></details>
    <details><summary><span><b class="mono ash" style="margin-right:14px">05</b>Your Own Father, Your Ninety Days</span><span class="tag">19:12</span></summary><div class="body">What you inherited and what stops with you. Why no man holds a standard alone. Locking the plan and the retake.</div></details>
    <div class="row" style="align-items:flex-start;gap:20px;margin-top:44px">
      <div class="slot r-1x1" data-slot="IMG-P4-DET-03" style="flex:0 0 96px;border-radius:50%"></div>
      <div><h3 style="margin-bottom:8px">About Ken</h3>
      <p class="small" style="max-width:56ch">Dr. Ken Canfield founded the National Center for Fathering and built the research base behind the Keystone framework. Since 1990, thousands of fathers studied, one conclusion: presence is a trainable skill. He is a father of five and a grandfather, and he teaches like it.</p></div>
    </div>
  </div>
  <aside class="stack-24" style="position:sticky;top:160px">
    <div class="card"><div class="row" style="gap:16px"><span style="font-size:28px">▤</span>
      <div><b style="font-size:15px">The Fundamentals Workbook</b><p class="fine" style="margin-top:4px">28 pages</p></div></div>
      <span class="fine" style="display:block;margin-top:16px;color:var(--ash)">Included free with the course.</span></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:14px">FREE WITH THE COURSE</div>
      <div class="stack-8">
        <div class="check"><span class="checkmark">&check;</span><span class="small">Every film and written session as they publish; films uploading as they finish</span></div>
        <div class="check"><span class="checkmark">&check;</span><span class="small">Your baseline and ninety-day plan</span></div>
        <div class="check"><span class="checkmark">&check;</span><span class="small">The written final, read by your facilitator</span></div>
        <div class="check"><span class="checkmark">&check;</span><span class="small">Your Certificate of Completion, at no cost</span></div>
      </div></div>
    <div class="card brass-card"><p class="small" style="margin-bottom:12px">Need proof someone else can check? Finish this course and your Certificate of Completion is issued at no cost.</p><p class="fine" style="margin:10px 0 0">Whether a certificate satisfies a court, agency, or program requirement is decided by that body. Confirm with yours before enrolling.</p>
      <div class="row wrap" style="gap:14px;align-items:center">
        <a class="btn btn-yellow btn-sm" href="enroll.html?cert=fundamentals&amp;title=Fathering%20Fundamentals&amp;hours=10.0">Earn the certificate</a>
        <button class="link brass" id="seeCert" data-cert-course="The Fundamentals of Fathering" data-cert-hours="10.0" style="font-size:14px;background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px">See the Certificate</button></div></div>
  </aside>
</div></section>

<section class="band tight"><div class="container">
  <h2 style="font-family:var(--font-display);font-size:24px;margin-bottom:20px">Keep training. The other three.</h2>
  <div class="rowscroll" data-repeat="3" data-prefix="IMG-P4-REL-" data-ratio="r-2x3" data-href="certificates.html#catalog"
    data-titles="Steady Under Pressure|Coming Home Present|Same Team"
    data-subs="Steadiness, trained|Presence after time away|One team for your children"
    data-metas="6 sessions &middot; Certificate of Completion|8 sessions &middot; Certificate of Completion|6 sessions &middot; Certificate of Completion"></div>
</div></section>
<script src="assets/js/cert-preview.js"></script>
''')

# ================================================== player.html (P5)
PAGES['player.html'] = dict(title='Session 4 &middot; The Fundamentals of Fathering', desc='Session player.', active='Classes', mode='app', body='''
<section class="tight" style="padding-top:36px"><div class="container">
  <p class="tag" style="margin-bottom:14px">The Fundamentals of Fathering / Lesson 4</p>
  <div style="display:grid;grid-template-columns:1.55fr .75fr;gap:32px;align-items:start">
    <div>
      <div class="slot r-16x9 filled" data-slot="IMG-P5-PLY-01" id="stage"><img src="assets/img/photos/action-01.jpg" alt="Lesson still"></div>
      <div class="card" style="margin-top:14px;padding:14px 18px">
        <div class="row" style="gap:18px">
          <span class="mono small">06:12 / 18:15</span>
          <div class="progress-track" style="flex:1"><div class="progress-fill" style="width:36%"></div></div>
          <span class="chip" style="padding:4px 12px;font-size:12px" onclick="document.getElementById('audiobar').style.display='flex'">Audio</span>
        </div>
      </div>
      <div id="audiobar" class="card" style="display:none;margin-top:10px;padding:12px 16px;align-items:center;gap:14px">
        <div class="slot r-1x1" data-slot="IMG-P5-AUD-01" style="width:44px"></div>
        <b style="font-size:14px">Session 4 &middot; Repair Fast, Stand for Something</b>
        <span class="mono fine" style="margin-left:auto">Audio mode</span>
      </div>
      <div data-tabs style="margin-top:28px">
        <div class="tabs"><button class="active">Overview</button><button>Workbook</button><button>Notes</button></div>
        <div class="tabpanel active">
          <p class="small" style="max-width:64ch;margin-bottom:20px">Awareness is the skill of knowing your kids' inner weather before they announce it. This lesson trains three habits: learn the names, ask without fixing, and watch the transitions. Ten minutes now; practice it at your table this week.</p>
          <p class="quote" style="font-size:22px">"Consistency is love the kids can set a clock by."</p>
        </div>
        <div class="tabpanel">
          <div class="card" style="max-width:420px"><b style="font-size:15px">The Fundamentals Workbook</b><p class="fine" style="margin:6px 0 14px">Pages 12-15 pair with this session. Print them for the week.</p>
          <button class="btn btn-secondary btn-sm" data-print>Print the pages</button></div>
        </div>
        <div class="tabpanel">
          <div class="stack-16" style="max-width:560px">
            <div class="card" style="padding:16px"><span class="mono fine" style="display:inline-block;margin-bottom:8px">06:12</span><p class="small">Names of their three closest friends. I know one. One.</p></div>
            <div class="card" style="padding:16px"><span class="mono fine" style="display:inline-block;margin-bottom:8px">07:48</span><p class="small">Ask about the bus ride, not the grades.</p></div>
            <p class="fine">Notes save to your plan. Write like nobody's grading it.</p>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:30px;padding:28px">
        <div class="row between wrap">
          <div><div class="row" style="gap:10px;margin-bottom:8px"><span class="checkmark">&check;</span><b>Session 4 complete</b></div>
            <p class="small">Up next: Session 5, Your Own Father, Your Ninety Days</p></div>
          <div class="row"><button class="btn btn-primary btn-sm">Play now</button><button class="btn btn-secondary btn-sm" onclick="this.closest('.card').style.display='none'">Not now</button></div>
        </div>
        <hr class="hr" style="margin:20px 0">
        <p class="small">This week's action from your plan: <b class="bone">Eat breakfast with your kids twice.</b> Mark it done in My Plan. <a class="link ash" href="plan.html" style="font-size:13px">Go to My Plan</a></p>
      </div>
    </div>
    <aside class="card" style="padding:20px">
      <b style="font-size:15px">The Fundamentals of Fathering</b>
      <div class="row" style="margin:12px 0 20px"><div class="progress-track" style="flex:1"><div class="progress-fill pine" style="width:70%"></div></div><span class="mono fine">4 of 5</span></div>
      <div class="stack-8" style="font-size:14px">
        <div class="row between" style="padding:10px 12px;border-radius:6px;background:var(--coal-2)"><span><span class="checkmark" style="width:16px;height:16px;font-size:9px;flex:0 0 16px">&check;</span> 01 Why Presence Wins</span><span class="tag">17:16</span></div>
        <div class="row between" style="padding:10px 12px;border-radius:6px;background:var(--coal-2)"><span><span class="checkmark" style="width:16px;height:16px;font-size:9px;flex:0 0 16px">&check;</span> 02 A Schedule They Can Trust</span><span class="tag">18:51</span></div>
        <div class="row between" style="padding:10px 12px;border-radius:6px;background:var(--coal-2)"><span><span class="checkmark" style="width:16px;height:16px;font-size:9px;flex:0 0 16px">&check;</span> 03 Enter Their World</span><span class="tag">17:07</span></div>
        <div class="row between" style="padding:10px 12px;border-left:3px solid var(--ember);border-radius:6px;background:var(--coal-2)"><b>04 Repair Fast, Stand for Something</b><span class="tag">18:15</span></div>
        <div class="row between" style="padding:10px 12px"><span class="ash">05 Your Own Father, Your Ninety Days</span><span class="tag">19:12</span></div>
      </div>
    </aside>
  </div>
</div></section>
''')

# ================================================== plan.html (P6)
PAGES['plan.html'] = dict(title='Your ninety-day plan', desc='Your baseline, your plan, your work.', active='', mode='app', auth=True, body='''
<section class="tight" style="padding-top:36px"><div class="container">
  <div data-journey="plan" data-journey-done="profile,report" style="margin-bottom:18px"></div>
  <div class="pl-wrap">
    <div id="planRoot">
      <div id="planLoading" class="center" style="padding:80px 0">
        <div class="eyebrow" style="margin-bottom:12px">LOADING YOUR PLAN</div>
        <p class="ash">One moment.</p>
      </div>
    </div>
    <div id="homeFeed"></div>
  </div>
</div></section>
<script src="assets/js/keystone-data.js"></script>
<script src="assets/js/keystone-manhood-data.js"></script>
<script src="assets/js/keystone-full.js"></script>
<script src="assets/js/assessment-registry.js"></script>
<script src="assets/js/plan-engine.js"></script>
<script src="assets/js/plan-controller.js"></script>
<script src="assets/js/home.js"></script>
''')

PAGES['circles.html'] = dict(title='My Circle', desc='Tuesday Group. One film, one discussion, one standard.', active='Circles', mode='app', auth=True, body='''
<section class="tight" style="padding-top:44px"><div class="container">
  <div class="row between wrap" style="margin-bottom:24px">
    <div><h1 class="d-36">Tuesday Group, Tuesday 0600</h1>
      <div class="row" style="margin-top:12px"><span class="chip" style="cursor:default">14 men</span><span class="chip" style="cursor:default">Next: Tue Jul 14, 6:00 AM</span></div></div>
  </div>
  <div class="glance" style="margin-bottom:28px">
    <div class="glance-card"><div class="glance-lbl">YOUR CIRCLE</div><div class="glance-big">14</div><div class="glance-sub">men</div></div>
    <div class="glance-card"><div class="glance-lbl">THIS WEEK</div><div class="glance-big">9</div><div class="glance-sub">watched the film</div></div>
    <div class="glance-card"><div class="glance-lbl">NEXT MEETING</div><div class="glance-big glance-sm">Tue 0600</div><div class="glance-sub">Jul 14</div></div>
    <div class="glance-card glance-next"><div class="glance-lbl">CONSIDER NEXT</div><div class="glance-next-txt">Post this week's question, and nudge the five who haven't watched.</div></div>
  </div>
  <div data-tabs>
    <div class="tabs"><button class="active">This Week</button><button>Members</button><button>Leader Kit</button></div>

    <div class="tabpanel active"><div style="display:grid;grid-template-columns:1.5fr .8fr;gap:40px;align-items:start">
      <div>
        <div class="card" style="padding:28px;margin-bottom:26px">
          <div class="eyebrow" style="margin-bottom:14px">THIS WEEK IN CIRCLE</div>
          <div class="row" style="gap:18px;align-items:flex-start;margin-bottom:20px">
            <div class="slot r-16x9 filled" data-slot="IMG-P7-CIR-01" style="flex:0 0 200px"><img src="assets/img/photos/hero-07.jpg" alt="Film still"></div>
            <div><b style="font-size:15px">Watch before Tuesday: After the Sentence &middot; 22 min</b></div>
          </div>
          <p class="quote" style="font-size:20px;margin-bottom:18px">"Where did your father's absence still shape your hand?"</p>
          <div class="actionrow"><span class="checkmark">&rarr;</span><div class="txt">Tell one man in this Circle your week 3 action. Let him check you.</div></div>
        </div>
        <div class="card" style="padding:24px">
          <div class="row" style="margin-bottom:20px;gap:12px"><span class="avatarchip">M</span><input class="input" id="circlePostInput" placeholder="Say it straight"><button class="btn btn-primary btn-sm" id="circlePostBtn">Post</button></div>
          <div id="circleFeed"><p class="ash" style="padding:12px 0">Loading your circle&hellip;</p></div>
        </div>
      </div>
      <aside class="card" style="padding:20px">
        <div class="eyebrow" style="margin-bottom:16px">MEMBERS &middot; LAST 4 WEEKS</div>
        <table style="font-size:13px"><tbody>
          <tr><td style="padding:8px 4px">Member 01</td><td class="row" style="gap:6px;border:0;padding:8px 4px"><span class="dot on"></span><span class="dot on"></span><span class="dot on"></span><span class="dot on"></span></td></tr>
          <tr><td style="padding:8px 4px">Member 02</td><td class="row" style="gap:6px;border:0;padding:8px 4px"><span class="dot on"></span><span class="dot on"></span><span class="dot"></span><span class="dot on"></span></td></tr>
          <tr><td style="padding:8px 4px">Tom K.</td><td class="row" style="gap:6px;border:0;padding:8px 4px"><span class="dot on"></span><span class="dot on"></span><span class="dot on"></span><span class="dot"></span></td></tr>
          <tr><td style="padding:8px 4px">Jesse P.</td><td class="row" style="gap:6px;border:0;padding:8px 4px"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot on"></span></td></tr>
        </tbody></table>
      </aside>
    </div></div>

    <div class="tabpanel">
      <table><thead><tr><th>Name</th><th>Baseline taken</th><th>Last active</th><th>Weeks attended</th></tr></thead><tbody>
        <tr><td>Member 01</td><td><span class="checkmark" style="width:16px;height:16px;font-size:9px">&check;</span></td><td class="fine">Today</td><td class="mono fine">4 / 4</td></tr>
        <tr><td>Member 02</td><td><span class="checkmark" style="width:16px;height:16px;font-size:9px">&check;</span></td><td class="fine">2h ago</td><td class="mono fine">3 / 4</td></tr>
        <tr><td>Tom K.</td><td><span class="checkmark" style="width:16px;height:16px;font-size:9px">&check;</span></td><td class="fine">5h ago</td><td class="mono fine">3 / 4</td></tr>
        <tr><td>Jesse P.</td><td class="fine">Not yet</td><td class="fine">1d ago</td><td class="mono fine">1 / 4</td></tr>
      </tbody></table>
    </div>

    <div class="tabpanel">
      <div class="grid-2" style="gap:24px">
        <div class="card"><b style="font-size:15px">Session guide</b><p class="fine" style="margin:6px 0 16px">After the Sentence &middot; 6 pages</p>
          <button class="btn btn-secondary btn-sm" data-print>Print the guide</button></div>
        <div class="card" style="grid-column:1/-1"><b style="font-size:15px">Plan the next 4 weeks</b>
          <div class="grid-4" style="margin-top:16px">
            <div class="slot r-16x9" data-slot="IMG-P7-KIT-01"></div>
            <div class="slot r-16x9" data-slot="IMG-P7-KIT-02"></div>
            <div class="slot r-16x9" data-slot="PICK A FILM"></div>
            <div class="slot r-16x9" data-slot="PICK A FILM"></div>
          </div></div>
      </div>
      <p class="fine" style="margin-top:20px">Leaders get the kit free. Ask us about training.</p>
    </div>
  </div>
</div></section>
<script src="assets/js/circles.js"></script>
''')

# ================================================== groups.html (P7 marketing + admin)
PAGES['groups.html'] = dict(title='For Groups', desc='Circles for workplaces, teams, and programs. Bring your men.', active='For Groups', mode='public', body='''
<header class="hero"><div class="container split">
  <div class="slot r-4x3" data-slot="IMG-P7-MKT-01"></div>
  <div>
    <div class="eyebrow" style="margin-bottom:16px">FOR GROUPS</div>
    <h1 class="d-48">Bring your men. We bring the plan.</h1>
    <p class="lead" style="margin:20px 0 30px">Films, discussion guides, baselines, and a weekly standard. Built for community groups, teams, and programs. One link enrolls every man under your group. No rosters, no spreadsheets.</p>
    <a class="btn btn-primary" href="#contact">Talk to us</a>
  </div>
</div></header>

<section class="band tight"><div class="container">
  <div class="grid-2" style="max-width:880px;margin:0 auto">
    <div class="card" style="padding:32px"><div class="eyebrow" style="margin-bottom:12px">CIRCLE</div>
      <div class="bigscore" style="font-size:44px">$2,000<span class="ash" style="font-size:16px;font-family:var(--font-ui)"> / year</span></div>
      <p class="small" style="margin:8px 0 20px">Up to 25 seats</p>
      <div class="stack-8">
        <div class="check"><span class="checkmark">&check;</span><span class="small">Every class and film</span></div>
        <div class="check"><span class="checkmark">&check;</span><span class="small">Leader kits and guides</span></div>
        <div class="check"><span class="checkmark">&check;</span><span class="small">Admin analytics</span></div>
        <div class="check"><span class="checkmark">&check;</span><span class="small">Sponsored-seat option</span></div>
      </div></div>
    <div class="card" style="padding:32px"><div class="eyebrow" style="margin-bottom:12px">ORGANIZATION</div>
      <div class="bigscore" style="font-size:44px">Custom</div>
      <p class="small" style="margin:8px 0 20px">Custom seats, multi-Circle</p>
      <div class="stack-8">
        <div class="check"><span class="checkmark">&check;</span><span class="small">Everything in Circle</span></div>
        <div class="check"><span class="checkmark">&check;</span><span class="small">Rosters and CSV invites</span></div>
        <div class="check"><span class="checkmark">&check;</span><span class="small">Track assignment</span></div>
        <div class="check"><span class="checkmark">&check;</span><span class="small">Completion reporting</span></div>
      </div></div>
  </div>
  <p class="fine center" style="margin-top:18px">Pricing for organizations lives on the <a class="link" href="organizations.html">Organizations page</a>.</p>
</div></section>

<section><div class="container">
  <div class="row between wrap" style="margin-bottom:24px">
    <h2 class="d-28">What an admin sees</h2>
    <span class="notice" style="padding:10px 16px">Admins see participation, never a man's answers or scores.</span>
  </div>
  <div class="grid-4" style="margin-bottom:28px">
    <div class="card stat"><div class="num">41<span class="ash" style="font-size:18px">/50</span></div><div class="lbl">Seats active</div></div>
    <div class="card stat"><div class="num">33</div><div class="lbl">Men on a plan</div></div>
    <div class="card stat"><div class="num">12</div><div class="lbl">Completions this quarter</div></div>
    <div class="card stat"><div class="num">4</div><div class="lbl">Circles running</div></div>
  </div>
  <div class="card pad-0">
    <div class="row between" style="padding:18px 20px;border-bottom:1px solid var(--hairline)">
      <div class="row" style="flex:1;max-width:480px"><input class="input" readonly id="joinLinkField" value="fathers.com/join/living-hope-4F7K"><button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('joinLinkField').value).then(function(){toast('Invite link copied.')})">Copy</button></div>
      <a class="btn btn-secondary btn-sm" href="mailto:Team@Fathers.com?subject=Roster%20import">Send us your roster</a>
    </div>
    <p class="fine" style="margin:0 0 10px;letter-spacing:.06em">ILLUSTRATION &middot; SAMPLE DATA SHOWING WHAT A LEADER SEES</p>
    <table><thead><tr><th>Name</th><th>Email</th><th>Baseline</th><th>Last active</th><th>Circle</th></tr></thead><tbody>
      <tr><td>Member 01</td><td class="fine">member01@…</td><td><span class="checkmark" style="width:16px;height:16px;font-size:9px">&check;</span></td><td class="fine">Today</td><td class="fine">Tuesday 0600</td></tr>
      <tr><td>Member 02</td><td class="fine">member02@…</td><td><span class="checkmark" style="width:16px;height:16px;font-size:9px">&check;</span></td><td class="fine">2h</td><td class="fine">Tuesday 0600</td></tr>
      <tr><td>Member 03</td><td class="fine">member03@…</td><td class="fine">&mdash;</td><td class="fine">Invited</td><td class="fine">Thursday 1900</td></tr>
    </tbody></table>
  </div>
</div></section>

<section class="band" id="contact"><div class="container split" style="align-items:start">
  <div><h2 class="d-36">Start your Circles.</h2>
    <p style="color:var(--ash);margin-top:16px;max-width:44ch">Tell us about your men. We reply within three business days.</p>
    <div class="row wrap" style="margin-top:26px;gap:12px"><span class="pill pill-sponsored">Community groups</span><span class="pill pill-sponsored">Reentry programs</span><span class="pill pill-sponsored">Teams</span><span class="pill pill-sponsored">Workplaces</span></div></div>
  <form class="card" style="padding:32px" data-lead="groups" data-done="Sent. We reply within three business days.">
    <div class="grid-2" style="gap:16px"><div class="field"><label>Name</label><input class="input" name="name" required></div>
      <div class="field"><label>Organization</label><input class="input" name="organization" required></div></div>
    <div class="grid-2" style="gap:16px"><div class="field"><label>Role</label><input class="input" name="role"></div>
      <div class="field"><label>Seats needed</label><input class="input" name="seats" placeholder="25"></div></div>
    <div class="field"><label>Email</label><input class="input" name="email" type="email" required></div>
    <div class="field"><label>Message</label><textarea name="message"></textarea></div>
    <button class="btn btn-primary">Send</button>
  </form>
</div></section>
''')

# ================================================== checkout.html (P8 screens 1-2)
PAGES['checkout.html'] = dict(title='Support the work', desc='Founding-supporter membership funds the films and free seats. $79 a year at founding pricing. Everything a man needs here stays free.', active='', mode='public', body='''
<section class="tight" style="padding-top:56px"><div class="container" data-seq style="max-width:1080px">
  <div class="seqpanel">
    <div style="display:grid;grid-template-columns:1.2fr .9fr;gap:48px;align-items:start">
      <div>
        <h1 class="d-36" style="margin-bottom:14px">Support the work.</h1>
        <p class="small" style="color:var(--ash);margin-bottom:24px;max-width:50ch">The membership is the library as it grows: founding pricing while the film library is in production. Fundamentals plays today; the three new courses are live as written sessions, films uploading as they finish. Your Profile, plan, retakes, the courses, and your Certificate of Completion stay free either way. The membership funds the work; it never gates it.</p>

        <div class="field"><label>Card number</label><input class="input" inputmode="numeric" placeholder="4242 4242 4242 4242"></div>
        <div class="grid-2" style="gap:16px">
          <div class="field"><label>Expiry</label><input class="input" placeholder="MM / YY"></div>
          <div class="field"><label>CVC</label><input class="input" inputmode="numeric" placeholder="123"></div>
        </div>
        <div class="grid-2" style="gap:16px">
          <div class="field"><label>Name on card</label><input class="input" placeholder="Full name"></div>
          <div class="field"><label>ZIP</label><input class="input" inputmode="numeric" placeholder="72712"></div>
        </div>
        <button class="btn btn-primary" id="paybtn" style="width:100%;margin-top:10px" data-next>Become a founding supporter</button>
        <p class="fine" style="margin-top:14px">Payment processing wires to Stripe at deploy. No card is charged in this prototype.</p>
      </div>
      <aside class="card" style="padding:28px">
        <div class="row between" style="margin-bottom:4px"><b>Founding Supporter &middot; annual</b><b class="mono">$120.00</b></div>
        <p class="small" style="margin-bottom:14px">$10 a month, billed once a year</p>
        <div class="row between" style="margin-bottom:18px;padding:10px 12px;border:1px solid var(--hairline);border-radius:6px">
          <span class="small"><s class="ash">$120</s> <b class="bone">$79 founding member</b></span><span class="pill pill-new">Beta pricing</span></div>
        <div class="row" style="gap:10px;margin-bottom:18px"><span class="checkmark">&check;</span><span class="small">30-day money-back guarantee, no questions</span></div>
        <hr class="hr" style="margin-bottom:18px">
        <div class="stack-8">
          <div class="check"><span class="checkmark">&check;</span><span class="small">Every film, class, and workbook as they publish; the library is in production, films uploading as they finish</span></div>
          <div class="check"><span class="checkmark">&check;</span><span class="small">Your baseline and ninety-day plan</span></div>
          <div class="check"><span class="checkmark">&check;</span><span class="small">Funds the films, the facilitator kits, and free seats for men in programs</span></div>
        </div>
        <p class="fine" style="margin-top:18px">By continuing you agree to the <a class="link ash" href="terms.html" style="font-size:12px">terms</a>. Current pricing for organizations and facilitators is published on the <a class="link ash" href="organizations.html" style="font-size:12px">Organizations page</a>.</p>
      </aside>
    </div>
  </div>
  <div class="seqpanel">
    <div class="center" style="max-width:640px;margin:40px auto">
      <span class="checkmark" style="width:56px;height:56px;font-size:26px;margin:0 auto 22px;display:inline-flex">&check;</span>
      <h1 class="d-36" style="margin-bottom:10px">You're in.</h1>
      <p class="small" style="margin-bottom:36px">Receipt sent to m•••@•••.com.</p>
      <div class="grid-2" style="gap:20px;text-align:left">
        <a class="card hoverable" href="plan.html" style="text-decoration:none;color:inherit"><div class="eyebrow" style="margin-bottom:10px">NEXT</div><b>Pick up your plan. Week 1 is ready.</b></a>
        <a class="card hoverable" href="class.html" style="text-decoration:none;color:inherit"><div class="slot r-16x9" data-slot="IMG-P8-CNF-01" style="margin-bottom:12px"></div><b>Start the flagship class</b></a>
      </div>
    </div>
  </div>
</div></section>
''')

# ================================================== gift.html (P8 screens 3-4)
PAGES['gift.html'] = dict(title='Give a man the work', desc='Fund a year of supporter membership and materials for a man you believe in. The courses and his Certificate of Completion are free for every man; your gift funds the rest and tells him you are behind him.', active='', mode='public', body='''
<div class="billboard">
  <div class="slot r-21x9 flush" data-slot="IMG-P8-GFT-01" style="max-height:48vh"></div>
  <div class="overlay container" style="left:50%;transform:translateX(-50%);max-width:var(--max)">
    <h1 class="d-48">Back the work. He earns the proof.</h1>
    <p class="small" style="margin-top:10px;max-width:52ch">The courses and the Certificate of Completion are free for every man. Your gift funds a year of supporter membership and his printed materials, with your name on it. The completion is still earned, never given. He will know it came from you.</p>
  </div>
</div>
<section class="tight"><div class="container split" style="align-items:start">
  <div class="card" style="padding:32px">
    <div class="row between" style="margin-bottom:10px"><b>One sponsored seat</b><b class="mono">$120</b></div>
    <p class="fine" style="margin-bottom:22px">A year of supporter membership plus his printed workbooks and materials for all four courses: Fathering Fundamentals, Coming Home Present, Steady Under Pressure, Same Team. His Keystone Profile, ninety-day plan, the courses, and his Certificate of Completion are free for every man, gift or not.</p>
    <div class="grid-2" style="gap:16px">
      <div class="field"><label>To</label><input class="input" id="g-to" placeholder="Dad"></div>
      <div class="field"><label>From</label><input class="input" id="g-from" placeholder="Marcus"></div>
    </div>
    <div class="field"><label>Message</label><textarea id="g-msg" maxlength="200" placeholder="You showed me. Now train it."></textarea>
      <p class="fine" style="margin-top:6px"><span id="g-count">200 left</span></p></div>
    <div class="field"><label>Delivery</label>
      <div class="chiprow"><button class="chip selected" data-deliver="now">Send now</button><button class="chip" data-deliver="date">Pick a date</button></div>
      <input class="input" id="g-date" type="date" value="2027-06-20" style="display:none;margin-top:12px;max-width:220px">
    </div>
    <div class="field"><label>Method</label>
      <div class="chiprow"><button class="chip selected" data-toggle="single">Email</button><button class="chip" data-toggle="single">Printable card</button></div></div>
    <form class="row" data-lead="gift-interest" data-done="You are on the list. We will email you the moment giving opens." style="gap:10px">
      <input class="input" name="email" type="email" required placeholder="Your email" style="flex:1">
      <button class="btn btn-primary">Reserve this gift</button>
    </form>
    <p class="fine" style="margin-top:8px">Gift checkout opens shortly. Reserve it now and we will email you first.</p>
    <p class="fine" style="margin-top:12px"><b class="bone">Completions are earned, never given.</b> You are backing the work, not buying the paper: identity confirmed, hours logged, a final at eighty percent. When he passes, the document is his because he earned it. That is why it means something.</p>
    <p class="fine" style="margin-top:8px">Giving to a man you have not met? <a class="link ash" href="sponsor.html">Sponsor a man &rarr;</a></p>
  </div>
  <div>
    <div class="eyebrow" style="margin-bottom:14px">HE SEES THIS</div>
    <div class="doc" style="padding:40px;max-width:520px;margin:0">
      <img src="assets/img/logomark-dark.png" alt="Fathers.com" style="height:36px;margin-bottom:24px">
      <p style="font-family:var(--font-mono);font-size:12px;letter-spacing:.2em;color:#6b6257;text-transform:uppercase;margin-bottom:14px">A sponsored seat</p>
      <h2 style="font-size:26px;color:#141210;margin-bottom:16px">For <span id="pv-to">Dad</span>, from <span id="pv-from">Marcus</span></h2>
      <p id="pv-msg" style="font-family:var(--font-display);font-size:19px;color:#3a352e;line-height:1.45;margin-bottom:24px">You showed me. Now train it.</p>
      <span style="display:inline-block;background:#E86A3C;color:#0A0A0A;padding:13px 24px;border-radius:6px;font-weight:600;font-size:14px">Claim it and take your baseline</span>
      <p style="font-size:11px;color:#6b6257;margin-top:18px">No card required to redeem.</p>
    </div>
  </div>
</div></section>
<section class="band tight"><div class="container center" style="max-width:620px">
  <div class="eyebrow" style="margin-bottom:16px">REDEMPTION PREVIEW</div>
  <h2 class="d-28" style="margin-bottom:12px">Marcus sponsored your seat, paid in full.</h2>
  <p class="quote" style="font-size:20px;margin-bottom:26px">"You showed me. Now train it."</p>
  <a class="btn btn-primary" href="profile.html">Claim it and take your baseline</a>
  <p class="fine" style="margin-top:14px">No card required to redeem.</p>
</div></section>
<script>
(function(){
  var t=document.getElementById('g-to'),f=document.getElementById('g-from'),m=document.getElementById('g-msg'),c=document.getElementById('g-count');
  function u(){document.getElementById('pv-to').textContent=t.value||'Dad';document.getElementById('pv-from').textContent=f.value||'Marcus';document.getElementById('pv-msg').textContent=m.value||'You showed me. Now train it.';c.textContent=(200-m.value.length)+' left';}
  [t,f,m].forEach(function(x){x.addEventListener('input',u)});u();
  document.querySelectorAll('[data-deliver]').forEach(function(b){b.addEventListener('click',function(){
    document.querySelectorAll('[data-deliver]').forEach(function(x){x.classList.remove('selected')});b.classList.add('selected');
    document.getElementById('g-date').style.display=b.dataset.deliver==='date'?'':'none';});});
})();
</script>
''')

# ================================================== sponsor.html (P8 screen 5)
PAGES['sponsor.html'] = dict(title='Sponsor a man', desc='$120 funds one man&rsquo;s seat and materials in a certified program. Tax-deductible. He earns the completion; you fund the work.', active='', mode='public', body='''
<header class="hero"><div class="container split">
  <div class="slot r-4x3" data-slot="IMG-P8-SPN-01"></div>
  <div>
    <h1 class="d-48">Sponsor a man.</h1>
    <p class="lead" style="margin:20px 0 8px">$120 funds one man&rsquo;s seat and printed materials in a certified program. The courses and the Certificate of Completion are free to him; your gift carries the cohort.</p>
    <p class="small" style="margin-bottom:28px">Your gift is tax-deductible. Fathers.com is a program of the National Center for Fathering, a 501(c)(3).</p>
    <div class="chiprow" style="margin-bottom:16px">
      <button class="chip selected" data-toggle="single">1 man &middot; $120</button>
      <button class="chip" data-toggle="single">3 men &middot; $360</button>
      <button class="chip" data-toggle="single">10 men &middot; $1,200</button>
      <button class="chip" data-toggle="single">Custom</button>
    </div>
    <label style="display:flex;gap:12px;align-items:center;color:var(--bone);font-size:14px;margin-bottom:18px"><input type="checkbox" class="toggle"> Make it monthly</label>
    <p class="fine" style="max-width:52ch;margin-bottom:12px">Sponsored seats are assigned through Certified Organizations. You will get one update when your seat is claimed. No personal details, no program names, ever.</p>
    <p class="fine" style="max-width:52ch;margin-bottom:12px">Organizations and programs: sponsor ten and we set up your join link, one link that enrolls every man under your group.</p>
    <p class="fine" style="max-width:52ch;margin-bottom:26px">Giving to your own dad or a friend? <a class="link ash" href="gift.html">Give a man the work &rarr;</a></p>
    <form data-lead="sponsor-interest" data-done="Received. We will email you when sponsorship checkout opens." style="max-width:520px">
      <div class="eyebrow" style="margin:4px 0 10px">WHERE YOUR GIFT GOES</div>
      <div class="row wrap" style="gap:8px;margin-bottom:14px">
        <label class="chip"><input type="radio" name="designation" value="greatest-need" checked> Where the need is greatest</label>
        <label class="chip"><input type="radio" name="designation" value="coming-home"> A father coming home</label>
        <label class="chip"><input type="radio" name="designation" value="serving-or-served"> A father who serves or served</label>
        <label class="chip"><input type="radio" name="designation" value="future-father"> A future father</label>
      </div>
      <div class="row" style="gap:10px">
        <input class="input" name="email" type="email" required placeholder="Your email" style="flex:1">
        <button class="btn btn-primary">Sponsor</button>
      </div>
      <p class="fine" style="margin-top:10px;max-width:52ch">A designation is a preference, honored whenever a matching seat is open. When none is waiting, your gift goes where the need is greatest, and we tell you which happened.</p>
    </form>
    <p class="fine" style="margin-top:8px;max-width:52ch">Sponsorship checkout opens shortly. Leave your email and we will set up your seats first.</p>
  </div>
</div></header>
''')

# ================================================== account.html (P9)
PAGES['account.html'] = dict(title='Your settings', desc='Your name, how we reach you, what stays private, and your data.', active='', mode='app', auth=True, body='''
<section class="tight" style="padding-top:44px"><div class="container" style="max-width:760px">
  <div class="row between" style="margin-bottom:8px;align-items:center">
    <h1 class="d-36" style="margin:0">Your settings</h1>
    <a class="btn btn-secondary btn-sm" href="#" data-signout>Sign out</a>
  </div>
  <p class="lead" style="max-width:60ch;margin-bottom:30px">What we hold, how we reach you, and what leaves with you. Every switch here does something the moment you save it.</p>
  <div id="acctRoot"></div>
</div></section>
''')

# ================================================== certificates.html (P10 screens 1-3)
PAGE_SCRIPTS = {'certificates.html': ['course-catalog.js'],
                'account.html': ['account-prefs.js'],
                'plan.html': ['journey.js']}

PAGES['certificates.html'] = dict(title='The Courses and the Certificate of Completion', desc='Four courses, free to every man. Finish the work and hold a Certificate of Completion: logged sessions, a serial anyone can confirm, at no cost to you.', active='Certificates', mode='public', body='''
<!-- HERO: the certificate is the thesis -->
<header class="cert-hero"><div class="container">
  <div class="cert-hero-grid">
    <div class="cert-hero-copy">
      <div class="eyebrow brass" style="margin-bottom:18px">THE CERTIFICATE OF COMPLETION</div>
      <h1 class="cert-h1">A document that<br>means something.</h1>
      <p class="lead" style="margin:22px 0 34px">Not a participation ribbon. Earned proof that you did the work, free to the man who earns it. Signed by Dr. Ken Canfield and the Certified Facilitator who led your cohort, with logged sessions and a serial anyone can confirm.</p>
      <div class="row wrap" style="gap:14px">
        <a class="btn btn-yellow" href="#catalog">See the courses</a>
        <a class="btn btn-secondary" href="verify.html">Verify one</a>
      </div>
    </div>
    <div class="cert-hero-art">
      <div class="cert-doc-3d">
        <div class="cert-doc">
          <div class="cert-doc-brass"></div>
          <div class="cert-seal">
            <img src="assets/img/logomark-dark.png" alt="" class="lg-dark"><img src="assets/img/logomark-light.png" alt="" class="lg-light">
          </div>
          <div class="cert-doc-kicker">CERTIFICATE OF COMPLETION &middot; NATIONAL CENTER FOR FATHERING</div>
          <div class="cert-doc-name">Your Name</div>
          <div class="cert-doc-course">has completed Fathering Fundamentals</div>
          <div class="cert-doc-meta">Facilitator-attested completion &middot; 5 sessions &middot; June 2, 2026</div>
          <div class="cert-doc-rule"></div>
          <div class="cert-doc-foot">
            <div><div class="cert-doc-serial">SPECIMEN &middot; SERIAL FC-2026-&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;</div><div class="cert-doc-serial">Identity confirmed at enrollment</div></div>
            <div class="cert-doc-qr">QR</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div></header>

<!-- WHAT IT PROVES: verification as the differentiator, four pillars -->
<section class="cert-proves"><div class="container">
  <div class="center" style="max-width:640px;margin:0 auto 56px">
    <h2 class="d-36">Anyone can print a certificate.<br>Ours can be checked.</h2>
    <p class="lead" style="margin:16px auto 0">Four things separate a Certificate of Completion from a PDF someone made in an afternoon.</p>
  </div>
  <div class="cert-pillars">
    <div class="cert-pillar">
      <div class="cert-pillar-n">01</div>
      <h3>Identity confirmed</h3>
      <p>Confirmed at enrollment: by government ID for independent enrollment, or in person by the Certified Facilitator who knows the man. The name on the certificate is the man who earned it.</p>
    </div>
    <div class="cert-pillar">
      <div class="cert-pillar-n">02</div>
      <h3>Hours logged, not claimed</h3>
      <p>Time on task is measured. No skip credit, no fast-forward. The hours on the document are hours he actually spent.</p>
    </div>
    <div class="cert-pillar">
      <div class="cert-pillar-n">03</div>
      <h3>Checkpoints passed</h3>
      <p>Attention checks through every lesson and a final assessment at eighty percent. He learned it, he did not just watch it.</p>
    </div>
    <div class="cert-pillar">
      <div class="cert-pillar-n">04</div>
      <h3>Publicly verifiable</h3>
      <p>Every certificate carries a unique serial with a public page. A court, an employer, or a program can confirm it instantly.</p>
    </div>
  </div>
</div></section>

<!-- HOW TO EARN ONE: make the process obvious -->
<section class="tight"><div class="container">
  <div class="center" style="max-width:640px;margin:0 auto 40px">
    <div class="eyebrow brass" style="margin-bottom:12px">HOW TO EARN ONE</div>
    <h2 class="d-36">Three steps to your certificate.</h2>
    <p class="small" style="margin-top:10px;color:var(--ash)">Every course is free. So is the certificate. Five sessions, fifteen to twenty minutes of film each plus the work, built for a working man&rsquo;s week. In a certified program the certificate is presented at completion, in front of the men you did the work with.</p>
  </div>
  <div class="grid-3">
    <div class="card" style="padding:24px"><div class="mono ash" style="margin-bottom:10px">STEP 1</div><b>Get claimed</b><p class="small" style="margin-top:8px">Your Certified Facilitator or organization claims your seat. Everything is free to you.</p></div>
    <div class="card" style="padding:24px"><div class="mono ash" style="margin-bottom:10px">STEP 2</div><b>Do the work</b><p class="small" style="margin-top:8px">Five sessions. Pass the checkpoint after each, then write your Final Q&amp;A answers. Time on task is measured.</p></div>
    <div class="card" style="padding:24px"><div class="mono ash" style="margin-bottom:10px">STEP 3</div><b>Receive your certificate</b><p class="small" style="margin-top:8px">Pass the final and receive a serialed Certificate of Completion a court or employer can confirm.</p></div>
  </div>
</div></section>

<!-- CATALOG: the certificates themselves -->
<section id="catalog" class="band"><div class="container">
  <div class="row between wrap" style="margin-bottom:40px;align-items:flex-end">
    <div><div class="eyebrow brass" style="margin-bottom:12px">THE COURSES</div>
    <h2 class="d-36">Four courses. Chosen for the rooms where men are met.</h2></div>
    <p class="small" style="max-width:34ch">Open to every man. Presence, steadiness, coming home, and one team for the children: four completions built on the Keystone framework.</p>
    <p class="fine" style="color:var(--ash);flex-basis:100%;margin-top:4px">Fundamentals and Steady Under Pressure serve every man on either track. Coming Home Present and Same Team are built for fathers.</p>
  </div>
  <style>#tracks .cert-card{display:flex;flex-direction:column}#tracks .cert-card .sess-peek{margin-top:auto}#tracks .cert-card .cert-card-foot{margin-top:12px}</style>\n  <div class="cert-cards" id="tracks">
    <div class="cert-card" style="cursor:default" data-cert="fundamentals" data-title="Fathering Fundamentals" data-hours="10.0" data-desc="The flagship curriculum, hardened into proof. The same lessons taught by fathers who have lived it, plus identity verification, logged time, checkpoints, and a final assessment.">
      <div class="cert-card-top"><span class="pill">Sessions live</span><span class="cert-card-hrs">5 sessions</span></div>
      <h3>Fathering Fundamentals</h3>
      <p>The flagship, built on The 7 Secrets of Effective Fathers. The free course, hardened into proof.</p>\n      <details class="sess-peek" style="margin-top:10px"><summary class="fine" style="cursor:pointer;color:var(--brass,#c9a227)">The 5 lessons, at a glance</summary><ol class="small" style="margin:8px 0 2px;padding-left:18px"><li style="margin:5px 0"><b>Why Presence Wins</b> <span style="color:var(--ash)">&middot; &ldquo;Presence is the engine; everything else rides on it.&rdquo;</span></li><li style="margin:5px 0"><b>A Schedule They Can Trust</b> <span style="color:var(--ash)">&middot; &ldquo;Standing time, the calendar as a promise.&rdquo;</span></li><li style="margin:5px 0"><b>Enter Their World</b> <span style="color:var(--ash)">&middot; &ldquo;Friends’ names, inner weather, questions without fixing.&rdquo;</span></li><li style="margin:5px 0"><b>Repair Fast, Stand for Something</b> <span style="color:var(--ash)">&middot; &ldquo;The 24-hour repair standard, values out loud.&rdquo;</span></li><li style="margin:5px 0"><b>Your Own Father, Your Ninety Days</b> <span style="color:var(--ash)">&middot; &ldquo;What you inherited, what stops with you, the plan locked.&rdquo;</span></li></ol><p class="fine" style="margin:6px 0 0"><a class="link" href="class.html">Read them in full &rarr;</a></p></details>\n      <div class="cert-card-foot"><span class="mono">Free</span><a class="cert-card-go" href="enroll.html?cert=fundamentals&amp;title=Fathering%20Fundamentals&amp;hours=10.0">Enroll free &rarr;</a></div>\n    </div>\n    <div class="cert-card" style="cursor:default" data-cert="reentry" data-title="Coming Home Present" data-hours="8.0" data-desc="Presence after time away, whatever kept you away. Rebuilding from day one, catching up on how your child grew while you were away, with confirmed identity, logged time, checkpoints, and a final assessment a court or program can trust.">
      <div class="cert-card-top"><span class="pill">Sessions live</span><span class="cert-card-hrs">8 sessions</span></div>
      <h3>Coming Home Present</h3>
      <p>Presence after time away, no matter what kept you away. All eight written sessions are published now, including catching up on how your child grew while you were gone. Films are in production and upload as they finish.</p>
      \n      <details class="sess-peek" style="margin-top:10px"><summary class="fine" style="cursor:pointer;color:var(--brass,#c9a227)">The 8 sessions, at a glance</summary><ol class="small" style="margin:8px 0 2px;padding-left:18px"><li style="margin:5px 0"><b>The Body You Bring Home</b> <span style="color:var(--ash)">&middot; &ldquo;Your body did its job there. Now teach it that home is not there.&rdquo;</span></li><li style="margin:5px 0"><b>The First Weeks</b> <span style="color:var(--ash)">&middot; &ldquo;Plan around the wave. Do not grade yourself by it.&rdquo;</span></li><li style="margin:5px 0"><b>The Child Who Grew</b> <span style="color:var(--ash)">&middot; &ldquo;Meet the child in front of you, not the one you left.&rdquo;</span></li><li style="margin:5px 0"><b>Small Deposits</b> <span style="color:var(--ash)">&middot; &ldquo;Small and often beats big and rare.&rdquo;</span></li><li style="margin:5px 0"><b>When It Breaks</b> <span style="color:var(--ash)">&middot; &ldquo;Rupture is normal. Repair is the skill.&rdquo;</span></li><li style="margin:5px 0"><b>Keeping Your Word at a Distance</b> <span style="color:var(--ash)">&middot; &ldquo;A kept promise counts double from far away.&rdquo;</span></li><li style="margin:5px 0"><b>The Reunion Day</b> <span style="color:var(--ash)">&middot; &ldquo;If the child pulls away, that is the start, not the answer.&rdquo;</span></li><li style="margin:5px 0"><b>The Long Return</b> <span style="color:var(--ash)">&middot; &ldquo;The return is a season, not a day.&rdquo;</span></li></ol><p class="fine" style="margin:6px 0 0"><a class="link" href="course-coming-home-present.html">Read them in full &rarr;</a></p></details>\n      <div class="cert-card-foot"><span class="mono">Free</span><a class="cert-card-go" href="course-coming-home-present.html">Read the sessions &rarr;</a></div>
    </div>
    <div class="cert-card" style="cursor:default" data-cert="anger" data-title="Steady Under Pressure" data-hours="6.0" data-desc="Steadiness, trained: the pause, the repair, and the habits underneath them. Sessions logged, identity checked, checkpoints, and a final assessment at eighty percent to pass.">
      <div class="cert-card-top"><span class="pill">Sessions live</span><span class="cert-card-hrs">6 sessions</span></div>
      <h3>Steady Under Pressure</h3>
      <p>Steadiness, trained: the pause, the repair, and the habits underneath them. All six written sessions are published; films are in production.</p>\n      <p class="fine" style="color:var(--ash);margin-top:12px">Not anger management, batterer intervention, or a substitute for any court-mandated program; not designed or validated for those purposes and never ordered in their place.</p>
      \n      <details class="sess-peek" style="margin-top:10px"><summary class="fine" style="cursor:pointer;color:var(--brass,#c9a227)">The 6 sessions, at a glance</summary><ol class="small" style="margin:8px 0 2px;padding-left:18px"><li style="margin:5px 0"><b>The Alarm System</b> <span style="color:var(--ash)">&middot; &ldquo;The surge is a signal, not an order.&rdquo;</span></li><li style="margin:5px 0"><b>The Pause and the Exhale</b> <span style="color:var(--ash)">&middot; &ldquo;Six seconds and a long exhale buy your judgment back.&rdquo;</span></li><li style="margin:5px 0"><b>The Step Away</b> <span style="color:var(--ash)">&middot; &ldquo;Step away to come back.&rdquo;</span></li><li style="margin:5px 0"><b>Naming It</b> <span style="color:var(--ash)">&middot; &ldquo;Say the feeling so you do not have to show it.&rdquo;</span></li><li style="margin:5px 0"><b>The Repair</b> <span style="color:var(--ash)">&middot; &ldquo;Own it out loud.&rdquo;</span></li><li style="margin:5px 0"><b>Steady Habits, Steady Mood</b> <span style="color:var(--ash)">&middot; &ldquo;Steadiness is built in the boring hours.&rdquo;</span></li></ol><p class="fine" style="margin:6px 0 0"><a class="link" href="course-steady-under-pressure.html">Read them in full &rarr;</a></p></details>\n      <div class="cert-card-foot"><span class="mono">Free</span><a class="cert-card-go" href="course-steady-under-pressure.html">Read the sessions &rarr;</a></div>
    </div>

    <div class="cert-card" style="cursor:default" data-cert="coparenting" data-title="Same Team" data-hours="6.0" data-desc="Co-parenting, trained. One team for your children, whatever the arrangement between you. Sessions logged, checkpoints, and a final assessment at eighty percent to pass.">
      <div class="cert-card-top"><span class="pill">Sessions live</span><span class="cert-card-hrs">6 sessions</span></div>
      <h3>Same Team</h3>
      <p>Co-parenting, trained. One team for your children, whatever the arrangement between you. All six written sessions are published; films are in production.</p>
      \n      <details class="sess-peek" style="margin-top:10px"><summary class="fine" style="cursor:pointer;color:var(--brass,#c9a227)">The 6 sessions, at a glance</summary><ol class="small" style="margin:8px 0 2px;padding-left:18px"><li style="margin:5px 0"><b>One Team for the Children</b> <span style="color:var(--ash)">&middot; &ldquo;Whatever we are to each other, we are one team for the child.&rdquo;</span></li><li style="margin:5px 0"><b>The Body in Conflict</b> <span style="color:var(--ash)">&middot; &ldquo;Flooded means pause. Twenty minutes, then resume.&rdquo;</span></li><li style="margin:5px 0"><b>Businesslike</b> <span style="color:var(--ash)">&middot; &ldquo;Short, factual, about the child.&rdquo;</span></li><li style="margin:5px 0"><b>Earning Back Trust</b> <span style="color:var(--ash)">&middot; &ldquo;Trust is bought with reliability, and never against an order.&rdquo;</span></li><li style="margin:5px 0"><b>One Child, Two Homes</b> <span style="color:var(--ash)">&middot; &ldquo;The child carries the distance. Lighten the load.&rdquo;</span></li><li style="margin:5px 0"><b>The Handoff</b> <span style="color:var(--ash)">&middot; &ldquo;Predictable beats perfect.&rdquo;</span></li></ol><p class="fine" style="margin:6px 0 0"><a class="link" href="course-same-team.html">Read them in full &rarr;</a></p></details>\n      <div class="cert-card-foot"><span class="mono">Free</span><a class="cert-card-go" href="course-same-team.html">Read the sessions &rarr;</a></div>
    </div>
      </div>

  <p class="small" style="margin-top:22px;max-width:72ch;color:var(--ash)"><b style="color:var(--bone)">Where to start.</b> Coming Home Present is the return spine after time away. Steady Under Pressure is the skills add-on when pressure is the issue. Same Team when co-parenting is the work. Fathering Fundamentals is the foundation&mdash;and the alumni home base.</p>
  <p class="fine" style="margin-top:14px">Whether a certificate satisfies a court, agency, or program requirement is decided by that body. Confirm with yours before enrolling. Every course and every Certificate of Completion is free to the man. Certified organizations and facilitators carry the standard; sponsorship funds seats and materials.</p>
</div></section>

<!-- PROOF IN CONTEXT: the certificate as a milestone, with real photography -->
<section class="cert-context"><div class="container">
  <div class="cert-context-grid">
    <div class="cert-context-photo">
      <img src="assets/img/photos/community-01.jpg" alt="Fathers gathered together">
    </div>
    <div class="cert-context-copy">
      <div class="eyebrow brass" style="margin-bottom:14px">WHY IT MATTERS</div>
      <h2 class="d-36" style="margin-bottom:20px">The document proves the work.<br>The change is his to make.</h2>
      <p class="lead" style="margin-bottom:16px">A judge sees a serial anyone can check. A program sees hours that were logged, not claimed. And the man who earned it sees the record: weeks he showed up, work he finished, a hard thing done all the way through. What that becomes in his home is not ours to promise. It is his to build, and this is proof he started.</p>
      <p class="small">We certify the work. He supplies the change.</p>
    </div>
  </div>
</div></section>

<!-- REQUIREMENTS: the flagship, detailed -->
<section id="fundamentals"><div class="container">
  <div class="cert-req-grid">
    <div>
      <div class="eyebrow brass" style="margin-bottom:12px" id="certEyebrow">FLAGSHIP COURSE</div>
      <h2 class="d-36" style="margin-bottom:8px" id="certTitle">Fathering Fundamentals</h2>
      <p class="mono small" style="margin-bottom:24px" id="certHours">Facilitator-attested completion record</p>
      <p style="max-width:56ch;margin-bottom:32px;color:var(--ash)" id="certDesc">The flagship curriculum, hardened into proof. The same lessons taught by fathers who have lived it, plus confirmed identity, logged time, checkpoints, and a final assessment. Built for every man on either track, not just those with kids today.</p>
      <h3 style="font-family:var(--font-display);font-weight:500;font-size:20px;margin-bottom:18px">What earning it requires</h3>
      <div class="cert-reqs">
        <div class="cert-req"><span class="cert-req-mark">&check;</span><span>Identity confirmed at enrollment: government ID, or in-person attestation by a Certified Facilitator</span></div>
        <div class="cert-req"><span class="cert-req-mark">&check;</span><span>Attention checkpoints inside every lesson</span></div>
        <div class="cert-req"><span class="cert-req-mark">&check;</span><span>Time on task logged, with no credit for skipping</span></div>
        <div class="cert-req"><span class="cert-req-mark">&check;</span><span>A final assessment, eighty percent to pass</span></div>
        <div class="cert-req"><span class="cert-req-mark">&check;</span><span>Curriculum built on the Keystone framework, National Center for Fathering</span></div>
        <div class="cert-req"><span class="cert-req-mark">&check;</span><span>A unique serial with a public verification page</span></div>
      </div>
    </div>
    <aside class="cert-req-side">
      <div class="cert-req-card">
        <div class="cert-price-label"><span class="fine">THE COURSE AND THE CERTIFICATE</span></div>
        <div class="cert-req-price"><span class="mono">Free</span><span class="fine">to the man, always</span></div>
        <a class="btn btn-secondary" id="certExplore" href="enroll.html?cert=fundamentals&amp;title=Fathering%20Fundamentals&amp;hours=10.0" style="width:100%;margin-bottom:12px">Explore this course</a>
        <div class="cert-free-line">
          <span class="fine">Not sure yet?</span>
          <b>The Keystone Profile is free.</b>
          <p class="fine" style="margin-top:6px">Take your baseline first to see where to focus. No cost, no card.</p>
          <a class="btn btn-yellow" href="profile.html" style="width:100%;margin-top:12px">Take your free baseline</a>
        </div>
      </div>
      <div class="cert-req-note">
        <b>Running a program?</b>
        <p class="small" style="margin:6px 0 14px">Become a Certified Organization: credentialed facilitators, cohorts, and completion in your Efficacy Report. Free for your men, always.</p>
        <a class="link brass" href="organizations.html" style="font-size:14px">Get certified &rarr;</a>
      </div>
    </aside>
  </div>
</div></section>
<script>
(function(){
  var cards = document.querySelectorAll('.cert-card[data-cert]');
  var title = document.getElementById('certTitle');
  var hours = document.getElementById('certHours');
  var desc = document.getElementById('certDesc');
  var eyebrow = document.getElementById('certEyebrow');
  if(!title) return;
  cards.forEach(function(c){
    c.addEventListener('click', function(e){
      e.preventDefault();
      title.textContent = c.getAttribute('data-title');
      var SESS = {fundamentals:'5', reentry:'8', anger:'6', coparenting:'6', manhood:'6'};
      hours.textContent = (SESS[c.getAttribute('data-cert')] || '') + ' sessions, facilitator-attested';
      desc.textContent = c.getAttribute('data-desc');
      eyebrow.textContent = c.getAttribute('data-cert')==='fundamentals' ? 'FLAGSHIP COURSE' : 'COURSE';
      var explore = document.getElementById('certExplore');
      if(explore){
        var slug = c.getAttribute('data-cert');
        var courseHref = {fundamentals:'class.html', reentry:'course-coming-home-present.html', anger:'course-steady-under-pressure.html', coparenting:'course-same-team.html'}[slug];
        explore.setAttribute('href', courseHref || 'certificates.html');
        explore.textContent = slug==='fundamentals' ? 'Explore this course' : 'Read the sessions';
      }
      document.getElementById('fundamentals').scrollIntoView({behavior:'smooth'});
    });
  });
})();
</script>
''')

# ================================================== certificate.html (P10 screen 4)
PAGES['certificate.html'] = dict(title='Certificate of Completion, specimen', desc='What the Certificate of Completion looks like. Every issued certificate carries a live serial verifiable at fathers.com/verify.', active='Certificates', mode='app', body='''
<section class="tight" style="padding-top:44px"><div class="container">
  <div class="row wrap" style="margin-bottom:28px;justify-content:center">
    <button class="btn btn-primary btn-sm" data-print>Print or save as PDF</button>
    <button class="btn btn-secondary btn-sm" data-share="email">Email to my officer or program</button>
    <button class="btn btn-secondary btn-sm" onclick="window.print()">Print</button>
  </div>
  <div class="doc">
    <div class="brassline"></div>
    <div class="row" style="justify-content:center;margin-bottom:26px"><img src="assets/img/logomark-dark.png" alt="Fathers.com" style="height:44px"></div>
    <div class="head">Certificate of Completion &middot; National Center for Fathering</div>
    <div class="name">Your Name</div>
    <div class="course">has completed the Fathering Fundamentals Certificate</div>
    <div class="hours">Facilitator-attested completion &middot; 5 sessions &middot; Completed June 2, 2026</div>
    <div class="rule"></div>
    <div class="sealrow">
      <div>
        <div class="serial">SPECIMEN &middot; SERIAL FC-2026-&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;</div>
        <div class="serial" style="margin-top:6px">Identity verified at enrollment</div>
        <div class="serial" style="margin-top:6px">Issued by the National Center for Fathering</div>
        <div class="serial" style="margin-top:14px"><b>Verify at fathers.com/verify</b></div>
      </div>
      <div class="row" style="gap:18px;align-items:flex-end">
        <div class="qr">QR</div>
        <div class="slot r-1x1" data-slot="IMG-P10-CRT-01" style="width:84px;background:#EAE4D8;border-color:#B98A2F"></div>
      </div>
    </div>
  </div>
</div></section>
''')

# ================================================== verify.html (P10 screen 5, public, no chrome)

# ================================================== LEGAL PAGES (scaffolding, dated today)
# NOTE: The body text below is PLAIN-LANGUAGE DRAFT scaffolding for legal review.
# Replace with counsel-reviewed text before relying on these as binding policy.
LEGAL_INTRO = '''<div class="legal-note"><b>Effective August 10, 2026.</b> Questions about these documents: Team@Fathers.com.</div>'''

PAGES['terms.html'] = dict(title='Terms of Service', desc='The terms for using Fathers.com.', active='', mode='public', body='''
<section class="legal"><div class="container" style="max-width:760px">
  <div class="eyebrow brass" style="margin-bottom:14px">LEGAL</div>
  <h1 class="d-48" style="margin-bottom:8px">Terms of Service</h1>
  <p class="fine" style="margin-bottom:8px">Last updated July 06, 2026</p>
  ''' + LEGAL_INTRO + '''
  <div class="legal-body">
    <h2>1. Agreement to terms</h2>
    <p>By using Fathers.com, you agree to these terms. Fathers.com is a program of the National Center for Fathering, a 501(c)(3) nonprofit. If you do not agree, do not use the service.</p>
    <h2>2. Who can use Fathers.com</h2>
    <p>You must be at least 18 years old to create an account. The service is built for fathers, future fathers, and mentors. Content is intended for adults.</p>
    <h2>3. Your account</h2>
    <p>You are responsible for your account and for keeping your sign-in secure. Your assessment results and plan are yours. We describe how we handle your data in the Privacy Policy.</p>
    <h2>4. The Keystone Profile and your plan</h2>
    <p>The Keystone Father Profile is an educational assessment grounded in the published research of the National Center for Fathering. It is not a clinical, diagnostic, legal, or medical instrument, and results should not be used as a substitute for professional advice.</p>
    <h2>5. Certificates</h2>
    <p>Certificates of Completion require completion of the stated requirements, including identity confirmation and a passing assessment, and are issued at no cost to the participant. Certificates attest to completion of a Fathers.com course. Acceptance by any court, agency, or program is at that body's discretion; we do not guarantee acceptance.</p>
    <h2>6. Payments and subscriptions</h2>
    <p>The Keystone Profile is free. The Keystone Profile, all courses, and the Certificate of Completion are provided at no cost to the participant. An optional library membership and organizational certification are paid; pricing and refund terms are stated at the point of purchase. Pricing, billing terms, and refund policy will be stated at the point of purchase.</p>
    <h2>7. Acceptable use</h2>
    <p>Do not misuse the service, attempt to forge certificates, share your account, or use the service to harm others. We may suspend accounts that violate these terms.</p>
    <h2>8. Content and intellectual property</h2>
    <p>The courses, assessment, and materials on Fathers.com are owned by the National Center for Fathering or its licensors. You may use them for your own growth, not for redistribution.</p>
    <h2>9. Disclaimers and limitation of liability</h2>
    <p>The service is provided as is. To the fullest extent permitted by law, the National Center for Fathering is not liable for indirect or consequential damages arising from your use of the service.</p>
    <h2>10. Changes to these terms</h2>
    <p>We may update these terms. Material changes will be posted here with a new date. Continued use after changes means you accept them.</p>
    <h2>11. Contact</h2>
    <p>Questions about these terms: Team@Fathers.com, or PO Box 996, Tontitown, AR 72770.</p>
  </div>
</div></section>
''')

PAGES['privacy.html'] = dict(title='Privacy Policy', desc='How Fathers.com handles your information.', active='', mode='public', body='''
<section class="legal"><div class="container" style="max-width:760px">
  <div class="eyebrow brass" style="margin-bottom:14px">LEGAL</div>
  <h1 class="d-48" style="margin-bottom:8px">Privacy Policy</h1>
  <p class="fine" style="margin-bottom:8px">Last updated July 06, 2026</p>
  ''' + LEGAL_INTRO + '''
  <div class="legal-body">
    <h2>Our commitment</h2>
    <p>Fathers.com is a program of the National Center for Fathering. Your assessment answers and plan are personal. We treat them with care and we do not sell them.</p>
    <h2>What we collect</h2>
    <p>We collect: the email you use to sign in; your Keystone Profile answers and results; your plan progress; and basic technical data needed to run the service. During the pilot, identity is attested in person by a Certified Facilitator; independent ID-based enrollment is off. If it returns, we will use a verification vendor that returns a confirmation only, never store the image, and state the deletion interval in days on this page. Before the pilot we collected a government ID only when identity was confirmed that way at enrollment, and we delete it after issuance. When a Certified Facilitator confirms identity in person, no ID is collected by us at all.</p>
    <h2>How we use it</h2>
    <p>We use your information to give you your results, build and save your ninety-day plan, issue certificates you earn, and send you plan reminders and account emails. We do not use your assessment answers for advertising.</p>
    <h2>What we do not do</h2>
    <p>We do not sell your personal information. We do not share your assessment results with employers, courts, or programs unless you direct us to. We do not use your reflections about your family for any purpose beyond serving you.</p>
    <h2>Sharing</h2>
    <p>We share data only with service providers who help us run the platform (for example, hosting and email delivery), under agreements that require them to protect it. If you are enrolled through an employer or group, we describe separately what that organization can see.</p>
    <h2>Your choices</h2>
    <p>You can access your data, correct it, or ask us to delete your account and results. Contact Team@Fathers.com. You can unsubscribe from emails at any time.</p>
    <h2>Data retention</h2>
    <p>We keep your results and plan while your account is active. Identity documents for certificates are deleted after the certificate is issued. If you delete your account, we remove your personal data on a reasonable schedule.</p>
    <h2>Security</h2>
    <p>We protect your data with access controls and encryption in transit. See our Security page for more.</p>
    <h2>State privacy rights</h2>
    <p>Depending on where you live, you may have additional rights (for example, under California law) to access, delete, or restrict use of your information. Contact us to exercise them.</p>
    <h2>Changes</h2>
    <p>We may update this policy. Material changes will be posted here with a new date.</p>
    <h2>Contact</h2>
    <p>Privacy questions: Team@Fathers.com, or PO Box 996, Tontitown, AR 72770.</p>
  </div>
</div></section>

<h2>When someone else asks for your answers</h2>
<p>We do not give your individual answers to your program, your officer, your employer, or a court unless you tell us to in writing. If we receive a subpoena or court order, we are required to respond, and we will tell you before we do unless the law forbids it. Your program sees only group totals, never your individual answers. If you would rather not write something down, do not write it down; your completion never depends on what you disclose.</p>
''')

PAGES['security.html'] = dict(title='Security', desc='How Fathers.com protects your information.', active='', mode='public', body='''
<section class="legal"><div class="container" style="max-width:760px">
  <div class="eyebrow brass" style="margin-bottom:14px">LEGAL</div>
  <h1 class="d-48" style="margin-bottom:8px">Security</h1>
  <p class="fine" style="margin-bottom:8px">Last updated July 06, 2026</p>
  ''' + LEGAL_INTRO + '''
  <div class="legal-body">
    <h2>How we protect your data</h2>
    <p>Fathers.com is built on modern, access-controlled infrastructure. Your data is protected by row-level security, so your results and plan are visible only to you and to staff who need access to run the service.</p>
    <h2>Encryption</h2>
    <p>Data is encrypted in transit. Sign-in uses secure, passwordless links rather than stored passwords.</p>
    <h2>Sensitive data</h2>
    <p>Identity documents submitted for certificates are used only to verify you and are deleted after the certificate is issued. We minimize the sensitive data we hold.</p>
    <h2>Access controls</h2>
    <p>Access to member data is limited by role. Administrative access is restricted and logged.</p>
    <h2>Reporting a concern</h2>
    <p>If you believe you have found a security issue, contact Team@Fathers.com. We take reports seriously and will respond.</p>
  </div>
</div></section>
''')

PAGES['verify.html'] = dict(title='Verify a credential', desc='Enter a serial. Confirm a Certificate of Completion, a Certified Facilitator, or a Certified Organization in the public registry.', active='', mode='public', nochrome=True, body='''
<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:64px 20px">
  <a class="brand" href="index.html" style="margin-bottom:56px"><img class="lg-dark" src="assets/img/logomark-light.png" alt="Fathers.com logomark" style="height:34px"><img class="lg-light" src="assets/img/logomark-dark.png" alt="Fathers.com logomark" style="height:34px"><b style="font-family:var(--font-display);font-size:20px">Fathers.com</b></a>
  <div style="width:100%;max-width:520px">
    <h1 class="d-36" style="margin-bottom:8px">Verify a certificate</h1>
    <p class="small" style="margin-bottom:28px">Enter the serial printed on the document. Ten seconds, no login.</p>
    <form id="verifyForm" class="row" style="margin-bottom:28px">
      <input class="input mono" placeholder="FC-2026-000000" aria-label="Certificate serial">
      <button class="btn btn-primary">Verify</button>
    </form>
    <div id="v-ok" class="card" style="display:none;border-color:var(--pine-hi)">
      <div class="row" style="margin-bottom:18px"><span class="checkmark">&check;</span><b style="letter-spacing:.14em">VALID</b></div>
      <div class="stack-8">
        <div class="row between"><span class="fine">Recipient</span><b class="small" data-f="name"></b></div>
        <div class="row between"><span class="fine">Course</span><b class="small" data-f="course"></b></div>
        <div class="row between"><span class="fine">Record</span><b class="small mono" data-f="hours"></b></div>
        <div class="row between"><span class="fine">Identity</span><b class="small" data-f="identity"></b></div>
        <div class="row between"><span class="fine">Date</span><b class="small" data-f="date"></b></div>
        <div class="row between"><span class="fine">Serial</span><b class="small mono" data-f="serial"></b></div>
        <div class="row between"><span class="fine">Identity</span><b class="small">Verified at enrollment</b></div>
        <div class="row between"><span class="fine">Issuer</span><b class="small">National Center for Fathering</b></div>
      </div>
      <hr class="hr" style="margin:18px 0"><p class="small" style="margin-bottom:12px">This certificate was earned through logged sessions, identity confirmed at enrollment, and a written final reviewed by a Certified Facilitator. <a class="link" href="organizations.html">Issue these in your program &rarr;</a></p><a class="link ash" href="#" data-share="report" style="font-size:13px">Report a concern</a>
    </div>
    <div id="v-susp" class="card" style="display:none;border-color:var(--brass,#6B4F14)">
      <b>SUSPENDED.</b><p class="small" style="margin-top:8px">This serial exists, and it is suspended pending review. It does not currently verify. Questions: Team@Fathers.com.</p>
    </div>
    <div id="v-rev" class="card" style="display:none;border-color:var(--error)">
      <b>REVOKED.</b><p class="small" style="margin-top:8px">This serial was issued and has been revoked. It does not verify. Names can come off the registry; that is what makes staying on it mean something.</p>
    </div>
    <div id="v-no" class="card" style="display:none;border-color:var(--error)">
      <b>NOT FOUND.</b><p class="small" style="margin-top:8px">Check the serial and try again.</p>
    </div>
    <p class="fine" style="margin-top:32px">Every certificate carries a serial beginning FC-2026-, followed by six characters. A serial resolves as issued, suspended, or revoked; anything that does not resolve is not a Fathers.com certificate.</p>
  </div>
</div>
''')

# ================================================== veterans.html (P11)


# ================================================== employers.html (P12)
PAGES['employers.html'] = dict(title='For Employers', desc='Your parental benefits were built around mothers. Cover the fathers too.', active='', mode='public', body='''
<header class="hero"><div class="container split">
  <div>
    <div class="eyebrow" style="margin-bottom:16px">FOR EMPLOYERS</div>
    <h1 class="d-48">Paternity leave is two weeks. Fatherhood is forever.</h1>
    <p class="lead" style="margin:20px 0 30px">Your parental benefits were built around mothers. Give the fathers on your team a baseline, a plan, and training that fits the leave you already offer.</p>
    <a class="btn btn-primary" href="#partner">Become a design partner</a>
  </div>
  <div class="slot r-4x3" data-slot="IMG-P12-HER-01"></div>
</div></header>

<section class="band tight"><div class="container grid-3">
  <div class="card"><p style="font-size:17px;margin-bottom:12px">Most U.S. fathers take 10 or fewer days of leave.</p><p class="mono fine">[DOL-CITED RESEARCH]</p></div>
  <div class="card"><p style="font-size:17px;margin-bottom:12px">Paternal depression around a birth: roughly 1 in 10.</p><p class="mono fine">[JAMA META-ANALYSIS]</p></div>
  <div class="card"><p style="font-size:17px;margin-bottom:12px">Family benefits platforms are a proven employer category.</p><p class="mono fine">[MARKET COMPS ON REQUEST]</p></div>
</div></section>

<section class="tight"><div class="container">
  <h2 class="d-28" style="margin-bottom:24px">How it works</h2>
  <div class="steps3" style="margin-bottom:56px">
    <div class="s"><div class="n">01</div><p class="small" style="margin-top:8px">A father activates his seat before or during leave</p></div>
    <div class="s"><div class="n">02</div><p class="small" style="margin-top:8px">He takes the twenty-minute baseline and gets a leave-fitted plan</p></div>
    <div class="s"><div class="n">03</div><p class="small" style="margin-top:8px">You see activation and completion. Never his answers.</p></div>
  </div>
  <h2 class="d-28" style="margin-bottom:24px">What's in the seat</h2>
  <div class="grid-2" style="max-width:760px">
    <div class="stack-8">
      <div class="check"><span class="checkmark">&check;</span><span class="small">Every film, class, and workbook as they publish; the library is in production, films uploading as they finish</span></div>
      <div class="check"><span class="checkmark">&check;</span><span class="small">The Keystone baseline and ninety-day plan for every man</span></div>
    </div>
    <div class="stack-8">
      <div class="check"><span class="checkmark">&check;</span><span class="small">Facilitator-led certificate courses, free to the man</span></div>
      <div class="check"><span class="checkmark">&check;</span><span class="small"><b class="bone">Aggregate reporting only.</b></span></div>
    </div>
  </div>
</div></section>

<section class="band" id="partner"><div class="container split" style="align-items:start">
  <div><h2 class="d-36">We are selecting three employers to co-build this benefit.</h2>
    <p style="color:var(--ash);margin-top:16px;max-width:48ch">Partners get founding pricing, roadmap input, and a named case study, and they shape the reporting.</p></div>
  <form class="card" style="padding:32px" data-lead="employers" data-done="We read every application. Expect a reply within three business days.">
    <div class="grid-2" style="gap:16px"><div class="field"><label>Name</label><input class="input" name="name" required></div>
      <div class="field"><label>Company</label><input class="input" name="company" required></div></div>
    <div class="grid-2" style="gap:16px"><div class="field"><label>Role</label><input class="input" name="role"></div>
      <div class="field"><label>Employees on parental leave per year</label><select class="input" name="leave_volume"><option>Under 25</option><option>25-100</option><option>100-500</option><option>500 plus</option></select></div></div>
    <div class="field"><label>Email</label><input class="input" name="email" type="email" required></div>
    <div class="field"><label>Message</label><textarea name="message"></textarea></div>
    <button class="btn btn-primary">Apply to partner</button>
  </form>
</div></section>

<section class="tight"><div class="container" style="max-width:820px">
  <details><summary>How is this different from our EAP?</summary><div class="body">An EAP waits for a crisis call. This is training with a baseline, a plan, and completion you can see in aggregate. Fathers use it because it does not feel like an EAP.</div></details>
  <details><summary>What does HR see?</summary><div class="body">Activation and completion counts. Never a man's answers, scores, or notes. Aggregate reporting only.</div></details>
  <details><summary>How does it fit our leave policy?</summary><div class="body">The plan is fitted to the leave you already offer. Two weeks or twelve, the seat starts when he does and keeps running after he returns.</div></details>
  <details><summary>What does it cost?</summary><div class="body">Design partners set founding pricing with us. Per-seat, annual.</div></details>
</div></section>
''')


# ================================================== login.html (auth)
PAGES['login.html'] = dict(title='Sign in', desc='Sign in to Fathers.com to pick up your plan.', active='', mode='public', nochrome=True, body="""
<style>
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 20px}
.auth-wrap{width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center}
.auth-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:26px}
.auth-brand img{height:30px;width:auto}
.auth-brand span{font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--bone)}
.auth-card{width:100%;background:var(--coal);border:1px solid var(--hairline);border-radius:16px;padding:36px 32px;box-shadow:var(--shadow)}
.auth-title{font-family:var(--font-display);font-size:26px;font-weight:600;color:var(--bone);margin-bottom:6px;letter-spacing:-.01em}
.auth-sub{font-size:14px;color:var(--ash);margin-bottom:26px;line-height:1.5}
.auth-field{margin-bottom:18px}
.auth-field label{display:block;font-size:13px;font-weight:600;color:var(--bone);margin-bottom:8px}
.auth-label-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.auth-label-row label{margin-bottom:0}
.auth-forgot{background:none;border:0;padding:0;cursor:pointer;font-family:var(--font-ui);font-size:13px;color:var(--brass);font-weight:500}
.auth-forgot:hover{text-decoration:underline;text-underline-offset:2px}
.auth-btn{width:100%;margin-top:6px}
.auth-msg{font-size:13px;margin-top:12px;min-height:16px;line-height:1.4}
.auth-or{display:flex;align-items:center;gap:14px;margin:22px 0}
.auth-or::before,.auth-or::after{content:"";flex:1;height:1px;background:var(--hairline)}
.auth-or span{font-size:12px;color:var(--ash)}
.auth-alt{margin-top:24px;font-size:14px;color:var(--ash);text-align:center}
.auth-alt a{color:var(--bone);font-weight:500;text-decoration:underline;text-underline-offset:3px}
.auth-legal{margin-top:34px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center}
.auth-legal a{font-size:12px;color:var(--ash);text-decoration:none}
.auth-legal a:hover{color:var(--bone)}
.auth-legal span{font-size:12px;color:var(--ash)}
.auth-copy{margin-top:14px;font-size:11px;color:var(--ash);text-align:center;line-height:1.5;max-width:320px}
@media(max-width:480px){.auth-card{padding:28px 22px}}
</style>
<div class="auth-page"><div class="auth-wrap">
  <a class="auth-brand" href="index.html">
    <img class="lg-dark" src="assets/img/logomark-light.png" alt="Fathers.com">
    <img class="lg-light" src="assets/img/logomark-dark.png" alt="Fathers.com">
    <span>Fathers.com</span>
  </a>
  <div class="auth-card">
    <h1 class="auth-title" id="authTitle">Sign in</h1>
    <p class="auth-sub" id="authSub">Welcome back. Pick up your plan where you left off.</p>
    <form id="authForm" novalidate>
      <div class="auth-field" id="authNameField" style="display:none">
        <label for="authName">Your name</label>
        <input id="authName" class="input" type="text" autocomplete="name" placeholder="First name is fine">
      </div>
      <div class="auth-field">
        <label for="authEmail">Email</label>
        <input id="authEmail" class="input" type="email" autocomplete="username" placeholder="you@example.com" required>
      </div>
      <div class="auth-field">
        <div class="auth-label-row"><label for="authPass">Password</label><button type="button" class="auth-forgot" id="authForgot">Forgot?</button></div>
        <input id="authPass" class="input" type="password" autocomplete="current-password" placeholder="Your password">
      </div>
      <button class="btn btn-primary auth-btn" id="authSignin" type="submit">Sign in</button>
      <p class="auth-msg" id="authMsg" role="status" aria-live="polite"></p>
    </form>
  </div>
  <p class="auth-alt"><span id="authAltTxt">New here? </span><a href="#" id="authAltLink">Create an account</a></p>
  <div class="auth-legal">
    <a href="terms.html">Terms</a><span aria-hidden="true">&middot;</span>
    <a href="privacy.html">Privacy</a><span aria-hidden="true">&middot;</span>
    <a href="security.html">Security</a>
  </div>
  <p class="auth-copy">&copy; 2026 Fathers.com. A program of the National Center for Fathering.</p>
</div></div>
""")

# ================================================== enroll.html (claim-gated enrollment)
PAGES['enroll.html'] = dict(title='Enroll', desc='Enroll free. Finish the work and receive your Certificate of Completion.', active='Certificates', mode='app', body='''
<style>
.cpn-ok{color:var(--pine-hi)!important}
.cpn-err{color:var(--error)!important}
.enroll-code{display:flex;gap:10px;align-items:stretch}
.enroll-code .input{flex:1}
</style>
<section class="tight" style="padding-top:56px"><div class="container" style="max-width:1040px">
  <div id="enrollPanel">
    <a class="link ash" href="certificates.html" style="font-size:13px;display:inline-block;margin-bottom:20px">&larr; All certificates</a>
    <div style="display:grid;grid-template-columns:1.2fr .9fr;gap:48px;align-items:start" class="enroll-grid">
      <div>
        <div class="eyebrow brass" style="margin-bottom:14px">THE CERTIFICATE OF COMPLETION</div>
        <h1 class="d-36" style="margin-bottom:14px">Enroll in <span id="certTitle">this course</span></h1>
        <p class="lead" style="margin-bottom:30px">Verified proof that you did the work, at no cost to you. Identity confirmed, hours logged, checkpoints passed, and a serial anyone can confirm.</p>
        <p class="fine" style="margin:-18px 0 26px">Whether a certificate satisfies a court, agency, or program requirement is decided by that body. Confirm with yours before enrolling.</p>
        <div class="eyebrow" style="margin-bottom:16px">WHAT EARNING IT REQUIRES</div>
        <div class="stack-16">
          <div class="check"><span class="checkmark">&check;</span><span class="small">Confirm your identity once at enrollment: in person, attested by the Certified Facilitator who knows you. Independent ID enrollment is off during the pilot.</span></div>
          <div class="check"><span class="checkmark">&check;</span><span class="small">Complete every session. Time on task is measured on the server, not claimed.</span></div>
          <div class="check"><span class="checkmark">&check;</span><span class="small">Pass the checkpoints and a final assessment at eighty percent.</span></div>
          <div class="check"><span class="checkmark">&check;</span><span class="small">Receive a unique serial with a public verification page. Your name and course title appear on that page for your serial.</span></div>
        </div>
        <p class="fine" style="margin-top:24px">Seats come through people, not codes. A Certified Facilitator or Certified Organization claims your seat; your completion then counts in your cohort&rsquo;s report, and everything stays free to you.</p>
      </div>
      <aside class="card" style="padding:28px">
        <div class="row between" style="margin-bottom:4px"><b id="certTitleSum">This course</b><b class="mono" id="priceLine">Free</b></div>
        <p class="small" style="margin-bottom:20px"><span id="certHours">Facilitator-attested completion</span> &middot; no cost to you</p>

        <div class="card" style="padding:16px 18px;margin-bottom:16px;background:var(--coal-2);border:1px solid var(--hairline)">
          <div class="eyebrow" style="margin-bottom:8px">YOUR SEAT</div>
          <p class="small" id="claimStatus" style="margin:0">Your seat is claimed by your program&rsquo;s Certified Facilitator or Certified Organization. Signed in and claimed, this button enrolls you at no cost.</p>
        </div>
        <div class="row between" style="margin-bottom:20px"><b>Total</b><b class="mono" id="totalLine">Free</b></div>

        <button class="btn btn-primary" id="enrollBtn" style="width:100%">Enroll</button>
        <p class="fine" id="enrollNote" style="margin-top:14px">Not in a program yet? Ask your organization to <a class="link ash" href="organizations.html">get certified</a>.</p>
      </aside>
    </div>
  </div>

  </div>
  <div id="successPanel" style="display:none">
    <div class="center" style="max-width:620px;margin:40px auto">
      <span class="checkmark" style="width:56px;height:56px;font-size:26px;margin:0 auto 22px;display:inline-flex">&check;</span>
      <h1 class="d-36" style="margin-bottom:10px">You are enrolled.</h1>
      <p class="small" style="margin-bottom:36px">Your seat in <b class="bone" id="successTitle">this certificate</b> is saved. Your first step is to verify your identity, then begin the hours. Nothing expires, so start whenever you are ready.</p>
      <div class="row wrap" style="gap:14px;justify-content:center">
        <a class="btn btn-primary" id="beginBtn" href="class.html">Begin your certificate</a>
        <a class="btn btn-secondary" href="plan.html">Back to My Plan</a>
      </div>
    </div>
  </div>
</div></section>
<script src="assets/js/enroll.js"></script>
''')

# --- shared top for every veteran page: styles + always-present crisis strip ---
VET_TOP = '''<link rel="stylesheet" href="assets/css/veterans.css">
'''

# ================================================== veterans.html (front door)


# ================================================== veterans-hub.html


# ================================================== veterans-resources.html
PAGES['veterans-resources.html'] = dict(title='The Homefront', desc='Support, on your terms.', active='', mode='public', nochrome=True, body='''
<meta http-equiv="refresh" content="0;url=veterans-hub.html#support">
<script>location.replace('veterans-hub.html#support');</script>
<p class="center fine" style="padding:60px 0">This now lives inside your hub. <a class="link" href="veterans-hub.html#support">Continue &rarr;</a></p>
''')

PAGES['veterans-checkin.html'] = dict(title='A private check-in', desc='A private, two-minute check-in. Yours alone. It points to a next step only if you want one.', active='For Veterans', mode='app', body=VET_TOP + '''
<section class="tight"><div class="container" style="max-width:760px">
  <div class="eyebrow brass" style="margin-bottom:12px">PRIVATE, ABOUT TWO MINUTES</div>
  <h1 class="d-36" style="margin-bottom:18px">A check-in, just for you</h1>
  <div id="vetCheckin"></div>
</div></section>
<script src="assets/js/veterans-core.js"></script>
<script src="assets/js/veterans-checkin.js"></script>
''')

# ================================================== voice.html


# ================================================== veterans-module.html
PAGES['veterans-module.html'] = dict(title='A skill for returning fathers', desc='A short, plain lesson for returning fathers.', active='For Veterans', mode='app', auth=True, body=VET_TOP + '''
<section class="tight"><div class="container" style="max-width:760px">
  <a class="link ash" href="veterans-hub.html" style="font-size:13px;display:inline-block;margin-bottom:20px">&larr; Your hub</a>
  <div id="vetModule"><p class="ash">Loading&hellip;</p></div>
  <div style="margin-top:36px"><a class="link" id="vetModuleNext" href="veterans-hub.html">Next &rarr;</a></div>
</div></section>
<script src="assets/js/veterans-core.js"></script>
<script src="assets/js/veterans-modules.js"></script>
''')

# ================================================== veterans.html (front door, rebuilt)


# ================================================== veterans-hub.html (editorial hub, rebuilt)


PAGES['veterans-hub.html'] = dict(title='The Homefront', desc='Train for the mission at home: the field guide, the Legacy Archive, your ground, your record. Built for fathers who served.', active='For Veterans', mode='app', auth=True, body=VET_TOP + '''
<section class="vet-hero" style="min-height:420px">
  <img class="vet-hero-img" src="assets/img/photos/community-01.jpg" alt="">
  <div class="vet-hero-inner">
    <div class="vet-hero-eyebrow">Fathers.com &middot; For those who served</div>
    <h1>The mission continues.</h1>
    <p class="vet-hero-lead" id="vetGreet">You carried the load out there. This is where you train for the one that matters most, and put it on the record. You are early; the men here first set the standard.</p>
  </div>
</section>

<section class="vet-ed vet-ed-noline" style="padding-top:8px">
  <div class="vet-ed-head">
    <div id="orgSupport" hidden class="card" style="padding:18px 22px">
      <div class="vet-ed-eyebrow" style="margin-bottom:6px">YOUR PROGRAM'S SUPPORT</div>
      <p class="small" id="orgSupportTxt" style="margin:0"></p>
    </div>
  </div>
</section>

<section class="vet-ed vet-ed-noline" id="startHere">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">First fifteen minutes</div>
    <h2>Three moves. Then everything below makes sense.</h2>
  </div>
  <div class="grid-3" style="margin-top:22px">
    <div class="card" style="padding:24px 26px" data-vetstep="checkin">
      <div class="row between" style="margin-bottom:10px"><span class="pill">STEP 1</span><span class="fine mono" data-state>&nbsp;</span></div>
      <h3 style="margin-bottom:6px">Take the check-in</h3>
      <p class="small" style="color:var(--ash);margin-bottom:14px">Two minutes, private, no wrong answers. It sets your starting point so the plan fits the week you are actually having.</p>
      <a class="btn btn-secondary btn-sm" href="veterans-checkin.html">Start the check-in</a>
    </div>
    <div class="card" style="padding:24px 26px" data-vetstep="film">
      <div class="row between" style="margin-bottom:10px"><span class="pill">STEP 2</span><span class="fine mono" data-state>&nbsp;</span></div>
      <h3 style="margin-bottom:6px">Watch your first film</h3>
      <p class="small" style="color:var(--ash);margin-bottom:14px">Short and plain, from fathers who walked back through the same door. Pick any one below; each is about six minutes.</p>
      <a class="btn btn-secondary btn-sm" href="#fieldguide">Pick a film</a>
    </div>
    <div class="card" style="padding:24px 26px" data-vetstep="voice">
      <div class="row between" style="margin-bottom:10px"><span class="pill">STEP 3</span><span class="fine mono" data-state>&nbsp;</span></div>
      <h3 style="margin-bottom:6px">Record sixty seconds</h3>
      <p class="small" style="color:var(--ash);margin-bottom:14px">Here is why: it plays on the nights you cannot be there, and it stays theirs no matter what. One take is enough. Prompts are ready if the words are not.</p>
      <a class="btn btn-secondary btn-sm" href="voice.html">Record it</a>
    </div>
  </div>
</section>

<section class="vet-ed vet-ed-noline" id="fieldguide">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">The field guide</div>
    <h2>Skills for the homefront</h2>
    <p>Short, plain films and reads on what gets hard when you walk back through the door. Built from what other fathers who served said they needed most.</p>
  </div>
  <div class="vet-stories">
    <a class="vet-story" href="veterans-module.html?m=reconnecting"><img src="assets/img/photos/hero-01.jpg" alt=""><div class="vet-story-body"><div class="vet-story-min">Film &middot; 6 min</div><h3>When your kid feels like a stranger</h3><p>Rebuilding closeness after time away</p></div></a>
    <a class="vet-story" href="veterans-module.html?m=temper"><img src="assets/img/photos/hero-02.jpg" alt=""><div class="vet-story-body"><div class="vet-story-min">Film &middot; 6 min</div><h3>Staying steady, and the way back</h3><p>Anger, the pause, and the repair</p></div></a>
    <a class="vet-story" href="veterans-module.html?m=emotion"><img src="assets/img/photos/hero-03.jpg" alt=""><div class="vet-story-body"><div class="vet-story-min">Film &middot; 5 min</div><h3>Saying what you feel</h3><p>Breaking through the numbness</p></div></a>
    <a class="vet-story" href="veterans-module.html?m=command"><img src="assets/img/photos/hero-04.jpg" alt=""><div class="vet-story-body"><div class="vet-story-min">Read &middot; 5 min</div><h3>From command to connection</h3><p>Leading a family is a different job</p></div></a>
    <a class="vet-story" href="veterans-module.html?m=coparenting"><img src="assets/img/photos/hero-05.jpg" alt=""><div class="vet-story-body"><div class="vet-story-min">Read &middot; 5 min</div><h3>Fathering across two homes</h3><p>Presence when you are not the only house</p></div></a>
    <a class="vet-story" href="veterans-module.html?m=nurturing"><img src="assets/img/photos/hero-06.jpg" alt=""><div class="vet-story-body"><div class="vet-story-min">Read &middot; 4 min</div><h3>Small acts, every day</h3><p>Nurturing is a set of habits</p></div></a>
  </div>
</section>

<section class="vet-ed">
  <div class="vet-split">
    <div>
      <div class="vet-ed-eyebrow">The Legacy Archive</div>
      <h2>Your voice, in their day. Forever theirs.</h2>
      <p>Record a story or a message your kids can replay when they miss you. Private to you, secured, and yours alone. It is the most personal tool here, and it has its own home.</p>
      <a class="btn btn-yellow" href="voice.html">Open Voice</a>
    </div>
    <img class="vet-split-img" src="assets/img/photos/hero-07.jpg" alt="">
  </div>
</section>

<section class="vet-ed">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">Your ground</div>
    <h2>Know it. Check it. Move it.</h2>
    <p>Two private tools that meet you where you are and point you forward. Yours alone, never shared.</p>
  </div>
  <div class="grid-2" style="gap:24px">
    <div class="card" style="padding:28px">
      <b class="bone" style="font-family:var(--font-display);font-size:20px">Your baseline</b>
      <p class="small" style="margin:10px 0 18px">The Keystone Profile shows your real strengths and the one place growth pays off most, then builds a plan around it.</p>
      <a class="btn btn-secondary" href="profile.html">Take your baseline</a>
    </div>
    <div class="card" style="padding:28px">
      <b class="bone" style="font-family:var(--font-display);font-size:20px">A private check-in</b>
      <p class="small" style="margin:10px 0 18px">Two quiet minutes, just for you. Yours alone. It points to a next step only if you want one.</p>
      <a class="btn btn-secondary" href="veterans-checkin.html">Take the check-in</a>
    </div>
  </div>
</section>

<section class="vet-ed" id="credential">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">Earned, never given</div>
    <h2>The certificate costs effort. That is the point.</h2>
    <p>Coming Home Present: identity checked, hours logged, a final passed. Peers respect it because it cannot be bought. All eight written sessions are live; films are in production. Today, the flagship course, The 7 Secrets of Effective Fathers, is already yours, free.</p>
  </div>
  <div class="row wrap" style="gap:12px;margin-top:6px">
    <a class="btn btn-secondary btn-sm" href="course-coming-home-present.html">Read the sessions</a>
    <a class="btn btn-yellow btn-sm" href="class.html">Start the free course</a>
  </div>
</section>

<section class="vet-ed vet-ed-noline" id="support">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">Support, on your terms</div>
    <p>You know the resources; nobody here needs a lecture. When you want one: <b id="vetMatchName">your Vet Center</b> for a conversation, Military OneSource for the practical, and around the clock, <a class="link" href="tel:988">988, press 1</a>.</p>
  </div>
</section>

<section style="max-width:1200px;margin:0 auto;padding:24px">
  <div class="vet-brother">
    <img class="vet-brother-img" src="assets/img/photos/community-02.jpg" alt="">
    <div class="vet-brother-inner">
      <h2>You are not the first one home.</h2>
      <p>Thousands of men have walked back through that door and had to learn how to be a father all over again. You are joining their ranks, not starting from nothing.</p>
    </div>
  </div>
</section>

<section class="vet-quote">
  <blockquote>&ldquo;I could lead a platoon, but I could not get my own kid to talk to me. Learning that was its own kind of training.&rdquo;</blockquote>
  <div class="vet-quote-by"><img src="assets/img/photos/testimonial-01.jpg" alt=""><span>A father, three deployments</span></div>
</section>


<script src="assets/js/veterans-core.js"></script>
<script src="assets/js/veterans-hub.js"></script>
''')

# ================================================== veterans.html (public: pitch + free films)
PAGES['veterans.html'] = dict(title='Present at Home', desc='For fathers who served: train for the mission at home and leave them your voice, in your own words, theirs forever. Free forever.', active='For Veterans', mode='public', body=VET_TOP + '''
<section class="vet-hero">
  <img class="vet-hero-img" src="assets/img/photos/billboard-home.jpg" alt="">
  <div class="vet-hero-inner">
    <div class="vet-hero-eyebrow">Fathers.com &middot; For those who served</div>
    <h1>The next mission is the one at home.</h1>
    <p class="vet-hero-lead">You did the hard thing over there. Coming all the way home to your kids is its own kind of hard, and nobody hands you orders for it. Train for it in fifteen minutes a week, and leave them something no program ever gave a man: your voice, in your own words, theirs forever. Free forever for those who served.</p>
    <div class="vet-hero-actions">
      <a class="btn btn-yellow" href="#watch">Watch, free</a>
      <a class="btn btn-onimg" href="login.html?next=veterans-start.html">Join free</a>
    </div>
  </div>
</section>

<section class="vet-ed vet-ed-noline">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">The shift</div>
    <h2>They built programs for broken men. You were never broken.</h2>
    <p>You were between missions. So this is training, a record, and proof: the way you would run any mission that matters.</p>
  </div>
</section>

<section class="vet-ed" id="archive">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">The Legacy Archive</div>
    <h2>Leave them your voice.</h2>
    <p>Guided prompts, recorded in your own words: why you serve, the hard days, the things you want them to know at sixteen. Plenty of good programs help a man read a book to his kids across the miles. A book ends. Your voice, your words, your story: that stays, theirs forever, no matter what.</p>
  </div>
  <div class="row wrap" style="gap:12px;margin-top:6px">
    <a class="btn btn-yellow" href="login.html?next=voice.html">Join free, record tonight</a>
    <a class="link" href="voice.html" style="align-self:center">Already in? Open the Archive &rarr;</a>
  </div>
</section>

<section class="vet-ed vet-ed-noline" id="watch">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">Watch, free</div>
    <h2>Three films. Start with the one that hits home.</h2>
    <p>Short, honest lessons from fathers who came home and had to learn this. Watch all three, no account needed.</p>
  </div>
  <div class="vet-films">
    <button class="vet-film" data-key="reconnecting" data-title="When your kid feels like a stranger">
      <div class="vet-film-thumb"><img src="assets/img/photos/hero-01.jpg" alt=""><span class="vet-film-play"></span><span class="vet-film-dur">Watch</span></div>
      <div class="vet-film-meta"><h3>When your kid feels like a stranger</h3><p>Rebuilding closeness after time away</p></div>
    </button>
    <button class="vet-film" data-key="emotion" data-title="Saying what you feel">
      <div class="vet-film-thumb"><img src="assets/img/photos/hero-03.jpg" alt=""><span class="vet-film-play"></span><span class="vet-film-dur">Watch</span></div>
      <div class="vet-film-meta"><h3>Saying what you feel</h3><p>Breaking through the numbness, out loud</p></div>
    </button>
    <button class="vet-film" data-key="temper" data-title="Staying steady, and the way back">
      <div class="vet-film-thumb"><img src="assets/img/photos/hero-02.jpg" alt=""><span class="vet-film-play"></span><span class="vet-film-dur">Watch</span></div>
      <div class="vet-film-meta"><h3>Staying steady, and the way back</h3><p>Anger, the pause, and the repair</p></div>
    </button>
  </div>
  <div class="vet-lock">
    <div>
      <div class="eyebrow brass" style="margin-bottom:8px">The rest of the field guide</div>
      <b class="bone" style="font-size:18px">All three films are right here, free.</b>
      <p class="small" style="margin-top:6px">Join free for the written field notes, your plan, and the Legacy Archive, and to get each new film the day it lands. No cost, ever, for those who served.</p>
    </div>
    <a class="btn btn-yellow" href="login.html?next=veterans-start.html">Join free</a>
  </div>
  <p class="fine" style="margin-top:18px">Already a member? <a class="link" href="veterans-hub.html">Go to your hub &rarr;</a></p>
</section>

<section class="vet-ed">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">What you get when you join</div>
    <h2>Everything a man needs to come all the way home.</h2>
    <p>Fifteen minutes gets you moving: a two-minute private check-in, your first film, and sixty seconds recorded in your own voice for your kids. Then all of this, free forever.</p>
  </div>
  <div class="grid-4" style="gap:28px">
    <div><b class="bone" style="font-size:16px">The full field guide</b><p class="small" style="margin-top:8px">Every film and read on what gets hard when you walk back through the door.</p></div>
    <div><b class="bone" style="font-size:16px">The Legacy Archive</b><p class="small" style="margin-top:8px">Guided prompts, recorded in your voice, titled and kept for your kids: bedtime, milestones, the hard days, your story.</p></div>
    <div><b class="bone" style="font-size:16px">Support matched to you</b><p class="small" style="margin-top:8px">The one free service built for your situation, with the number and what to expect.</p></div>
    <div><b class="bone" style="font-size:16px">A private check-in</b><p class="small" style="margin-top:8px">Two minutes, just for you. Yours alone. It points to a next step only if you want one.</p></div>
  </div>
</section>

<section class="vet-ed" id="routine">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">Still serving? The Return Routine</div>
    <h2>If the next call-up is already on the calendar.</h2>
    <p>Guard, reserve, or active: some fathers come home again and again. If that is you, this routine is yours. The temptation is to keep a little distance so the next goodbye hurts less. Your kids cannot afford that math. Get close anyway. This is the routine that makes it possible.</p>
  </div>
  <div class="grid-3" style="margin-top:26px">
    <div class="card" style="padding:26px"><div class="eyebrow" style="margin-bottom:10px">BEFORE YOU GO</div><p class="small" style="color:var(--ash)">Record three things in the Legacy Archive: why you go, what you promise, and one to play when they miss you. Brief each kid in one sentence they can repeat. Ten minutes, total. <a class="link" href="voice.html">Record now &rarr;</a></p></div>
    <div class="card" style="padding:26px"><div class="eyebrow" style="margin-bottom:10px">WHILE YOU ARE AWAY</div><p class="small" style="color:var(--ash)">One voice note beats zero phone calls. Away-night prompts are ready for when you have two minutes and no words. She is holding the line at home; ask her for one thing you can own from a distance. <a class="link" href="voice.html">The prompts &rarr;</a></p></div>
    <div class="card" style="padding:26px"><div class="eyebrow" style="margin-bottom:10px">THE FIRST 72 HOURS HOME</div><p class="small" style="color:var(--ash)">Re-entry is a handoff, not a takeover. Take the private check-in, protect one evening at the table, and give each kid ten minutes alone with you. Expect the little ones to test you on day two. That is attachment, not disrespect. <a class="link" href="veterans-checkin.html">The check-in &rarr;</a></p></div>
  </div>
  <p class="fine" style="margin-top:18px">Between returns, your plan keeps one small move in front of you. And when the next call comes, the archive means your voice stays home even when you cannot.</p>
</section>

<section class="vet-ed">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">The certificate track</div>
    <h2>Coming Home Present. Earned, never given.</h2>
    <p>A verified certificate built for men who serve and return: identity checked, hours logged, a final passed. Earned the hard way on purpose. That is the kind of proof men respect, because it cannot be bought. The full written sessions are live now; films are in production. Today, the flagship course, The 7 Secrets of Effective Fathers, is already free to every member.</p>
  </div>
  <p style="margin-top:4px"><a class="btn btn-secondary btn-sm" href="course-coming-home-present.html">Read the sessions</a></p>
</section>

<section class="vet-ed">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">For units and programs</div>
    <h2>Bringing your whole unit?</h2>
    <p>One join link enrolls every man under your cohort: the Keystone Profile, the free flagship course, the ninety-day plan, and the Legacy Voice Archive, with the veteran certificate track as it releases. Leadership sees cohort movement, never a man&rsquo;s private answers. <a class="link" href="organizations.html">For Organizations &rarr;</a></p>
  </div>
</section>

<section class="vet-ed vet-ed-noline">
  <div class="vet-ed-head" style="text-align:center">
    <div class="vet-ed-eyebrow">Know a man who served?</div>
    <p>Send him this page. It costs him nothing, and his kids keep his voice forever.</p>
    <p style="margin-top:14px"><button class="btn btn-secondary btn-sm" id="vetShare">Copy the link</button> <span class="fine" id="vetShareMsg" style="margin-left:10px"></span></p>
  </div>
</section>
<script>
(function(){
  var b=document.getElementById('vetShare'); if(!b) return;
  b.addEventListener('click', function(){
    var url=location.origin+'/veterans.html';
    (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(function(){
      document.getElementById('vetShareMsg').textContent='Copied. Send it to him.';
    }, function(){ document.getElementById('vetShareMsg').textContent=url; });
  });
})();
</script>

<p class="fine" style="text-align:center;color:var(--ash);padding:26px 0 8px">Around the clock, if you ever want it: <a class="link" href="tel:988">988, press 1</a>.</p>

<div id="vetVideoModal" class="vet-vmodal" hidden>
  <div class="vet-vmodal-backdrop" data-vclose></div>
  <div class="vet-vmodal-inner">
    <button class="vet-vmodal-x" data-vclose aria-label="Close">&times;</button>
    <div id="vetVideoStage"></div>
    <div class="vet-vmodal-cap"><b id="vetVideoTitle"></b><a class="btn btn-yellow btn-sm" href="login.html?next=veterans-start.html">Join free for the rest</a></div>
  </div>
</div>
<script src="assets/js/veterans-core.js"></script>
<script src="assets/js/veterans-video.js"></script>
''')

# ================================================== veterans-start.html (identify, after joining)
PAGES['veterans-start.html'] = dict(title='Set up your hub', desc='Tell us where you are so we can point you to what fits.', active='For Veterans', mode='app', body=VET_TOP + '''
<section class="vet-ed vet-ed-noline" style="padding-top:56px;max-width:720px">
  <div class="vet-ed-head">
    <div class="vet-ed-eyebrow">Welcome in</div>
    <h2>Let us set up your hub.</h2>
    <p>Two quick taps so we can point you to what fits. This is saved to your account.</p>
  </div>
  <div id="vetStartLoading" class="ash" style="padding:20px 0">One moment&hellip;</div>
  <div id="vetOnboard" hidden>
    <div class="vet-step" data-step="1">
      <button class="vet-opt" data-ctx="active"><span>I am serving now, active, Guard, or Reserve</span></button>
      <button class="vet-opt" data-ctx="veteran"><span>I am a veteran</span></button>
      <button class="vet-opt" data-ctx="family"><span>I am a military family member</span></button>
    </div>
    <div class="vet-step" data-step="2" hidden>
      <p class="lead" style="margin-bottom:26px">A little context. Optional, and it sharpens the match. Skip any time.</p>
      <div class="vet-field" data-combat>
        <div class="eyebrow">DID YOU SERVE IN A COMBAT ZONE?</div>
        <div class="row" style="gap:10px"><button class="chip" data-val="yes" aria-pressed="false">Yes</button><button class="chip" data-val="no" aria-pressed="false">No</button></div>
      </div>
      <div class="vet-field" data-sep-block hidden>
        <div class="eyebrow">HOW LONG SINCE YOU SEPARATED?</div>
        <div class="row" style="gap:10px" data-sep><button class="chip" data-val="recent" aria-pressed="false">Within the last year</button><button class="chip" data-val="past" aria-pressed="false">More than a year ago</button></div>
      </div>
      <div class="vet-field" data-kids>
        <div class="eyebrow">YOUR KIDS&rsquo; AGES (TAP ANY)</div>
        <div class="row wrap" style="gap:10px"><button class="chip" data-band="0-5" aria-pressed="false">0 to 5</button><button class="chip" data-band="6-12" aria-pressed="false">6 to 12</button><button class="chip" data-band="13-18" aria-pressed="false">13 to 18</button><button class="chip" data-band="grown" aria-pressed="false">Grown</button></div>
      </div>
      <div class="row wrap" style="gap:14px;margin-top:12px">
        <button class="btn btn-primary" id="vetContinue">Go to my hub</button>
        <a class="link ash" href="#" data-skip style="align-self:center">Skip</a>
      </div>
    </div>
  </div>
</section>
<script src="assets/js/veterans-core.js"></script>
<script src="assets/js/veterans-start.js"></script>
''')

PAGES['voice.html'] = dict(title='The Legacy Archive', desc='Leave them your voice. Sixty seconds tonight outlives almost everything else you will make this week.', active='For Veterans', mode='app', body=VET_TOP + '''
<section class="vx">
  <div class="vx-col">
    <h1>Leave them your voice.</h1>
    <p class="vx-sub">Sixty seconds tonight outlives almost everything else you will make this week.</p>

    <div class="vx-card" id="voiceApp">
      <div class="vx-lbl">TONIGHT&rsquo;S PROMPT</div>
      <div class="vx-prompt" id="vPrompt">Say good night the way you always do.</div>
      <p class="vx-links"><button class="link brass" id="vSwap" type="button">Different prompt</button></p>

      <div class="row" style="align-items:center;gap:14px">
        <button class="vrec" id="vBtn" type="button" aria-label="Record"><span class="vrec-dot"></span><span class="vrec-lbl" id="vBtnLbl">Record</span></button>
        <div class="voice-timer" id="voiceTimer">&nbsp;</div>
      </div>
      <p class="fine vx-hint">Tap to record. Tap Stop when you are done.</p>
      <p class="fine" id="voiceMsg" style="margin-top:6px;min-height:16px"></p>

      <div id="vDone" hidden style="margin-top:14px;border-top:1px solid #2f3336;padding-top:16px">
        <p class="small" id="vDoneTxt" style="margin-bottom:12px;color:#e7e9ea;font-size:15px"></p>
        <audio id="voicePreview" controls style="width:100%;margin:0 0 14px;display:block"></audio>
        <div class="row" style="gap:10px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" id="vUndo" type="button">Undo</button>
          <button class="btn btn-yellow btn-sm" id="vAgain" type="button">Record another</button>
          <button class="btn btn-primary btn-sm" id="vShareNow" type="button" hidden>Share it</button>
          <a class="btn btn-primary btn-sm" id="vKeep" href="login.html?next=voice.html" hidden>Join free to keep it</a>
        </div>
      </div>

      <p class="fine" style="margin-top:16px">Encrypted &middot; private to you &middot; never shared &middot; delete anytime</p>
      <p class="fine" id="vGuest" hidden>Record first. Keeping it takes a free sign-in after, and we will hold this one for you.</p>
    </div>

    <details id="vAllWrap" style="margin-top:18px">
      <summary>The full prompt library</summary>
      <div class="voice-prompts" style="margin-top:14px">
        <div id="promptPicker"></div>
        <p class="fine" id="promptCurrent" hidden style="margin-top:10px"></p>
      </div>
    </details>

    <div id="voiceList"></div>
    <p class="fine" style="margin-top:26px;text-align:center">Kids replay these on their schedule. That is the whole point.</p>
  </div>
</section>
<script src="assets/js/veterans-core.js"></script>
<script src="assets/js/voice.js"></script>
''')

PAGES['share.html'] = dict(title='A message for you', desc='A private voice message, recorded on Fathers.com.', active='For Veterans', mode='public', body=VET_TOP + '''
<section class="vx" style="min-height:60vh">
  <div class="vx-col" style="text-align:center">
    <div class="vx-lbl" style="margin-top:10px">THE LEGACY ARCHIVE</div>
    <h1 id="shTitle" style="margin-bottom:6px">Loading&hellip;</h1>
    <p class="vx-sub">A father recorded this for you.</p>
    <div class="vx-card">
      <audio id="shAudio" controls hidden style="width:100%"></audio>
      <p class="fine" id="shMsg" style="margin-top:12px;min-height:16px"></p>
    </div>
    <p class="fine" style="margin-top:22px">Private link. No account needed, and nothing is collected from you.</p>
    <div style="margin-top:36px;border-top:1px solid #2f3336;padding-top:28px">
      <p class="vx-sub" style="margin-bottom:16px">This came from the Legacy Archive on Fathers.com, where a father banks his voice for his kids, forever. Free, forever, for those who served.</p>
      <a class="btn btn-yellow" id="shStart" href="veterans.html?src=share">Start your own archive</a>
    </div>
  </div>
</section>
<script src="assets/js/share.js"></script>
''')


PAGES['course.html'] = dict(title='Your Certificate', desc='Watch the lessons, pass each Checkpoint, answer the final Q&A, and submit for approval.', active='Certificates', mode='app', auth=True, body='''
<section class="cw-wrap" id="cw-root">
  <div class="cw-head">
    <a class="link ash" href="certificates.html" style="display:inline-block;margin-bottom:16px">&larr; All certificates</a>
    <div class="eyebrow brass">THE CERTIFICATE OF COMPLETION</div>
    <h1 class="d-36" id="cw-title" style="margin-top:8px">Your certificate</h1>
  </div>
  <div id="cw-note"></div>
  <div id="cw-stage"><p class="ash">Loading\u2026</p></div>
</section>
<script src="assets/js/coursework.js"></script>
''')

# ================================================== find-a-program.html
PAGES['find-a-program.html'] = dict(title='Find a Program', desc='The program directory publishes with the first rated cohort on the Keystone Standard.', active='', mode='public', body='''
<section class="tight" style="padding-top:72px"><div class="container" style="max-width:760px;text-align:center">
  <div class="eyebrow" style="margin-bottom:16px">FIND A PROGRAM</div>
  <h1 class="d-36" style="margin-bottom:14px">The directory opens with the first rated cohort.</h1>
  <p style="color:var(--ash);max-width:56ch;margin:0 auto 34px">Programs are being measured on the Keystone Standard now: the same instrument, the same norms, the same report. When the first cohort's ratings publish, this page becomes the place a father finds a program that provably works. Until then, we will not point you at a list we cannot stand behind.</p>
  <div class="grid-2" style="gap:22px;text-align:left">
    <div class="card" style="padding:28px">
      <div class="eyebrow" style="margin-bottom:12px">FOR A FATHER, TODAY</div>
      <p class="small" style="color:var(--ash);margin-bottom:18px">You do not need a directory to start. The Profile is free, takes about twenty minutes, and your ninety-day plan builds itself from your answers.</p>
      <a class="btn btn-primary" href="profile.html">Start your Profile</a>
    </div>
    <div class="card" style="padding:28px">
      <div class="eyebrow" style="margin-bottom:12px">RUN A PROGRAM?</div>
      <p class="small" style="color:var(--ash);margin-bottom:18px">Get on the Standard now and in line for the first rated cohort. Twenty minutes, your funder&rsquo;s report, live.</p>
      <a class="btn btn-secondary" href="organizations.html#walkthrough">Get on the Standard</a>
    </div>
  </div>
  <p class="fine" style="margin-top:28px">Want to know the moment the directory opens?</p>
  <form class="row" style="justify-content:center;margin-top:12px" data-lead="directory-waitlist" data-done="You are on the list. You will hear when the first ratings publish.">
    <input class="input" name="email" type="email" required placeholder="Email address" style="max-width:280px">
    <button class="btn btn-secondary btn-sm">Notify me</button>
  </form>
</div></section>
''')

PAGES['organizations.html'] = dict(title='Become a Certified Organization', desc='NCF certifies organizations and facilitators against a published standard: credentialed facilitators, baseline and exit measurement, honest reporting. Free for your men, always.', active='For Organizations', mode='public', body='''
<section class="tight" style="padding:52px 0 44px"><div class="container split" style="align-items:center;gap:56px">
  <div>
    <div class="eyebrow" style="margin-bottom:14px">CERTIFICATION FOR ORGANIZATIONS</div>
    <h1 class="d-48" style="margin-bottom:16px">Become a Certified Organization.</h1>
    <p style="color:var(--ash);max-width:52ch;margin-bottom:24px">Every program says it works. Certification is how you prove it: credentialed facilitators, baseline and exit measurement on one instrument, and the report your funder already asks for. Your men pay nothing. Your organization carries the standard.</p>
    <div class="row wrap" style="gap:12px;margin-bottom:22px">
      <a class="btn btn-primary" href="efficacy-report.html?demo=1">See a sample report</a>
      <a class="btn btn-secondary" href="#walkthrough">Request a walkthrough</a>
    </div>
    <p class="fine mono" style="color:var(--ash);letter-spacing:.02em">CHANGE MEASURED PER MAN, BASELINE TO EXIT &nbsp;&middot;&nbsp; NCF, SINCE 1990 &nbsp;&middot;&nbsp; VERIFY A SERIAL IN 10 SECONDS</p>
  </div>
  <div class="artifact">
    <div class="artifact-tab">WHAT YOUR FUNDER RECEIVES</div>
    <div class="artifact-doc">
      <div class="row between" style="align-items:baseline;margin-bottom:2px"><b style="font-size:15px">Keystone Efficacy Report</b><span class="chip" style="font-size:10px">SAMPLE</span></div>
      <p class="fine" style="color:var(--ash);margin-bottom:14px">Sample Fatherhood Program &middot; one page per cohort</p>
      <table class="artifact-table">
        <tr><th>Cohort</th><th>Fathers</th><th>Completed</th><th>Baseline</th><th>Latest</th><th>Movement</th></tr>
        <tr><td>Spring cohort A</td><td>24</td><td>19</td><td>58.4</td><td>71.2</td><td class="mv">+12.8</td></tr>
        <tr><td>Spring cohort B</td><td>18</td><td>13</td><td>61.0</td><td>69.5</td><td class="mv">+8.5</td></tr>
        <tr><td>Intake, no program</td><td>31</td><td>0</td><td>55.9</td><td>&mdash;</td><td>baseline only</td></tr>
      </table>
      <p class="fine" style="color:var(--ash);margin-top:12px">Individual fathers are never shown. Cohort aggregates only. <a class="link" href="efficacy-report.html?demo=1">Open the full sample &rarr;</a></p>
    </div>
  </div>
</div></section>

<section class="tight" style="padding:36px 0;background:var(--coal)"><div class="container">
  <div class="eyebrow" style="margin-bottom:12px">FIND YOUR FIT</div>
  <h2 class="d-28" style="margin-bottom:18px">Every kind of program lands here. Start where you live.</h2>
  <div class="grid-3">
    <a class="fit-card" href="#residential"><b>Residential &amp; recovery programs</b><span>Cohorts that fit your episode. Baseline at intake, a certificate presented before discharge.</span><i>&rarr;</i></a>
    <a class="fit-card" href="#reentry"><b>Reentry &amp; alternative sentencing</b><span>Baseline at intake, movement by release. The floor is never nothing.</span><i>&rarr;</i></a>
    <a class="fit-card" href="#courts"><b>Courts &amp; probation</b><span>Order the course by name. Verify a serial in ten seconds.</span><i>&rarr;</i></a>
    <a class="fit-card" href="#programs"><b>Fatherhood programs</b><span>Keep the curriculum you trust. We make it provable.</span><i>&rarr;</i></a>
    <a class="fit-card" href="groups.html"><b>Community groups &amp; circles</b><span>Small groups of men, measured and moving together.</span><i>&rarr;</i></a>
    <a class="fit-card" href="employers.html"><b>Employers</b><span>A benefit men actually use, with proof it worked.</span><i>&rarr;</i></a>
  </div>
</div></section>

<section class="tight" id="programs"><div class="container split" style="gap:48px">
  <div>
    <div class="eyebrow" style="margin-bottom:12px">FATHERHOOD PROGRAMS</div>
    <h2 class="d-28" style="margin-bottom:12px">Keep the curriculum you trust. We make it provable.</h2>
    <p class="small" style="color:var(--ash);max-width:56ch">Your program stays exactly as you run it. We add the measurement spine underneath: every father baselines at intake through your join link, retakes at exit, and your Efficacy Report writes itself, one page per cohort, reported as movement per man, baseline to exit, aggregated per cohort. Concierge-first means we run your first cohort with you: codes minted, men enrolled, the report in your funder&rsquo;s hands.</p>
  </div>
  <div class="card" style="padding:26px 28px;align-self:start">
    <p class="small" style="margin-bottom:16px"><b>Twenty minutes gets you live.</b> Your program, your funder&rsquo;s report, on the call.</p>
    <div class="row wrap" style="gap:10px"><a class="btn btn-primary btn-sm" href="#walkthrough">Request a walkthrough</a><a class="btn btn-secondary btn-sm" href="mailto:Team@Fathers.com?subject=Our%20fatherhood%20program%20on%20the%20Standard">Write us</a></div>
  </div>
</div></section>

<section class="tight" id="residential"><div class="container split" style="gap:48px">
  <div>
    <div class="eyebrow" style="margin-bottom:12px">RESIDENTIAL &amp; RECOVERY PROGRAMS</div>
    <h2 class="d-28" style="margin-bottom:12px">Built to fit a residential episode.</h2>
    <p class="small" style="color:var(--ash);max-width:56ch">Baseline in the first week. Weekly cohort sessions led by your own staff as Certified Facilitators. Completion and the certificate ceremony before discharge, and the man&rsquo;s account is his: his plan and his record follow him home, because the work does not end when the placement does. Your program never appears on his public record; you see cohort movement, never a man&rsquo;s private answers, and no clinical information is ever stored here.</p>
  </div>
  <div class="card" style="padding:26px 28px;align-self:start">
    <p class="small" style="margin-bottom:16px"><b>Fits inside a 120-day placement</b> with margin, or a shorter stay with aftercare handoff.</p>
    <div class="row wrap" style="gap:10px"><a class="btn btn-primary btn-sm" href="#walkthrough">Request a walkthrough</a><a class="btn btn-secondary btn-sm" href="mailto:Team@Fathers.com?subject=Residential%20program%20certification">Write us</a></div>
  </div>
</div></section>

<section class="tight" id="certification"><div class="container">
  <div class="eyebrow" style="margin-bottom:12px">WHAT CERTIFICATION MEANS</div>
  <h2 class="d-28" style="margin-bottom:18px">Two credentials carry the standard. Both are published, renewable, and revocable.</h2>
  <div class="grid-2" style="gap:24px">
    <div class="card" style="padding:28px">
      <div class="eyebrow brass" style="margin-bottom:12px">CERTIFIED ORGANIZATION</div>
      <p class="small" style="color:var(--ash);margin-bottom:14px">A site that meets the published standard: Certified Facilitators on staff, fidelity to the course structure, baseline and exit measurement on every cohort, honest reporting. Annual. Listed in the public registry. The Efficacy Report is a benefit of certification, not a separate product.</p>
      <p class="fine mono">$1,500 per site, per year &middot; unlimited cohorts &middot; launch pricing pends partner interviews</p>
    </div>
    <div class="card" style="padding:28px">
      <div class="eyebrow brass" style="margin-bottom:12px">CERTIFIED FACILITATOR</div>
      <p class="small" style="color:var(--ash);margin-bottom:14px">A person credentialed to lead men through the courses: facilitator training, an exam, and a supervised first cohort, with annual renewal. The credential belongs to the person and travels with them. Listed in the public registry with current status.</p>
      <p class="fine mono">$349 initial &middot; $99 annual renewal &middot; launch pricing pends partner interviews</p>
      <p style="margin-top:14px"><a class="link brass" href="facilitators.html">Become a Certified Facilitator &rarr;</a></p>
    </div>
  </div>
  <p class="fine" style="margin-top:16px;color:var(--ash)">The men pay nothing, ever. Certification criteria are published in full, and organizations running non-NCF curricula can certify against the same measurement standard. The standard is the spine, not the syllabus.</p>
</div></section>

<section class="tight" id="reentry"><div class="container split" style="gap:48px">
  <div>
    <div class="eyebrow" style="margin-bottom:12px">REENTRY &amp; ALTERNATIVE SENTENCING</div>
    <h2 class="d-28" style="margin-bottom:12px">Baseline at intake. Movement by release. The floor is never nothing.</h2>
    <p class="small" style="color:var(--ash);max-width:56ch">You already intake men; start measuring the day they arrive, program or no program. Cohorts persist across facilities and time, so a man&rsquo;s movement follows him. If your agency runs an independent evaluation, we supply de-identified cohort data on request.</p>
  </div>
  <div class="card" style="padding:26px 28px;align-self:start">
    <p class="small" style="margin-bottom:16px"><b>Runs inside your intake.</b> No curriculum required to start.</p>
    <div class="row wrap" style="gap:10px"><a class="btn btn-primary btn-sm" href="#walkthrough">Request a walkthrough</a><a class="btn btn-secondary btn-sm" href="mailto:Team@Fathers.com?subject=Reentry%20measurement%20on%20the%20Standard">Write us</a></div>
  </div>
</div></section>

<section style="background:#0B0B0B;color:#F5F1E8;padding:64px 0"><div class="container split" style="gap:56px">
  <div>
    <div class="eyebrow" style="color:#C9A227;margin-bottom:14px">THE SHIFT</div>
    <h2 class="d-36" style="color:#F5F1E8">Attendance was the old currency. Movement is the new one.</h2>
  </div>
  <div class="grid-2" style="gap:32px">
    <div><p class="fine mono" style="color:#8A8A8A;margin-bottom:8px">THE OLD WAY</p><p class="small" style="color:#C7C2B8">Sign-in sheets, satisfaction surveys, and a renewal that lives or dies on a story. Every program says it works. None can show it.</p></div>
    <div><p class="fine mono" style="color:#C9A227;margin-bottom:8px">THE STANDARD</p><p class="small" style="color:#F5F1E8">Baseline and exit on a research-based instrument. Movement per man, baseline to exit, aggregated per cohort. A renewal that is a number.</p></div>
  </div>
</div></section>

<section class="tight" style="padding:56px 0 20px"><div class="container" style="max-width:900px;text-align:center">
  <h2 class="d-36">Every father measured. Every program provable. Every credential trusted on sight.</h2>
</div></section>

<section class="tight"><div class="container">
  <div class="grid-3" style="gap:24px">
    <div class="card" style="padding:26px 28px"><p class="fine mono" style="color:var(--ember-ink);margin-bottom:10px">01 &middot; MEASURE</p><h3 style="margin-bottom:8px">One join link tags every man.</h3><p class="small" style="color:var(--ash)">The Keystone Profile at intake: the full instrument, one sitting. The canonical spec lives on the Research page. Four dimensions on every man, zero program required.</p></div>
    <div class="card" style="padding:26px 28px"><p class="fine mono" style="color:var(--ember-ink);margin-bottom:10px">02 &middot; TRAIN</p><h3 style="margin-bottom:8px">Keep the program you trust.</h3><p class="small" style="color:var(--ash)">We make it provable. Or deploy ours: the full course slate is live today, free to every man, with films arriving as they finish. Your staff lead it as Certified Facilitators.</p></div>
    <div class="card" style="padding:26px 28px"><p class="fine mono" style="color:var(--ember-ink);margin-bottom:10px">03 &middot; PROVE</p><h3 style="margin-bottom:8px">The report and the credential.</h3><p class="small" style="color:var(--ash)">The Efficacy Report, one page per cohort. Certificates of Completion presented by your facilitators, serialed, and verified at fathers.com/verify in ten seconds.</p></div>
  </div>
</div></section>

<section class="band tight"><div class="container split">
  <div>
    <div class="eyebrow brass" style="margin-bottom:14px">AVAILABLE NOW</div>
    <h2 class="d-36" style="font-size:32px">The Efficacy Report.</h2>
    <p style="color:var(--ash);margin:16px 0 18px;max-width:52ch">One page per cohort: how many fathers started, how many finished, where they began on the four dimensions, where they ended, and the movement in between, per man and per cohort. Individual fathers are never shown. Aggregates only.</p>
    <p style="color:var(--ash);margin:0 0 26px;max-width:52ch">This is the document that turns a grant renewal from a story into a number.</p>
    <div class="row wrap"><a class="btn btn-primary" href="efficacy-report.html?demo=1">See a sample report</a><a class="btn btn-secondary" href="#walkthrough">Request yours</a></div>
  </div>
  <div class="card" style="padding:32px">
    <div class="eyebrow" style="margin-bottom:16px">WHAT A FUNDER SEES</div>
    <div class="stack-16">
      <div class="check"><span class="checkmark">&check;</span><span>Baseline and exit scores on the four Keystone dimensions</span></div>
      <div class="check"><span class="checkmark">&check;</span><span>Cohort movement, per man, baseline to exit</span></div>
      <div class="check"><span class="checkmark">&check;</span><span>Completion rates that hold up to an auditor</span></div>
      
    </div>
  </div>
</div></section>

<section class="band"><div class="container" style="max-width:860px">
  <h2 class="d-28" style="margin-bottom:8px">What we measure and what we do not.</h2>
  <p style="color:var(--ash);margin:0 0 12px;max-width:62ch">We measure change on four fathering practice dimensions, and completion. We do not measure recidivism, payment compliance, treatment retention, or any clinical outcome, and we do not claim a relationship between our program and those outcomes.</p>
  <p style="color:var(--ash);max-width:62ch">If your agency runs an independent evaluation, we will supply de-identified cohort data on request.</p>
</div></section>

<section id="courts" class="band tight"><div class="container split">
  <div>
    <div class="eyebrow" style="margin-bottom:14px">FOR COURTS AND PROBATION</div>
    <h2 class="d-28" style="margin-bottom:8px">Order the class by name. Verify in ten seconds.</h2>
    <p style="color:var(--ash);max-width:52ch">Some courts and agencies accept Fathering Fundamentals as a supplemental fathering education component; acceptance is at their discretion, so confirm before referring. What travels with it: identity confirmed at enrollment, hours logged not claimed, a final at eighty percent. Completion is confirmed at fathers.com/verify with the serial on the Certificate of Completion. No account, no phone call, no paperwork chase. Coming Home Present and Steady Under Pressure, built for referral, have every written session live; films are in production, and your caseload can start now. Steady Under Pressure is a fathering skills course, not anger management, batterer intervention, or a substitute for any court-mandated treatment program, and should not be ordered in their place.</p>
  </div>
  <div class="card" style="padding:32px">
    <div class="eyebrow" style="margin-bottom:16px">FOR THE MAN YOU REFER</div>
    <p class="small" style="color:var(--ash)">He starts free with the Keystone Profile, trains the course you name, and leaves with a document any reviewer can verify, instead of a checkbox nobody can check. He pays nothing at any step.</p>
  </div>
</div></section>

<section class="band tight"><div class="container">
  <h2 class="d-28" style="margin-bottom:8px">No program yet? The floor is never nothing.</h2>
  <p style="color:var(--ash);margin:0 0 32px;max-width:60ch">You already intake men. Start measuring today and switch the rest on when you are ready.</p>
  <div class="grid-3">
    <div class="card" style="padding:28px"><div class="eyebrow" style="margin-bottom:12px">STEP ONE</div><h3 style="margin-bottom:8px">Measure at the door.</h3><p class="small" style="color:var(--ash)">Run the Keystone Profile at intake. A research-based engagement baseline on every man, zero program required.</p></div>
    <div class="card" style="padding:28px"><div class="eyebrow" style="margin-bottom:12px">STEP TWO</div><h3 style="margin-bottom:8px">Route to what works.</h3><p class="small" style="color:var(--ash)">Each profile points to the rated program that fits him. We become your measurement and routing layer.</p></div>
    <div class="card" style="padding:28px"><div class="eyebrow" style="margin-bottom:12px">STEP THREE</div><h3 style="margin-bottom:8px">Deploy ours in a day.</h3><p class="small" style="color:var(--ash)">The assessment, four courses (presence, steadiness, coming home, one team), the ninety-day plan, the Certificate of Completion. Switched on, not built.</p></div>
  </div>
</div></section>

<section><div class="container split">
  <div>
    <div class="eyebrow" style="margin-bottom:14px">DEPLOY AT SCALE</div>
    <h2 class="d-36" style="font-size:32px">One join link. Every man tagged to your cohort.</h2>
    <p style="color:var(--ash);margin:16px 0 18px;max-width:52ch">A facility, a caseload, a membership: share one link and every man who enters it is assessed under your organization, program, and cohort. The report builds itself as they move. Leadership sees cohort movement, never a man&rsquo;s private answers.</p>
    <p style="color:var(--ash);max-width:52ch">Concierge-first: we run your first cohort with you. Codes minted, facilitators credentialed, men enrolled, the report in your funder&rsquo;s hands. What ships today is real: the Keystone Profile, the free flagship course, and the ninety-day plan.</p>
  </div>
  <div class="card" style="padding:32px" id="walkthrough">
    <div class="eyebrow" style="margin-bottom:16px">REQUEST A WALKTHROUGH</div>
    <p class="small" style="color:var(--ash);margin-bottom:20px">Twenty minutes. Your program, your funder&rsquo;s report, live. We will set up your join link on the call.</p>
    <form class="stack-16" data-lead="org-inquiry" data-done="Received. We will reach out to schedule your walkthrough.">
      <input class="input" name="org" required placeholder="Organization name">
      <input class="input" name="email" type="email" required placeholder="Work email">
      <button class="btn btn-primary">Request a walkthrough</button>
    </form>
    <p class="fine" style="margin-top:14px">Already on the standard? <a class="link ash" href="efficacy-report.html">Open your Efficacy Report</a>.</p>
  </div>
</div></section>

<section style="background:#0B0B0B;color:#F5F1E8;padding:56px 0"><div class="container" style="text-align:center">
  <div class="eyebrow" style="color:#C9A227;margin-bottom:14px">THE SPINE</div>
  <h2 class="d-36" style="color:#F5F1E8;margin-bottom:22px">Measure. Train. Prove.</h2>
  <div class="row wrap" style="gap:12px;justify-content:center">
    <a class="btn btn-primary" href="efficacy-report.html?demo=1">See a sample report</a>
    <a class="btn btn-secondary" style="color:#F5F1E8;border-color:rgba(255,255,255,.4)" href="#walkthrough">Get on the Standard</a>
  </div>
  <p class="fine" style="color:#8A8A8A;margin-top:22px">Also built for: <a class="link" href="groups.html" style="color:#C7C2B8">Groups &amp; Circles</a> &nbsp;&middot;&nbsp; <a class="link" href="facilitators.html" style="color:#C7C2B8">Certified Facilitators</a> &nbsp;&middot;&nbsp; <a class="link" href="employers.html" style="color:#C7C2B8">Employers</a></p>
</div></section>

<section class="band"><div class="container" style="max-width:860px">
  <div class="eyebrow" style="margin-bottom:12px">THE EDUCATION LINE</div>
  <h2 class="d-28" style="margin-bottom:10px">Training, with a hard boundary.</h2>
  <p style="color:var(--ash);max-width:62ch;margin-bottom:12px">Everything here is education. Facilitators lead skills and cohorts; they do not diagnose, counsel, or treat, and nothing on this platform is a substitute for professional care. Your organization names its referral contact before its first cohort runs.</p>
  <p style="color:var(--ash);max-width:62ch;margin-bottom:12px">The written protocol every Certified Facilitator carries: watch behavior, not labels; make the warm handoff to your named contact the same day; tell your organization lead the same day; never carry it alone. And one rule above the rest: rebuilding trust never overrides a court order or a protective order.</p>
  <p class="fine"><a class="link" href="assets/docs/NCF-Triage-and-Referral-Protocol.pdf" download>Download the protocol (PDF)</a> &middot; It ships inside every facilitator kit.</p>
</div></section>
''')

PAGES['facilitators.html'] = dict(title='Become a Certified Facilitator', desc='The credential for the person leading men through the work: training, an exam, a supervised first cohort, annual renewal, and a public registry. It belongs to you and travels with you.', active='For Organizations', mode='public', body='''
<section class="tight" style="padding:52px 0 44px"><div class="container split" style="align-items:center;gap:56px">
  <div>
    <div class="eyebrow" style="margin-bottom:14px">CERTIFICATION FOR FACILITATORS</div>
    <h1 class="d-48" style="margin-bottom:16px">Become a Certified Facilitator.</h1>
    <p style="color:var(--ash);max-width:52ch;margin-bottom:24px">The men do the work. You carry the standard. The NCF Certified Facilitator credential says you were trained, examined, and supervised through a real cohort, and that your status is current and publicly checkable. It belongs to you, not your employer, and it travels with you.</p>
    <div class="row wrap" style="gap:12px;margin-bottom:22px">
      <a class="btn btn-primary" href="mailto:Team@Fathers.com?subject=Certified%20Facilitator%20credential">Start the conversation</a>
      <a class="btn btn-secondary" href="verify.html">Check a facilitator&rsquo;s status</a>
    </div>
    <p class="fine mono" style="color:var(--ash);letter-spacing:.02em">$349 INITIAL &nbsp;&middot;&nbsp; $99 ANNUAL RENEWAL &nbsp;&middot;&nbsp; LAUNCH PRICING PENDS PARTNER INTERVIEWS</p>
  </div>
  <div class="card" style="padding:32px">
    <div class="eyebrow" style="margin-bottom:16px">THE PATH</div>
    <div class="stack-16">
      <div class="check"><span class="checkmark">&check;</span><span><b>The facilitator course.</b> How the courses are built, how cohorts run, and where facilitation goes wrong.</span></div>
      <div class="check"><span class="checkmark">&check;</span><span><b>The exam.</b> Pass it or you are not certified. There is no attendance credential here.</span></div>
      <div class="check"><span class="checkmark">&check;</span><span><b>A supervised first cohort.</b> You lead, we review. The credential is granted when the cohort completes.</span></div>
      <div class="check"><span class="checkmark">&check;</span><span><b>Annual renewal.</b> A code of conduct, continuing standards, and a registry that shows your current status.</span></div>
    </div>
  </div>
</div></section>

<section class="band tight"><div class="container">
  <div class="eyebrow" style="margin-bottom:12px">WHO THIS IS FOR</div>
  <h2 class="d-28" style="margin-bottom:18px">The people already in the room.</h2>
  <div class="grid-3">
    <div class="card" style="padding:26px 28px"><b>Program staff</b><p class="small" style="margin-top:8px;color:var(--ash)">Case managers, counselors, program staff, and pastoral or peer-support staff inside residential, recovery, and reentry programs. Your organization certifies; you carry the credential.</p></div>
    <div class="card" style="padding:26px 28px"><b>Community and group leaders</b><p class="small" style="margin-top:8px;color:var(--ash)">Leaders and mentors who already gather men who already gather men. Certification turns a good group into a measured cohort.</p></div>
    <div class="card" style="padding:26px 28px"><b>Men who did the work</b><p class="small" style="margin-top:8px;color:var(--ash)">Completers with a Certificate of Completion who want to lead the next cohort. The best facilitators usually started in the chairs.</p></div>
  </div>
</div></section>

<section class="tight"><div class="container split" style="gap:48px">
  <div>
    <div class="eyebrow" style="margin-bottom:12px">WHY IT IS STRICT</div>
    <h2 class="d-28" style="margin-bottom:12px">A registry only means something if names can come off it.</h2>
    <p class="small" style="color:var(--ash);max-width:56ch">Most curricula in this field sell a kit and an optional webinar and call the buyer trained. We do not. Certification here is examined, supervised, renewed annually, and revocable for cause, with status published in the registry. That is more work for you and for us. It is also what lets a court, a funder, or a program director trust the title on sight.</p>
  </div>
  <div class="card" style="padding:26px 28px;align-self:start">
    <p class="small" style="margin-bottom:16px"><b>Organizations:</b> facilitator credentialing is part of site certification. Certify the org, credential the staff, run unlimited cohorts.</p>
    <a class="btn btn-secondary btn-sm" href="organizations.html#certification">See organization certification</a>
  </div>
</div></section>

<section class="band"><div class="container" style="max-width:860px">
  <div class="eyebrow" style="margin-bottom:12px">THE EDUCATION LINE</div>
  <h2 class="d-28" style="margin-bottom:10px">You lead education. Here is the boundary.</h2>
  <p style="color:var(--ash);max-width:62ch;margin-bottom:12px">You do not diagnose, counsel, or treat. You lead a steady room, a clear rhythm, and a fast warm path to the people trained for the rest. When a man is in distress: watch behavior, not labels; walk him to your organization&rsquo;s named referral contact the same day; tell your organization lead the same day; never carry it alone.</p>
  <p style="color:var(--ash);max-width:62ch;margin-bottom:12px">One rule above the rest, and it is in your exam: rebuilding trust never overrides a court order or a protective order. Where an order stands, the plan works inside it.</p>
  <p class="fine"><a class="link" href="assets/docs/NCF-Triage-and-Referral-Protocol.pdf" download>Download the protocol (PDF)</a> &middot; The full version is in your facilitator kit.</p>
</div></section>
''')

PAGES['gatherings.html'] = dict(title='Gatherings', desc='Fathers, in real life. Events that bring men, mentors, and the people who lead them into the same room.', active='Gatherings', mode='public', body='''
<header class="hero"><div class="container" style="max-width:820px">
  <div class="eyebrow" style="margin-bottom:18px">GATHERINGS</div>
  <h1 class="d-48" style="font-weight:700;letter-spacing:-.02em">Fathers, in real life.</h1>
  <p class="lead" style="margin:22px 0 8px">Where the Standard meets in person. Presence is not only trained on a screen. We gather fathers, mentors, and the people who lead them, to learn, to be sharpened, and to stand together.</p>
</div></header>

<section class="band tight"><div class="container split">
  <div>
    <h2 class="d-28">Be first to know.</h2>
    <p class="small" style="color:var(--ash);margin-top:10px;max-width:44ch">We are starting with one or two flagship gatherings. Tell us where you are and we will tell you when one is near you.</p>
  </div>
  <div>
    <form class="stack-16" data-lead="gatherings" data-done="You are on the list. We will tell you when a gathering is near you.">
      <input class="input" name="city" placeholder="City or region">
      <input class="input" name="email" type="email" required placeholder="Email address">
      <button class="btn btn-primary">Notify me</button>
    </form>
    <p class="fine" style="margin-top:12px">Want to bring a gathering to your church, base, or city? Same form. Say so when we reply.</p>
  </div>
</div></section>
''')

# ================================================== about.html
PAGES['about.html'] = dict(title='About the National Center for Fathering', desc='NCF measures men, trains them free, certifies the organizations and facilitators who lead them, and convenes the field.', active='', mode='public', body='''
<header class="hero"><div class="container" style="max-width:860px">
  <div class="eyebrow" style="margin-bottom:18px">ABOUT NCF</div>
  <h1 class="d-48" style="font-weight:700;letter-spacing:-.02em">The independent third party for fatherhood.</h1>
  <p class="lead" style="margin:22px 0 8px">The National Center for Fathering measures men, trains them at no cost, certifies the organizations and facilitators who lead them, and convenes the field. We publish one standard and hold everyone to it, including ourselves: our own courses are measured, reported, and rated the same way anyone else&rsquo;s are.</p>
</div></header>

<section class="band tight"><div class="container split">
  <div>
    <h2 class="d-36" style="font-size:32px">Built on three decades of research.</h2>
    <p style="color:var(--ash);margin:16px 0 18px;max-width:52ch">NCF was founded by Dr. Ken Canfield, whose research and books on fathering have guided a generation of men. The Keystone Father Profile grows directly out of that work and the Personal Fathering Profile research program: four dimensions, made practical.</p>
    <p style="color:var(--ash);max-width:52ch">Fathers.com is the home of that standard: the free Profile for any man, the free courses to grow it, the Certificate of Completion that proves the work, the Certified Organization and Certified Facilitator credentials that carry it, and the reporting that shows funders and agencies whether men are changing.</p>
  </div>
  <div class="card" style="padding:32px">
    <div class="eyebrow" style="margin-bottom:16px">WHAT WE DO</div>
    <div class="stack-16">
      <div class="check"><span class="checkmark">&check;</span><span><b>Measure.</b> The Keystone Profile, free for every man.</span></div>
      <div class="check"><span class="checkmark">&check;</span><span><b>Train.</b> Four courses, free to the men who take them.</span></div>
      <div class="check"><span class="checkmark">&check;</span><span><b>Certify.</b> Organizations and facilitators, against a published standard, with a public registry.</span></div>
      <div class="check"><span class="checkmark">&check;</span><span><b>Convene.</b> Gatherings that bring the field into one room.</span></div>
    </div>
  </div>
</div></section>

<section><div class="container" style="max-width:820px">
  <p class="small" style="color:var(--ash)">Fathers.com is a program of the National Center for Fathering, a 501(c)(3) nonprofit. PO Box 996, Tontitown, AR 72770. <a class="link" href="mailto:Team@Fathers.com">Team@Fathers.com</a></p>
</div></section>
''')

# ================================================== research.html
PAGES['research.html'] = dict(title='The research behind the Keystone Profile', desc='Four dimensions. A versioned instrument, reporting change within a person over time.', active='', mode='public', body='''
<header class="hero"><div class="container" style="max-width:860px">
  <div class="eyebrow" style="margin-bottom:18px">RESEARCH</div>
  <h1 class="d-48" style="font-weight:700;letter-spacing:-.02em">The instrument behind the standard.</h1>
  <p class="small" style="color:var(--ash);margin-top:14px;max-width:56ch">The instrument is versioned. Norms are published. Methods are shown. Rate us the way we rate programs.</p>
  <p class="lead" style="margin:22px 0 8px">The Keystone Father Profile is a research-based, versioned instrument grown from the Personal Fathering Profile research program of Dr. Ken Canfield. It is the spine of everything on this platform.</p>
</div></header>

<section class="band tight"><div class="container">
  <h2 class="d-28" style="margin-bottom:8px">Four dimensions you can train.</h2>
  <p style="color:var(--ash);margin:0 0 32px;max-width:60ch">Every score, plan, certificate, and report on this platform is built from movement on these four.</p>
  <div class="grid-2">
    <div class="card" style="padding:28px"><h3 style="margin-bottom:8px">Involvement</h3><p class="small" style="color:var(--ash)">The time and attention a father actually gives, not the time he intends to give.</p></div>
    <div class="card" style="padding:28px"><h3 style="margin-bottom:8px">Consistency</h3><p class="small" style="color:var(--ash)">Whether a father shows up the same way on ordinary days, not only on the big ones.</p></div>
    <div class="card" style="padding:28px"><h3 style="margin-bottom:8px">Awareness</h3><p class="small" style="color:var(--ash)">How well a father knows his actual child: what they fear, love, and carry right now.</p></div>
    <div class="card" style="padding:28px"><h3 style="margin-bottom:8px">Nurturance</h3><p class="small" style="color:var(--ash)">The warmth a child can feel, expressed so the child receives it.</p></div>
  </div>
</div></section>

<section><div class="container split">
  <div>
    <h2 class="d-36" style="font-size:32px">How scoring works.</h2>
    <p style="color:var(--ash);margin:16px 0 18px;max-width:52ch">The full instrument is sectioned and resumable, scored for change within a person over time, and versioned so every result states exactly which instrument produced it. Your answers produce scale scores, an overall standing, your strongest scale, and the gap your plan is built from.</p>
    <p style="color:var(--ash);max-width:52ch">Your results belong to you. We never share an individual father's results. Programs see cohort movement, never a man's private answers.</p>
  </div>
  <div>
    <a class="btn btn-primary" href="profile.html">Take the Profile</a>
    <p class="fine" style="margin-top:12px">Free. About twenty minutes. Private.</p>
  </div>
</div></section>

<section class="band tight"><div class="container" style="max-width:860px">
  <div class="eyebrow" style="margin-bottom:12px">UNDER PSYCHOMETRIC REVIEW</div>
  <h2 class="d-28" style="margin-bottom:8px">The Keystone Manhood Profile.</h2>
  <p style="color:var(--ash);margin:0 0 14px;max-width:62ch">The Manhood Track instrument mirrors the Father Profile architecture exactly: 128 items, 26 scales, identical response formats and scoring, so the two tracks are measured with equal weight. Its four dimensions are Presence, Discipline, Respect, and Service, grounded in strengths-based research on prosocial masculinity, self-discipline, and contribution.</p>
  <p style="color:var(--ash);margin:0;max-width:62ch">The draft instrument is live today for men who choose the Manhood Track, while psychometric review continues. It carries no norm-referenced claims, and will not, until the review completes and a norming study supports them. That is the same rule we hold every instrument to, including our own.</p>
</div></section>

<section class="tight"><div class="container" style="max-width:860px">
  <div class="eyebrow" style="margin-bottom:12px">SOURCES</div>
  <p class="fine" style="color:var(--ash);line-height:2">Canfield, K. <i>The 7 Secrets of Effective Fathers</i>. Tyndale, 1992; updated edition 2005.<br>Canfield, K. <i>The Heart of a Father</i>. Northfield, 1996.<br>The Personal Fathering Profile research program, National Center for Fathering, 1990 to present. fathers.com.<br>A formal validation summary for the Keystone Father Profile is in preparation and will publish on this page.</p>
</div></section>

<section class="tight"><div class="container" style="max-width:860px">
  <div class="eyebrow" style="margin-bottom:12px">THE CANONICAL INSTRUMENT SPEC</div>
  <p style="color:var(--ash);max-width:62ch;margin-bottom:10px">The Keystone Father Profile: 128 items across 26 scales, taken in one sitting. The response format description and the measured median completion time publish here with the current timing study. Every other page on this platform references this block; none carries its own numbers.</p>
  <div class="eyebrow" style="margin:26px 0 12px">ON NORMS</div>
  <p style="color:var(--ash);max-width:62ch;margin-bottom:10px">The Keystone Profile reports change within a person over time. It does not currently report norm-referenced standing. The instrument grows out of the Personal Fathering Profile research program; a technical summary describing the item pool, scale structure, reliability, and the norming sample is in preparation and will publish on this page.</p>
  <p style="color:var(--ash);max-width:62ch">Until it does, we do not make norm-referenced claims, and we ask that no partner make them on our behalf. We hold our own instrument to the standard we ask of programs.</p>
</div></section>
''')

# ================================================== efficacy-report.html
PAGES['efficacy-report.html'] = dict(title='The Efficacy Report', desc='Cohort movement on the Keystone Father Profile, reported as within-person change, in the format funders ask for.', active='For Organizations', mode='public', body='''
<section class="tight" style="padding-top:56px"><div class="container" style="max-width:980px">
  <div class="row between wrap" style="align-items:flex-end;margin-bottom:8px">
    <div>
      <div class="eyebrow brass" style="margin-bottom:12px">THE EFFICACY REPORT</div>
      <h1 class="d-36">Proof, in one page.</h1>
    </div>
    <div class="row" style="gap:10px">
      <select class="input" id="reportOrg" hidden style="max-width:260px"></select>
      <button class="btn btn-secondary btn-sm" data-print>Print</button>
    </div>
  </div>
  <p style="color:var(--ash);margin:0 0 28px;max-width:62ch">Movement on the four Keystone dimensions, per cohort, reported as within-person change. This page is the deliverable: print it, attach it, submit it.</p>
  <div id="reportRoot"></div>
  <p class="fine" style="margin-top:22px">Not on the standard yet? <a class="link" href="organizations.html">Start here</a>. Methodology: <a class="link ash" href="research.html">the research</a>.</p>
  <p class="fine" style="margin-top:10px">Send this page to your funder. It is designed to be forwarded. <a class="link" href="mailto:?subject=Keystone%20Efficacy%20Report%20sample&amp;body=The%20report%20our%20program%20delivers%3A%20https%3A%2F%2Ffathers-com-platform.vercel.app%2Fefficacy-report.html%3Fdemo%3D1">Email the sample &rarr;</a></p>
</div></section>
<style>@media print{.nav,footer,.btn,select{display:none!important}body{background:#fff;color:#000}}</style>
<script src="assets/js/report.js"></script>
''')

# ================================================== WRITER
# ---------------------------------------------------------------------------
# Dark-launch: remove every route into the gatherings surface.
# Runs after all PAGES are defined. Each strip asserts its anchor so that a
# later copy edit fails the build rather than quietly re-exposing the surface.
# ---------------------------------------------------------------------------
# ================================================== certificate courses (v4.11.0)
# All three courses publish their complete written sessions. Film slots are
# placeholders (div.video-slot, data-video="{course}-{session}") until the
# films upload. Lengths per adopted curriculum Rev 3: 8 / 6 / 6 sessions.
PAGES['course-coming-home-present.html'] = dict(title='Coming Home Present: the sessions', desc='Eight sessions on presence after time away: the body you bring home, the child who grew, small deposits, and the reunion, rehearsed before it happens.', active='The Courses', mode='public', body='\n<section class="band"><div class="container" style="max-width:860px">\n  <a class="link ash" href="certificates.html" style="font-size:13px;display:inline-block;margin-bottom:20px">&larr; All courses</a>\n  <div class="eyebrow brass" style="margin-bottom:14px">CERTIFICATE COURSE &middot; 8 SESSIONS &middot; 60 MINUTES EACH</div>\n  <h1 class="d-36" style="margin-bottom:14px">Coming Home Present</h1>\n  <p class="fine mono" style="letter-spacing:.08em;margin-bottom:10px;color:var(--ash)">BUILT FOR A FATHER RETURNING TO HIS CHILDREN</p>\n  <p class="lead" style="max-width:62ch;margin-bottom:10px">The spine course for the return. Eight sessions on the body you bring home, the child who grew, and the trust you rebuild in small deposits, built so a man can complete every practice before he walks back in.</p>\n  <p class="fine" style="color:var(--ash);max-width:62ch;margin-bottom:6px">All 8 written sessions are published below. Films are in production and upload here as they finish. The reunion session is the climax: you graduate with the first-hour plan rehearsed and in hand.</p>\n  <p class="fine" style="color:var(--ash);max-width:62ch">Every session runs facilitator-led, in a cohort, with logged sessions and a checkable practice. Completion never requires contact with your child, and no practice ever asks you to go beyond the rules that govern you now or any court order.</p>\n</div></section>\n<section class="tight"><div class="container" style="max-width:860px"><div class="eyebrow" style="margin-bottom:6px">SESSIONS AT A GLANCE</div><p class="fine" style="color:var(--ash);margin:0 0 6px">The 8 sessions, each about an hour. Tap any one to read it in full.</p><a class="sag-item" href="#a1" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">1</span><span class="small"><b>The Body You Bring Home</b> <span style="color:var(--ash)">&middot; &ldquo;Your body did its job there. Now teach it that home is not there.&rdquo;</span></span></a><a class="sag-item" href="#a2" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">2</span><span class="small"><b>The First Weeks</b> <span style="color:var(--ash)">&middot; &ldquo;Plan around the wave. Do not grade yourself by it.&rdquo;</span></span></a><a class="sag-item" href="#a3" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">3</span><span class="small"><b>The Child Who Grew</b> <span style="color:var(--ash)">&middot; &ldquo;Meet the child in front of you, not the one you left.&rdquo;</span></span></a><a class="sag-item" href="#a4" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">4</span><span class="small"><b>Small Deposits</b> <span style="color:var(--ash)">&middot; &ldquo;Small and often beats big and rare.&rdquo;</span></span></a><a class="sag-item" href="#a5" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">5</span><span class="small"><b>When It Breaks</b> <span style="color:var(--ash)">&middot; &ldquo;Rupture is normal. Repair is the skill.&rdquo;</span></span></a><a class="sag-item" href="#a6" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">6</span><span class="small"><b>Keeping Your Word at a Distance</b> <span style="color:var(--ash)">&middot; &ldquo;A kept promise counts double from far away.&rdquo;</span></span></a><a class="sag-item" href="#a7" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">7</span><span class="small"><b>The Reunion Day</b> <span style="color:var(--ash)">&middot; &ldquo;If the child pulls away, that is the start, not the answer.&rdquo;</span></span></a><a class="sag-item" href="#a8" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">8</span><span class="small"><b>The Long Return</b> <span style="color:var(--ash)">&middot; &ldquo;The return is a season, not a day.&rdquo;</span></span></a></div></section>\n<section><div class="container" style="max-width:860px">\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="a1">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 1</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Body You Bring Home</h3>\n  <div class="video-slot" data-video="chp-a1" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Your body did its job there. Now teach it that home is not there.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> A door slams down the hall. Before a thought arrives, his shoulders are up and his eyes are on the doorway. It is only the kid going back for shoes.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> The body&rsquo;s alarm system in plain language: how a long stretch in a controlled environment retunes it, why a body kept on alert keeps scanning and startling after the threat is gone, and how that collides with a loud, unpredictable home. You plot your own baseline and pick your tells.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can name what your body is doing when it revs, call it a physical response and not a character flaw, and tell your family what helps.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Keep a three-times-daily one-word body-state log, name two likely home triggers, and rehearse with a cohort partner the sentence you will use to tell your family what helps.</p>\n    <p class="small"><b>After the return:</b> Keep the log at home, agree one signal with a family member, and report what happened.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Fight or flight, the load a long alert season leaves behind, and why the scanning outlasts the threat.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="a2">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 2</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The First Weeks</h3>\n  <div class="video-slot" data-video="chp-a2" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Plan around the wave. Do not grade yourself by it.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Day nine home. He slept badly, snapped over spilled cereal, and by noon he is quietly deciding he is failing at this. He is not failing. He is in a wave, and the plan he wrote says what to do on wave days.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> Energy, mood, and sleep run in unpredictable waves in the early weeks of any return. That is expected and it passes. You plan around it instead of getting ambushed by it.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can expect the low weeks, plan around them, and stop reading them as verdicts.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Hold one fixed sleep and wake time for five nights where you are now; log it.</p>\n    <p class="small"><b>After the return:</b> Hold the same anchor at home.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: The early-weeks wave pattern: sleep, energy, and irritability that ebb and flow while a body leaves an imposed routine.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="a3">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 3</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Child Who Grew</h3>\n  <div class="video-slot" data-video="chp-a3" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Meet the child in front of you, not the one you left.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> He left a child who held his hand crossing the street. On the phone now, the child talks about a teacher he has never heard of and a best friend whose name is new, and the shoe by the door is nearly his own size.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> You map where your child actually is now against the child you left, using plain milestone anchors, then build the questions that rebuild a current picture of your child&rsquo;s world: friends, fears, interests.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can recalibrate your expectations to the child who exists today and answer specific questions about that child&rsquo;s present life.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Build a one-page current picture of your child from photos, letters, calls, and what others report. Draft ten questions that are only questions, no advice, and use as many as one permitted call or visit allows.</p>\n    <p class="small"><b>After the return:</b> One ten-minute questions-only conversation; log three things you learned.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Children hit growth milestones on a published clock, and knowing your child is the base of every attuned moment.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="a4">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 4</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">Small Deposits</h3>\n  <div class="video-slot" data-video="chp-a4" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Small and often beats big and rare.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Mid-conversation with someone else, the child appears holding a drawing. He stops, looks at it, and says show me the best part. Twenty seconds. That is a deposit, and it counts the same over a phone line as across a kitchen table.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> Trust rebuilds through many small responsive interactions, not one big moment, and a settled adult body helps settle a child&rsquo;s. You practice two skills together: arriving calm, then catching and returning your child&rsquo;s bids for attention.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can settle yourself first, then make daily small deposits, and explain why they beat grand gestures.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Use one 60-second settling routine before each call or visit, and catch and return three bids during one permitted call or visit. Where no contact is permitted, role-play five exchanges with a cohort partner; tally.</p>\n    <p class="small"><b>After the return:</b> Settle first, then run five exchanges a day for a week; tally them.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Serve and return: a child&rsquo;s bid met by a steady adult builds the child&rsquo;s brain, and your calm settles his body before your words do.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="a5">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 5</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">When It Breaks</h3>\n  <div class="video-slot" data-video="chp-a5" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Rupture is normal. Repair is the skill.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> He promised a call at seven. The line was long and the call went out at nine, and the child had stopped waiting by the phone. The next call opens with the repair, said plainly, no excuses attached.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> Every close relationship ruptures, and repair, not perfection, is what builds security. You practice a plain repair script until it comes out steady.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can come back after a bad moment and repair it out loud.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Write the repair for one past rupture in your own words, whether or not it can be sent, and rehearse it aloud with a cohort partner.</p>\n    <p class="small"><b>After the return:</b> Perform one deliberate repair after a rupture and record what you said.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Every close relationship falls out of sync; reliable repair, not perfection, is what builds security.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="a6">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 6</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">Keeping Your Word at a Distance</h3>\n  <div class="video-slot" data-video="chp-a6" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;A kept promise counts double from far away.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Tuesday, seven o&rsquo;clock, his voice on the phone, every week without a miss. By the fourth week the child sets the table around it. The distance did not shrink. The word held.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> The discipline of small promises made and kept from wherever you stand, and a repeatable contact ritual that holds across distance now and across work hours later.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can make promises you can keep, keep the ones you make, and hold presence across distance with predictable contact, starting from where you are.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Make and keep three small promises deliverable within your current constraints: a call at the promised time, a finished module, a letter mailed the day you said. Set one repeatable contact ritual inside the rules that govern you now; where no contact is permitted, build the ritual on paper and file it for day one.</p>\n    <p class="small"><b>After the return:</b> Run the ritual twice from home and keep three small specific promises in a week.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Predictability lowers a child&rsquo;s background stress; a promise kept on schedule is steadiness a child can feel.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="a7">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 7</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Reunion Day</h3>\n  <div class="video-slot" data-video="chp-a7" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;If the child pulls away, that is the start, not the answer.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> First hour home. The younger one hides behind the mother&rsquo;s leg. The older one shrugs off the hug. He keeps his voice low, lets it be, and offers the small plan he rehearsed: a walk to the corner and back, nothing more.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> You prepare for the first hours and days back, including the real possibility that a child pulls away at first. You learn not to read early rejection as permanent, and you write and rehearse a low-pressure first-hour plan.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You graduate with a realistic, rehearsed first-hour plan and the patience to let it be imperfect.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Write the low-pressure first-hour plan and rehearse it aloud with a cohort partner; your facilitator checks the plan.</p>\n    <p class="small"><b>After the return:</b> Run it, and report how it went.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Early pull-away at reunions is common and temporary; patience in the first days is a skill, not a mood.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="a8">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 8</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Long Return</h3>\n  <div class="video-slot" data-video="chp-a8" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;The return is a season, not a day.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Week six, an ordinary Tuesday. Nothing dramatic happened today. He did the ritual anyway, logged the wave, made the small deposit. That is what the plan working looks like.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> You fold the course into a personal return plan, frame fathering as a long work, and name an accountability partner, who may be a cohort partner.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You leave with a written plan, a first checkpoint, and a named accountability partner.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Complete the one-page return plan, name the accountability partner, and set the first after-return checkpoint date.</p>\n    <p class="small"><b>After the return:</b> Work the plan and report at the checkpoint.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Routines hold gains; steady spaced practice beats bursts.</p>\n</article>\n</div></section>\n<section class="band"><div class="container" style="max-width:860px;text-align:center">\n  <h2 class="d-28" style="margin-bottom:10px">Train it with a cohort.</h2>\n  <p style="color:var(--ash);max-width:56ch;margin:0 auto 20px">Start with the Keystone Father Profile and your ninety-day plan, or bring this course to the men your organization serves.</p>\n  <div class="row" style="gap:12px;justify-content:center"><a class="btn btn-primary" href="profile.html">Start with the Profile</a><a class="btn btn-secondary" href="organizations.html">Bring it to your organization</a></div>\n</div></section>\n')
PAGES['course-steady-under-pressure.html'] = dict(title='Steady Under Pressure: the sessions', desc='Six sessions on steadiness: the surge, the pause and the exhale, the step away, naming it, the repair, and steady habits.', active='The Courses', mode='public', body='\n<section class="band"><div class="container" style="max-width:860px">\n  <a class="link ash" href="certificates.html" style="font-size:13px;display:inline-block;margin-bottom:20px">&larr; All courses</a>\n  <div class="eyebrow brass" style="margin-bottom:14px">CERTIFICATE COURSE &middot; 6 SESSIONS &middot; 60 MINUTES EACH</div>\n  <h1 class="d-36" style="margin-bottom:14px">Steady Under Pressure</h1>\n  <p class="fine mono" style="letter-spacing:.08em;margin-bottom:10px;color:var(--ash)">FOR EVERY MAN, ON EITHER TRACK</p>\n  <p class="lead" style="max-width:62ch;margin-bottom:10px">Six sessions on steadiness: the surge, the pause, the exhale, the step away, the repair, and the habits underneath them all. Consistency, trained where you stand.</p>\n  <p class="fine" style="color:var(--ash);max-width:62ch;margin-bottom:6px">All 6 written sessions are published below. Films are in production and upload here as they finish. Every drill except the live home repair is practicable wherever you are right now.</p>\n  <p class="fine" style="color:var(--ash);max-width:62ch">Every session runs facilitator-led, in a cohort, with logged sessions and a checkable practice. Completion never requires contact with your child, and no practice ever asks you to go beyond the rules that govern you now or any court order.</p>\n</div></section>\n<section class="tight"><div class="container" style="max-width:860px"><div class="eyebrow" style="margin-bottom:6px">SESSIONS AT A GLANCE</div><p class="fine" style="color:var(--ash);margin:0 0 6px">The 6 sessions, each about an hour. Tap any one to read it in full.</p><a class="sag-item" href="#b1" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">1</span><span class="small"><b>The Alarm System</b> <span style="color:var(--ash)">&middot; &ldquo;The surge is a signal, not an order.&rdquo;</span></span></a><a class="sag-item" href="#b2" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">2</span><span class="small"><b>The Pause and the Exhale</b> <span style="color:var(--ash)">&middot; &ldquo;Six seconds and a long exhale buy your judgment back.&rdquo;</span></span></a><a class="sag-item" href="#b3" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">3</span><span class="small"><b>The Step Away</b> <span style="color:var(--ash)">&middot; &ldquo;Step away to come back.&rdquo;</span></span></a><a class="sag-item" href="#b4" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">4</span><span class="small"><b>Naming It</b> <span style="color:var(--ash)">&middot; &ldquo;Say the feeling so you do not have to show it.&rdquo;</span></span></a><a class="sag-item" href="#b5" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">5</span><span class="small"><b>The Repair</b> <span style="color:var(--ash)">&middot; &ldquo;Own it out loud.&rdquo;</span></span></a><a class="sag-item" href="#b6" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">6</span><span class="small"><b>Steady Habits, Steady Mood</b> <span style="color:var(--ash)">&middot; &ldquo;Steadiness is built in the boring hours.&rdquo;</span></span></a></div></section>\n<section><div class="container" style="max-width:860px">\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="b1">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 1</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Alarm System</h3>\n  <div class="video-slot" data-video="sup-b1" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;The surge is a signal, not an order.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> The noise in the meal line rises, trays and voices. His jaw sets before he knows why. That jaw is the earliest cue.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> The body&rsquo;s stress response in plain language, and your own early warning signs found and named.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can spot your own escalation before it peaks.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Log three moments of rising tension with the earliest body cue you noticed, wherever you are.</p>\n    <p class="small"><b>After the return:</b> Same log, at home.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: The surge chemistry of stress and the early body cues that fire before awareness.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="b2">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 2</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Pause and the Exhale</h3>\n  <div class="video-slot" data-video="sup-b2" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Six seconds and a long exhale buy your judgment back.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> The words are already loaded and his finger is on the trigger of the sentence. He counts one slow exhale instead, six seconds. The sentence he almost said stays unsaid, and the one he says instead is his.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> What happens in the brain and body in the seconds before a blowup, including the fast pathway that outruns judgment, then the two tools that buy judgment back: a deliberate pause of a few seconds and slow breathing with a longer exhale.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can insert the pause when you feel the surge and lower your own charge on demand.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Practice the exhale drill daily, and use the named pause three times in the week; record the trigger and what you did.</p>\n    <p class="small"><b>After the return:</b> Same drill, live at home.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: The fast threat pathway outruns judgment by design; a deliberate pause and a long exhale bring judgment back online.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="b3">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 3</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Step Away</h3>\n  <div class="video-slot" data-video="sup-b3" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Step away to come back.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Mid-argument on a call, his voice is climbing. He says I need ten minutes, I am coming back, and he does, on time, quieter. The coming back is the whole skill.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> Using a time-out on yourself as a reset, not a punishment, and how to take a break without abandoning the moment or the person in it.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can step away to cool down and return.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Take one clean self time-out during a hard moment where you are now and return to the interaction; report it.</p>\n    <p class="small"><b>After the return:</b> Same, at home.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: A clean break lets the body reset; the return is what keeps it from becoming abandonment.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="b4">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 4</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">Naming It</h3>\n  <div class="video-slot" data-video="sup-b4" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Say the feeling so you do not have to show it.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Instead of the slammed cabinet, he says I am frustrated, and not at you. Five words. The temperature in the room drops a degree, and the child learns the words too.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> Putting feelings into words lowers their intensity. You practice naming your own state and, in rehearsal, what someone you love is carrying.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can handle feelings by naming them instead of acting them out.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Name one feeling out loud in three separate moments; log them.</p>\n    <p class="small"><b>After the return:</b> Same, at home.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Naming a feeling out loud measurably lowers its charge.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="b5">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 5</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Repair</h3>\n  <div class="video-slot" data-video="sup-b5" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Own it out loud.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Last night he barked over nothing. This morning, before anything else: I was wrong to raise my voice. You did not deserve that. Ten words, rehearsed until they come out steady.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> Repair after a rupture is what protects the relationship. You practice a plain repair script until it holds under pressure.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can own a bad moment and repair it.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Write one repair you owe, whether or not it can be sent, and deliver one live repair to someone where you are now; record the words.</p>\n    <p class="small"><b>After the return:</b> Perform one deliberate repair at home and record the words used.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Repair protects the relationship; owning it out loud is the strong move, not the weak one.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="b6">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 6</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">Steady Habits, Steady Mood</h3>\n  <div class="video-slot" data-video="sup-b6" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Steadiness is built in the boring hours.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Lights out at the same hour five nights straight, a walk or a workout each day, and by day five the fuse is measurably longer. He can see it in his own log. Nobody applauded. It worked anyway.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> The daily regulators that raise your threshold: sleep, movement, and predictable routine, tied together in a written steadiness plan.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can lower your baseline reactivity through habits practicable anywhere and commit to being predictable in mood and follow-through, beginning now, not at the door.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Hold one sleep anchor and one movement block for five days, then complete a one-page steadiness plan with one measurable weekly marker.</p>\n    <p class="small"><b>After the return:</b> Keep the anchors at home and work the plan.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Sleep, movement, and routine raise the threshold where steadiness breaks.</p>\n</article>\n</div></section>\n<section class="band"><div class="container" style="max-width:860px;text-align:center">\n  <h2 class="d-28" style="margin-bottom:10px">Train it with a cohort.</h2>\n  <p style="color:var(--ash);max-width:56ch;margin:0 auto 20px">Start with the Keystone Father Profile and your ninety-day plan, or bring this course to the men your organization serves.</p>\n  <div class="row" style="gap:12px;justify-content:center"><a class="btn btn-primary" href="profile.html">Start with the Profile</a><a class="btn btn-secondary" href="organizations.html">Bring it to your organization</a></div>\n</div></section>\n')
PAGES['course-same-team.html'] = dict(title='Same Team: the sessions', desc='Six sessions on co-parenting across two homes: one team, the body in conflict, businesslike, earning back trust, and the handoff.', active='The Courses', mode='public', body='\n<section class="band"><div class="container" style="max-width:860px">\n  <a class="link ash" href="certificates.html" style="font-size:13px;display:inline-block;margin-bottom:20px">&larr; All courses</a>\n  <div class="eyebrow brass" style="margin-bottom:14px">CERTIFICATE COURSE &middot; 6 SESSIONS &middot; 60 MINUTES EACH</div>\n  <h1 class="d-36" style="margin-bottom:14px">Same Team</h1>\n  <p class="fine mono" style="letter-spacing:.08em;margin-bottom:10px;color:var(--ash)">BUILT FOR FATHERS RAISING CHILDREN ACROSS TWO HOMES</p>\n  <p class="lead" style="max-width:62ch;margin-bottom:10px">Six sessions on co-parenting: one team for your children, whatever the arrangement between the parents. The talk that works, the message that lands, and the trust you earn back inside every boundary.</p>\n  <p class="fine" style="color:var(--ash);max-width:62ch;margin-bottom:6px">All 6 written sessions are published below. Films are in production and upload here as they finish. Written first, rehearsed first: a man can complete every checkpoint before he is home.</p>\n  <p class="fine" style="color:var(--ash);max-width:62ch">Every session runs facilitator-led, in a cohort, with logged sessions and a checkable practice. Completion never requires contact with your child, and no practice ever asks you to go beyond the rules that govern you now or any court order.</p>\n</div></section>\n<section class="tight"><div class="container" style="max-width:860px"><div class="eyebrow" style="margin-bottom:6px">SESSIONS AT A GLANCE</div><p class="fine" style="color:var(--ash);margin:0 0 6px">The 6 sessions, each about an hour. Tap any one to read it in full.</p><a class="sag-item" href="#c1" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">1</span><span class="small"><b>One Team for the Children</b> <span style="color:var(--ash)">&middot; &ldquo;Whatever we are to each other, we are one team for the child.&rdquo;</span></span></a><a class="sag-item" href="#c2" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">2</span><span class="small"><b>The Body in Conflict</b> <span style="color:var(--ash)">&middot; &ldquo;Flooded means pause. Twenty minutes, then resume.&rdquo;</span></span></a><a class="sag-item" href="#c3" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">3</span><span class="small"><b>Businesslike</b> <span style="color:var(--ash)">&middot; &ldquo;Short, factual, about the child.&rdquo;</span></span></a><a class="sag-item" href="#c4" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">4</span><span class="small"><b>Earning Back Trust</b> <span style="color:var(--ash)">&middot; &ldquo;Trust is bought with reliability, and never against an order.&rdquo;</span></span></a><a class="sag-item" href="#c5" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">5</span><span class="small"><b>One Child, Two Homes</b> <span style="color:var(--ash)">&middot; &ldquo;The child carries the distance. Lighten the load.&rdquo;</span></span></a><a class="sag-item" href="#c6" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">6</span><span class="small"><b>The Handoff</b> <span style="color:var(--ash)">&middot; &ldquo;Predictable beats perfect.&rdquo;</span></span></a></div></section>\n<section><div class="container" style="max-width:860px">\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="c1">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 1</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">One Team for the Children</h3>\n  <div class="video-slot" data-video="st-c1" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Whatever we are to each other, we are one team for the child.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> A parent-teacher meeting. The two adults sit one seat apart, not touching, not fighting, and both sign the same plan for the same child. The child hears about it later and sleeps easier that night.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> What being on one team means when the adults may not be together, with the child&rsquo;s experience at the center.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can state the shared goal in child-centered terms.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Write one child-centered goal and send it through a permitted channel, or file it to send on day one.</p>\n    <p class="small"><b>After the return:</b> Share it with the co-parent in writing.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: A child caught between adults carries the load in his body; one shared goal lowers it.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="c2">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 2</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Body in Conflict</h3>\n  <div class="video-slot" data-video="st-c2" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Flooded means pause. Twenty minutes, then resume.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> The message thread heats up and he can feel his heartbeat in his ears. He types let us finish this tonight at eight, puts the phone face down, and walks. At eight he comes back, and the conversation works.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> When your heart is racing, the thinking brain goes offline and productive conversation stops. You train the structured pause: breaking off cleanly when flooded and resuming after the body resets.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can recognize flooding in yourself and break off and reschedule a hot conversation cleanly.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Rehearse the break-off script with a cohort partner and use it once on any heated call; log it.</p>\n    <p class="small"><b>After the return:</b> Use a structured pause once and resume later; log both ends.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Past a racing heartbeat nobody absorbs a word; the body needs about twenty minutes to come back down.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="c3">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 3</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">Businesslike</h3>\n  <div class="video-slot" data-video="st-c3" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Short, factual, about the child.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Three lines. Pickup Friday at five. Homework due Sunday. Doctor confirmed Tuesday. Nothing about the past, nothing about the two of them. The reply comes back the same way, and nobody&rsquo;s evening is ruined.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> Brief, factual, child-focused communication, and where the adults are not together, the low-contact model that keeps the heat out of the channel.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can send a businesslike message that carries only what the child needs.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Draft three businesslike messages in the format taught and send whichever a permitted channel allows; file the rest.</p>\n    <p class="small"><b>After the return:</b> Send three businesslike messages; keep copies.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Less exposure to adult conflict is a direct gift to a child&rsquo;s nervous system.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="c4">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 4</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">Earning Back Trust</h3>\n  <div class="video-slot" data-video="st-c4" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Trust is bought with reliability, and never against an order.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> For a month he is never once late for the agreed call, never once asks for an exception, keeps every commitment exactly as written. Nobody says anything about it. The tone in the messages changes anyway.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> How a returning parent earns back caregiving trust through reliability over time, and how a co-parent&rsquo;s encouragement or wariness shapes access. This session carries the hard boundary: rebuilding trust never overrides a court order or a protective order, and where one stands, its terms come first.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can earn trust in steps and operate inside any legal boundary, starting before you are home.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Identify one small reliable act deliverable from where you are, a call at the agreed time, paperwork completed, obligations current, and do it consistently for a week inside any existing order; log it.</p>\n    <p class="small"><b>After the return:</b> Hold one small caregiving task reliably for a week; log it.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Reliability, repeated, is what reopens the gate; encouragement follows the track record.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="c5">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 5</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">One Child, Two Homes</h3>\n  <div class="video-slot" data-video="st-c5" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;The child carries the distance. Lighten the load.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Every week the child leaves one home with a bag. He learns what is hard about the bag and fixes his end of it: the charger that is always missing, the book that gets left behind, the jacket for the colder house. Small logistics, felt as love.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> Your child&rsquo;s experience of moving between two homes, the load at the transition, and the warmth and attention that build resilience regardless of the arrangement.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can see the transition through the child&rsquo;s eyes and deliver consistent warmth from wherever you stand, now and from your own home later.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Draft one open question about moving between homes and ask it on a permitted call or visit, or file it. Deliver warmth through the channels you have, a call, a letter, a recorded message where permitted, five times; tally, and log the answer without defending.</p>\n    <p class="small"><b>After the return:</b> Ask it in person, log the answer without reacting defensively, and run five back-and-forth exchanges during your parenting time.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Transitions are stress points for a child; warm, attuned attention from his father builds resilience wherever it comes from.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="c6">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 6</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Handoff</h3>\n  <div class="video-slot" data-video="st-c6" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Predictable beats perfect.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Same spot, same time, a calm two-minute handoff, every week. Within a month the child stops going quiet on the ride there. Nothing was said. The routine said it.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> A predictable handoff and communication routine and a personal one-team plan, rehearsed before it is ever needed.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You leave with a repeatable structure, rehearsed, and a first checkpoint.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Complete the one-page handoff plan and walk it through with a cohort partner playing the co-parent.</p>\n    <p class="small"><b>After the return:</b> Execute one handoff to the plan; log it.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: A predictable routine says what words cannot.</p>\n</article>\n</div></section>\n<section class="band"><div class="container" style="max-width:860px;text-align:center">\n  <h2 class="d-28" style="margin-bottom:10px">Train it with a cohort.</h2>\n  <p style="color:var(--ash);max-width:56ch;margin:0 auto 20px">Start with the Keystone Father Profile and your ninety-day plan, or bring this course to the men your organization serves.</p>\n  <div class="row" style="gap:12px;justify-content:center"><a class="btn btn-primary" href="profile.html">Start with the Profile</a><a class="btn btn-secondary" href="organizations.html">Bring it to your organization</a></div>\n</div></section>\n')

# ================================================== dark: directory + gift (v4.12.0)
if not SHOW_DIRECTORY:
    PAGES.pop('find-a-program.html', None)
if not SHOW_GIFT:
    PAGES.pop('gift.html', None)
    _sp = PAGES['sponsor.html']['body']
    _gl = 'Giving to your own dad or a friend? <a class="link ash" href="gift.html">Give a man the work &rarr;</a></p>'
    assert _sp.count(_gl) == 1
    PAGES['sponsor.html']['body'] = _sp.replace(_gl, '</p>')
# ================================================== dark: The Man Before You
# Staged in full, gated on Dr. Canfield review of spec Rev 1. See flag above.
if SHOW_MANHOOD_COURSE:
    PAGES['course-the-man-before-you.html'] = dict(title='The Man Before You: the sessions', desc='Six sessions for the Manhood Track: the fathering you received, the account, the line, the younger man, and the word that holds.', active='The Courses', mode='public', body='\n<section class="band"><div class="container" style="max-width:860px">\n  <a class="link ash" href="certificates.html" style="font-size:13px;display:inline-block;margin-bottom:20px">&larr; All courses</a>\n  <div class="eyebrow brass" style="margin-bottom:14px">CERTIFICATE COURSE &middot; 6 SESSIONS &middot; 60 MINUTES EACH</div>\n  <h1 class="d-36" style="margin-bottom:14px">The Man Before You</h1>\n  <p class="fine mono" style="letter-spacing:.08em;margin-bottom:10px;color:var(--ash)">FOR THE MANHOOD TRACK, EVERY MAN WELCOME</p>\n  <p class="lead" style="max-width:62ch;margin-bottom:10px">Six sessions for the man preparing, mentoring, or growing: the fathering you received, the account you settle, the line you draw, the younger man you invest in, and the word that holds. The same training the father courses carry, aimed at the life you have now.</p>\n  <p class="fine" style="color:var(--ash);max-width:62ch;margin-bottom:6px">All 6 written sessions are published below. Films are in production and upload here as they finish.</p>\n  <p class="fine" style="color:var(--ash);max-width:62ch">Every session runs facilitator-led, in a cohort, with logged sessions and a checkable practice. Settling your history never requires contact with anyone, and no practice ever asks you to reopen contact that is unsafe or to go beyond any order that stands.</p>\n</div></section>\n<section class="tight"><div class="container" style="max-width:860px"><div class="eyebrow" style="margin-bottom:6px">SESSIONS AT A GLANCE</div><p class="fine" style="color:var(--ash);margin:0 0 6px">The 6 sessions, each about an hour. Tap any one to read it in full.</p><a class="sag-item" href="#m1" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">1</span><span class="small"><b>The Man Before You</b> <span style="color:var(--ash)">&middot; &ldquo;You cannot choose what you were given. You choose what you carry.&rdquo;</span></span></a><a class="sag-item" href="#m2" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">2</span><span class="small"><b>The Account</b> <span style="color:var(--ash)">&middot; &ldquo;Settle the account on paper. Contact is a separate decision.&rdquo;</span></span></a><a class="sag-item" href="#m3" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">3</span><span class="small"><b>What Stops With Me</b> <span style="color:var(--ash)">&middot; &ldquo;The line does not break by accident. It breaks on purpose, out loud.&rdquo;</span></span></a><a class="sag-item" href="#m4" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">4</span><span class="small"><b>The Younger Man</b> <span style="color:var(--ash)">&middot; &ldquo;Somebody is already watching you. Father him on purpose.&rdquo;</span></span></a><a class="sag-item" href="#m5" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">5</span><span class="small"><b>The Household You Are Building</b> <span style="color:var(--ash)">&middot; &ldquo;The household begins before anyone moves in. It begins with your word holding.&rdquo;</span></span></a><a class="sag-item" href="#m6" style="display:flex;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid rgba(127,127,127,.22);text-decoration:none;color:inherit"><span class="fine mono" style="color:var(--ash);min-width:26px">6</span><span class="small"><b>The Long Line</b> <span style="color:var(--ash)">&middot; &ldquo;You are already in the line. Live like it.&rdquo;</span></span></a></div></section>\n<section><div class="container" style="max-width:860px">\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="m1">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 1</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Man Before You</h3>\n  <div class="video-slot" data-video="mbf-m1" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;You cannot choose what you were given. You choose what you carry.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> A man is asked what his father&rsquo;s voice sounded like at the dinner table. He answers before he means to. Everyone in the room has an answer, including the men whose fathers were never there. Silence is an answer too.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> You map the fathering you received, in plain categories: what was given, what was missing, what was harmful, without a verdict on the man who gave it. Every man fathers out of an inheritance, received or resisted, and seeing it clearly is the first act of choosing.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can name what you received, in your own words, without flinching and without excusing.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Write one page titled What I Was Given, three columns: kept, missing, stops with me. Bring it sealed or open, your choice.</p>\n    <p class="small"><b>After the return:</b> Same page, and one conversation with someone who knew your father, only questions.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: The body keeps the patterns it grew up under; seeing them clearly is the first move in changing them.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="m2">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 2</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Account</h3>\n  <div class="video-slot" data-video="mbf-m2" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Settle the account on paper. Contact is a separate decision.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> A man reads one sentence of his letter aloud to the cohort, just one. His voice holds until the last word. Nobody fixes it. The facilitator says thank you, and the room moves on. That is the whole ceremony.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> You write the account: what you owe, what you are owed, and what you are releasing, whether or not the man is alive, safe, or willing. Resolving a history and reopening a relationship are two different things, and the first never requires the second. Where a father is unsafe, unwilling, or gone, the work is done entirely on paper.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can close the open loop enough to stop living against it or from inside it.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Finish the letter, sent or unsent, your decision, logged either way. Where the man is reachable and safe and you choose it, one contact on your own terms.</p>\n    <p class="small"><b>After the return:</b> The same choice, revisited once at thirty days, and the decision logged, either way.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Writing the hard thing lowers its charge; repair, not a perfect history, is what settles a bond.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="m3">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 3</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">What Stops With Me</h3>\n  <div class="video-slot" data-video="mbf-m3" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;The line does not break by accident. It breaks on purpose, out loud.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> A man says my kids will never wonder where I am at dinner time, and he does not have kids. The room does not laugh. Half of them write the sentence down.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> You name the two or three patterns from your inheritance that end with you, and the two or three worth keeping, and you learn why a stated line, spoken to another man, holds better than a private vow.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You leave with a written line, what stops and what continues, witnessed by your cohort.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Write the line, two columns: stops with me, continues through me. Read one item aloud to a cohort partner.</p>\n    <p class="small"><b>After the return:</b> Post the line where you will see it daily; report at thirty days which item was tested first.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: A decision made in advance, said out loud, holds better under load than a private vow.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="m4">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 4</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Younger Man</h3>\n  <div class="video-slot" data-video="mbf-m4" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;Somebody is already watching you. Father him on purpose.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> The new man in the cohort cannot look anyone in the eye. A man from this course sits next to him at the meal, asks one question, and returns the answer with a second question. Ten minutes. The next session, the new man sits down next to him first.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> The fastest way to train fathering before fatherhood is to practice it on the younger man already in your life: a mentee, a nephew, a younger brother, the newest man in the room. You train the same catch-and-return attention and questions-only listening the father courses train, aimed at him.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can catch and return a younger man&rsquo;s bids, listen without fixing, and name one man you are deliberately investing in.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Name the younger man. Run five deliberate catch-and-return exchanges with him across the week, and hold one ten-minute questions-only conversation; tally.</p>\n    <p class="small"><b>After the return:</b> Same, with the younger man your life actually contains, named in your plan.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: A bid met by a steady man builds connection at every age, and investing in the next man is a documented engine of lasting change.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="m5">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 5</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Household You Are Building</h3>\n  <div class="video-slot" data-video="mbf-m5" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;The household begins before anyone moves in. It begins with your word holding.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Tuesday, seven o&rsquo;clock, he said he would call, and he calls. Week after week. Nobody applauds. Months later, when it matters, his word is the one in the room that everyone already trusts.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> You train reliability toward the household you are building or repairing: a partner, a future family, aging parents, whoever your word currently serves. Where any order or agreement governs a relationship, the work runs inside it.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You can make and keep small promises to the people your life currently contains, and explain why a track record beats a declaration.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Make and keep three small promises deliverable within your current constraints: a call at the promised time, an obligation kept current, a finished module; log each.</p>\n    <p class="small"><b>After the return:</b> The same three, aimed at the household you named.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Your predictability lowers the stress load of everyone attached to you.</p>\n</article>\n<article class="card" style="padding:26px 28px;margin-bottom:18px" id="m6">\n  <div class="row between" style="margin-bottom:10px"><span class="pill">SESSION 6</span><span class="fine mono">60 MIN</span></div>\n  <h3 class="d-28" style="margin-bottom:12px">The Long Line</h3>\n  <div class="video-slot" data-video="mbf-m6" style="border:1px dashed rgba(127,127,127,.45);border-radius:10px;padding:24px;text-align:center;margin-bottom:16px">\n    <p class="fine mono" style="letter-spacing:.08em">FILM IN PRODUCTION</p>\n    <p class="fine" style="color:var(--ash);margin-top:6px">The session film uploads here. The written session below is complete.</p>\n  </div>\n  <p class="lead" style="font-size:17px;margin-bottom:12px">&ldquo;You are already in the line. Live like it.&rdquo;</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>One scene.</b> Week six, an ordinary Tuesday. He called when he said he would, asked the younger man one good question, and did not repeat the pattern that was tested that morning. Nothing dramatic happened. That is the line holding.</p>\n  <p style="color:var(--ash);margin-bottom:12px"><b>In the room.</b> You fold the course into a personal line plan: the account settled, the line stated, the younger man named, the promises running, and you name an accountability partner, who may be a cohort partner. The work is a long line you are now a living part of, whether or not children ever come.</p>\n  <p style="color:var(--ash);margin-bottom:14px"><b>What you leave with.</b> You leave with a written plan, a first checkpoint, and a named accountability partner.</p>\n  <div class="card" style="background:rgba(127,127,127,.07);padding:16px 18px;margin-bottom:10px">\n    <p class="fine mono" style="margin-bottom:8px;letter-spacing:.06em">THE PRACTICE</p>\n    <p class="small" style="margin-bottom:6px"><b>Before the return:</b> Complete the one-page line plan, name the accountability partner, set the first checkpoint date.</p>\n    <p class="small"><b>After the return:</b> Work the plan and report at the checkpoint.</p>\n  </div>\n  <p class="fine" style="color:var(--ash)">The science in the room: Routines hold gains; steady spaced practice beats bursts.</p>\n</article>\n</div></section>\n<section class="band"><div class="container" style="max-width:860px;text-align:center">\n  <h2 class="d-28" style="margin-bottom:10px">Train it with a cohort.</h2>\n  <p style="color:var(--ash);max-width:56ch;margin:0 auto 20px">Start with the free Keystone Profile and your ninety-day plan, or bring this course to the men your organization serves.</p>\n  <div class="row" style="gap:12px;justify-content:center"><a class="btn btn-primary" href="profile.html">Start with the Profile</a><a class="btn btn-secondary" href="organizations.html">Bring it to your organization</a></div>\n</div></section>\n')
    _st_card = PAGES['certificates.html']['body']
    _mark = '<h3>Same Team</h3>'
    assert _st_card.count(_mark) == 1
    _close = _st_card.index('</div>\n', _st_card.index('cert-card-foot', _st_card.index(_mark))) + len('</div>\n')
    PAGES['certificates.html']['body'] = _st_card[:_close] + '    <div class="cert-card" style="cursor:default" data-cert="manhood" data-title="The Man Before You" data-hours="6.0" data-desc="The Manhood Track course: the fathering you received, the line you draw, the younger man you invest in, and the word that holds. Sessions logged, checkpoints, and a final assessment at eighty percent to pass.">\n      <div class="cert-card-top"><span class="pill">Sessions live</span><span class="cert-card-hrs">6 sessions</span></div>\n      <h3>The Man Before You</h3>\n      <p>For the Manhood Track, every man welcome. The fathering you received, settled; the line you draw, stated; the younger man, invested in. All six written sessions are published; films are in production.</p>\n      <details class="sess-peek" style="margin-top:10px"><summary class="fine" style="cursor:pointer;color:var(--brass,#c9a227)">The 6 sessions, at a glance</summary><ol class="small" style="margin:8px 0 2px;padding-left:18px"><li style="margin:5px 0"><b>The Man Before You</b> <span style="color:var(--ash)">&middot; &ldquo;You cannot choose what you were given. You choose what you carry.&rdquo;</span></li><li style="margin:5px 0"><b>The Account</b> <span style="color:var(--ash)">&middot; &ldquo;Settle the account on paper. Contact is a separate decision.&rdquo;</span></li><li style="margin:5px 0"><b>What Stops With Me</b> <span style="color:var(--ash)">&middot; &ldquo;The line does not break by accident. It breaks on purpose, out loud.&rdquo;</span></li><li style="margin:5px 0"><b>The Younger Man</b> <span style="color:var(--ash)">&middot; &ldquo;Somebody is already watching you. Father him on purpose.&rdquo;</span></li><li style="margin:5px 0"><b>The Household You Are Building</b> <span style="color:var(--ash)">&middot; &ldquo;The household begins before anyone moves in. It begins with your word holding.&rdquo;</span></li><li style="margin:5px 0"><b>The Long Line</b> <span style="color:var(--ash)">&middot; &ldquo;You are already in the line. Live like it.&rdquo;</span></li></ol><p class="fine" style="margin:6px 0 0"><a class="link" href="course-the-man-before-you.html">Read them in full &rarr;</a></p></details>\n      <div class="cert-card-foot"><span class="mono">6 sessions</span><a class="cert-card-go" href="course-the-man-before-you.html">Read the sessions &rarr;</a></div>\n    </div>\n' + _st_card[_close:]
    _fit_old = 'Fundamentals and Steady Under Pressure serve every man on either track. Coming Home Present and Same Team are built for fathers.'
    assert PAGES['certificates.html']['body'].count(_fit_old) == 1
    PAGES['certificates.html']['body'] = PAGES['certificates.html']['body'].replace(_fit_old, 'Fundamentals, Steady Under Pressure, and The Man Before You serve every man on either track. Coming Home Present and Same Team are built for fathers.')
    _map_old = "coparenting:'course-same-team.html'}"
    assert PAGES['certificates.html']['body'].count(_map_old) == 1
    PAGES['certificates.html']['body'] = PAGES['certificates.html']['body'].replace(_map_old, "coparenting:'course-same-team.html', manhood:'course-the-man-before-you.html'}")
else:
    # Flag off: remove any previously generated dark page so the tree never
    # carries a stale artifact (the release checker rightly fails on one).
    _p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'course-the-man-before-you.html')
    if os.path.exists(_p):
        os.remove(_p)


# ================================================== adopted orphans (v4.10.0)
# dashboard.html and recover.html predate the builder and were living outside
# it with stale chrome. Adopted here so every chrome change reaches them.
PAGES['dashboard.html'] = dict(title='Your Dashboard', desc='Your written report, always available, the moment you finish and every time you return.', active='Home', mode='app', body='''
<section class="tight" style="padding-top:36px"><div class="container">

  <div id="dashHead" style="margin-bottom:18px">
    <div class="eyebrow" style="margin-bottom:8px">YOUR DASHBOARD</div>
    <h1 class="d-32" style="margin:0">Welcome<span id="dashNameWrap" style="display:none">, <span id="dashName"></span></span></h1>
    <p class="fine" style="margin-top:6px">Your written report lives here. It appears the moment you finish your profile, and it is here every time you come back.</p>
  </div>

  <div data-journey="" style="margin-bottom:22px"></div>

  <div id="dashBanner" class="card" style="display:none;padding:14px 18px;margin-bottom:18px"></div>

  <div id="dashSwitch" class="card" style="display:none;padding:22px;margin-bottom:22px"></div>

  <div id="dashReport">
    <div class="center" style="padding:80px 0">
      <div class="eyebrow" style="margin-bottom:12px">PREPARING YOUR DASHBOARD</div>
      <p class="ash">One moment.</p>
    </div>
  </div>

  <div id="dashCourses"></div>

  <div id="dashNext"></div>

</div></section>

<script src="assets/js/journey.js"></script>
<script src="assets/js/keystone-data.js"></script>
<script src="assets/js/keystone-full.js"></script>
<script src="assets/js/keystone-manhood-data.js"></script>
<script src="assets/js/assessment-registry.js"></script>
<script src="assets/js/plan-engine.js"></script>
<script src="assets/js/keystone-report.js"></script>
<script src="assets/js/dashboard.js"></script>
''')
PAGES['recover.html'] = dict(title='Rebuild lost results', desc='Your written report, always available, the moment you finish and every time you return.', active='', mode='public', body='''
<section class="tight" style="padding-top:36px"><div class="container">
  <div class="eyebrow" style="margin-bottom:8px">ADMIN &middot; REBUILD</div>
  <h1 class="d-36" style="margin-bottom:8px">Rebuild lost results</h1>
  <p class="lead" style="max-width:62ch;margin-bottom:26px">A sitting can be marked complete without its result being stored. The answers survive, so the result is rebuilt from them using the same scoring engine the live app uses. Nothing is written until you press the button.</p>
  <div id="rcRoot"></div>
</div></section>

<script src="assets/js/keystone-data.js"></script>
<script src="assets/js/keystone-full.js"></script>
<script src="assets/js/keystone-manhood-data.js"></script>
<script src="assets/js/assessment-registry.js"></script>
<script src="assets/js/keystone-report.js"></script>
<script src="assets/js/recover.js"></script>
''')


def _strip_gatherings():
    global FOOT
    def cut(haystack, needle, where):
        n = haystack.count(needle)
        if n != 1:
            raise SystemExit(
                'SHOW_GATHERINGS strip failed: expected 1 occurrence in %s, found %d.\n'
                'The copy changed. Update the anchor in _strip_gatherings().' % (where, n))
        return haystack.replace(needle, '')

    # a. Footer link, present on every generated page.
    FOOT = cut(FOOT, '<li><a href="gatherings.html">Gatherings</a></li>', 'FOOT')

    # b. Home page band.
    home = PAGES['index.html']['body']
    start = home.find('<section><div class="container split">\n  <div>\n    <div class="eyebrow" style="margin-bottom:14px">GATHERINGS</div>')
    if start == -1:
        raise SystemExit('SHOW_GATHERINGS strip failed: home page band not found.')
    end = home.find('</div></section>', start)
    if end == -1:
        raise SystemExit('SHOW_GATHERINGS strip failed: home page band has no closing tag.')
    PAGES['index.html']['body'] = home[:start] + home[end + len('</div></section>'):]

    # c. About page "Convene" bullet.
    PAGES['about.html']['body'] = cut(
        PAGES['about.html']['body'],
        '<div class="check"><span class="checkmark">&check;</span><span><b>Convene.</b> '
        'Gatherings that bring the field into one room.</span></div>',
        "PAGES['about.html']")


if not SHOW_GATHERINGS:
    _strip_gatherings()


def _strip_stories():
    global FOOT
    needle = '<li><a href="stories.html">Stories</a></li>'
    n = FOOT.count(needle)
    if n != 1:
        raise SystemExit(
            'SHOW_STORIES strip failed: expected 1 occurrence in FOOT, found %d.' % n)
    FOOT = FOOT.replace(needle, '')


if not SHOW_STORIES:
    _strip_stories()


def _strip_employers():
    global FOOT, PAGES
    def cut(hay, needle, where):
        n = hay.count(needle)
        if n != 1:
            raise SystemExit(
            'SHOW_EMPLOYERS strip failed: expected 1 occurrence in %s, found %d.' % (where, n))
        return hay.replace(needle, '')
    FOOT = cut(FOOT, '<li><a href="employers.html">Employers</a></li>', 'FOOT')
    b = PAGES['organizations.html']['body']
    b = cut(b, '<a class="fit-card" href="employers.html"><b>Employers</b><span>A benefit men actually use, with proof it worked.</span><i>&rarr;</i></a>', 'organizations fit-card')
    PAGES['organizations.html']['body'] = b
    b = cut(b, ' &nbsp;&middot;&nbsp; <a class="link" href="employers.html" style="color:#C7C2B8">Employers</a>', 'organizations also-built-for')
    PAGES['organizations.html']['body'] = b


if not SHOW_EMPLOYERS:
    _strip_employers()


if __name__ == '__main__':
    out = os.path.dirname(os.path.abspath(__file__))
    if not SHOW_GATHERINGS:
        for dead in GATHERINGS_PAGES:
            dp = os.path.join(out, dead)
            if os.path.exists(dp):
                os.remove(dp)
                print('removed (gatherings dark)', dead)
    if not SHOW_EMPLOYERS:
        for dead in EMPLOYERS_PAGES:
            dp = os.path.join(out, dead)
            if os.path.exists(dp):
                os.remove(dp)
                print('removed (employers dark)', dead)
    if not SHOW_STORIES:
        for dead in STORIES_PAGES:
            dp = os.path.join(out, dead)
            if os.path.exists(dp):
                os.remove(dp)
                print('removed (stories dark)', dead)
    if not SHOW_MILITARY:
        for dead in MILITARY_PAGES:
            dp = os.path.join(out, dead)
            if os.path.exists(dp):
                os.remove(dp)
                print('removed (military dark)', dead)
    for fname, p in PAGES.items():
        if not SHOW_MILITARY and fname in MILITARY_PAGES:
            continue
        if not SHOW_GATHERINGS and fname in GATHERINGS_PAGES:
            continue
        if not SHOW_STORIES and fname in STORIES_PAGES:
            continue
        if not SHOW_EMPLOYERS and fname in EMPLOYERS_PAGES:
            continue
        FORCED_THEME = {'organizations.html': "'light'", 'index.html': "'dark'", 'profile.html': "'dark'", 'stories.html': "'dark'", 'certificates.html': "'dark'", 'enroll.html': "'dark'", 'class.html': "'dark'", 'course.html': "'dark'", 'player.html': "'dark'", 'checkout.html': "'dark'", 'certificate.html': "'dark'", 'voice.html': "'dark'", 'share.html': "'dark'"}
        theme_js = FORCED_THEME.get(fname, 'localStorage.getItem("fc_theme")||"dark"')
        html = HEAD.format(title=p['title'], desc=p['desc'], meta=social_meta(fname, p['title'], p['desc']), THEME=theme_js)
        if p.get('nochrome'):
            html += p['body']
            html += '\n<script src="assets/js/config.js"></script>\n<script src="assets/js/supabase-client.js"></script>\n<script src="assets/js/app.js"></script>\n<script src="assets/js/help.js"></script>\n'
            if fname == 'profile.html':
                html += ('<script src="assets/js/keystone-data.js"></script>\n'
                         '<script src="assets/js/keystone-manhood-data.js"></script>\n'
                         '<script src="assets/js/assessment-registry.js"></script>\n'
                         '<script src="assets/js/keystone-full.js"></script>\n'
                         '<script src="assets/js/keystone-ui.js"></script>\n')
        else:
            html += nav(p.get('active',''), p.get('mode','public'))
            html += p['body']
            html += FOOT
            # Per-page scripts. certificates.html reads the real published course
            # list; hand-adding this tag was lost every time the page regenerated.
            for extra in PAGE_SCRIPTS.get(fname, []):
                html += '<script src="assets/js/%s"></script>\n' % extra
            if p.get('auth'):
                html = html.replace('<body>', '<body data-auth="required">', 1)
        html += '</body>\n</html>\n'
        with open(os.path.join(out, fname), 'w') as f:
            f.write(html)
        print('wrote', fname)
