-- Update stored overview paragraphs for ten trainings by slug.
-- Does not change titles, published, released_at, sessions, videos, or development_status.
-- Idempotent: re-run updates description and leader_summary in place by slug.
-- Does not touch test or flourishingfaith.
-- Return-home three (calm-you-can-lend, the-house-that-kept-going, knowing-again)
-- have no TypeScript seed. This UPDATE is the repo source for those paragraphs.

update public.trainings as trainings
set
  description = catalog.description,
  leader_summary = catalog.leader_summary
from (
  values
  (
    'fundamentals',
    E'A father does not become effective by collecting ideas. He becomes effective in the ordinary hours, when a child learns whether this man can be counted on. Ken Canfield sat with thousands of fathers and watched that question get answered in kitchens and doorways, not in lectures. The Seven Secrets of Effective Fathers came from those lives: commitment, knowing your child, consistency, protecting and providing, affirming love, loving discipline, and a living example of integrity and faith.\n\nThis course takes those secrets one at a time. You begin with an honest look at where you stand. Then you keep a promise you can actually keep, learn this child''s world instead of the one you remember, show up in a way the house can trust, speak a specific word of encouragement, and correct without breaking the bond. That is involvement you can count, awareness of this child today, consistency the house can feel, and nurturance that leaves the relationship intact.\n\nNine sessions. A short teaching, a brief checkpoint, and one practice you can use the same night. No scoreboard, and no need to perform the work in public.',
    E'Walk him through one secret at a time, used at home the same night. Watch for a kept promise, a truer picture of this child, and a correction that leaves the relationship intact. If the secrets turn into a lecture or a comparison among children, bring him back to one practiced move.'
  ),
  (
    'anger',
    E'The people nearest you feel your heat first. A child especially. Anger is not the enemy. An untrained surge is, because the body often fires before thought, and what happens in those few seconds becomes the atmosphere of the house.\n\nThis course gives you those seconds back. You learn the earliest signal, take a quiet pause, stand the body down, and come back as someone the house can remain near. When you snap, you own it the same day in a short, specific apology. Sleep, food, and ordinary movement belong here. They hold the man who has to hold the room. Catching the jaw is awareness. Keeping the pause is consistency. Walking back in on time, and repairing without reloading the fight, is how involvement and nurturance look in a hot hour.\n\nYou can finish every week even when you cannot sit with your child. The paper is enough.',
    E'Help him notice the surge before it becomes a shout, take the pause, and repair the same day. Success looks like catching it in the body, stepping away and coming back on time, and a short apology that names the snap. If steadiness turns into advice he gives others and never uses, or into talk about diagnosis, bring him back to his own next hour. Completion never requires child contact.'
  ),
  (
    'reentry',
    E'A man can do his work away from home and still walk through the door carrying the body that kept him there. The people inside did not live that stretch with him. The child he meets may not be the child he left.\n\nComing home present is a season, not a night to be graded. You give old alarms a home meaning. You keep a few promises the house can trust. You choose frequent small deposits over one intense reunion. When something breaks, you repair the same day and keep it short. If a child pulls away, that is a beginning, not a verdict. Stay aware of the body you bring home and the child in front of you. Stay consistent in a few promises. Go first.\n\nContact helps when it is recent, frequent, and good. When visits are not allowed, the week still completes on paper.',
    E'Stay with the body at the door, the child who grew, and a season of return rather than a first-night score. Watch for a few kept promises, frequent small deposits, and same-day repair. If the week becomes a reunion script or a story about where he was, bring him back to the child in front of him. Paper completes when contact is not allowed.'
  ),
  (
    'calm-you-can-lend',
    E'A father can come back from a hard stretch still carrying the body that kept him going. The people inside should not have to receive that leftover load at the door.\n\nCalm You Can Lend is the come-down before you speak. Same short ritual every return. Then a calmer voice, nearer presence, and correction that waits until you are actually home. Over twelve weeks the door itself changes. A child can settle near you. If you snap, you close it the same day. Notice when you are still high. Keep the ritual. Stay in the room once you are down, so the calm is something someone else can use.\n\nThis draft stays unpublished.',
    E'Watch the door. The course owns a short come-down and a calm he lends outward, not a tip he repeats for other men. Success looks like the same ritual every return, soft presence with the child and with whoever is inside when they are present, and same-day repair after a snap. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.'
  ),
  (
    'the-house-that-kept-going',
    E'While you are away, a house often keeps running. Someone carries the routines: a co-parent, kin, a program, or the child. The wound opens when you walk in and rewrite the rules as if nothing happened without you.\n\nSee that load in plain words. Thank it once, without a speech. Join what already works. Ask before you change a rule. Take one real task the house names and finish it. Trust comes later than you want, through small kept promises and same-day repair. Notice who carried what. Finish the asked load. Keep the small promise. Watch your tone when you reenter. No one here is assumed to be a mother or a partner.\n\nThis draft stays unpublished.',
    E'He is joining a house that ran without him. The carrier may be a co-parent, kin, a program, or the child. Watch for an ask before any rule change, one joined rhythm, and trust treated as something that lags. If gratitude becomes a cover for taking the wheel again, bring him back to one named load. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.'
  ),
  (
    'knowing-again',
    E'Children change while you are gone. Interests, fears, friends, and the way they want you all move. Yesterday''s picture of them will miss them, because knowing is never finished when a man has been away.\n\nKnowing Again is meeting the child in front of you. You update the picture. You ask before you assume. You offer presence that fits who they are now. Small matching deposits beat a make-up weekend. Hesitation is information, not a verdict on your worth. Another caregiver may help you see what changed. They are an ally when they are part of the week, never a required messenger. Stay current on who this child is today, and meet coolness without forcing a reunion.\n\nIf you cannot sit with your child, the week still completes on paper.\n\nThis draft stays unpublished.',
    E'He is learning this child again, not recovering a former version. Watch for an updated picture, an ask before an assumption, and presence that is not a talent review. If the week becomes a growth dashboard or a forced reunion, bring him back to one matching deposit. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.'
  ),
  (
    'after-action-at-the-door',
    E'A day can go wrong in a doorway, a kitchen, a car. The miss is already done. The fathering is the next honest hour: you name what happened, you own the part that is yours, and you close it the same day with the person who was there. Then you put the clipboard down.\n\nThis is not a household review board. Ten minutes is enough. The child who overheard it needs a short, age-fit close. So does the other adult, when they were hit too. See the miss without spin, walk across the room, and close it before you sleep. How the repair lands matters more than how well you score yourself afterward. If the repair becomes a story you could tell for status, it failed the people at your table.\n\nThis draft stays unpublished.',
    E'Named, owned, closed, same day, then forgotten as a brand. Watch for forum anecdotes, long speeches, and pride dressed as patience. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.'
  ),
  (
    'direct-hours',
    E'A child does not need another dashboard. They need hours of care the firm cannot have. Direct Hours is a constraint, not a target: one device-down block each weekday you are in town, and one longer block on the weekend.\n\nThe phone leaves the room. Errands with a screen nearby do not count. Travel weeks do not get a pretend win. You restore the first block the day you return. Show up in the window you named. Know what is actually care. Keep the weekday and the weekend. Give attention the child can feel, without scanning their face for payoff. If you are winning Direct Hours in a chat, stop.\n\nThis draft stays unpublished.',
    E'Hours of care, not a target. Watch for streaks, hour goals, and virtue speeches about boundaries. A good week is quiet windows the child can count on. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.'
  ),
  (
    'unscored-child',
    E'Almost every hour in a child''s week already has a score. This course protects one that does not. You sit with this child and produce nothing you can report. No lesson, no sport framed as development, no college signal.\n\nKen''s work on knowing your child lives here as a weekly hour. Who they are now. What they are into. What frightens them. What is coming. You listen longer than you talk. Moods are something you sit with, not something you fix. Be there. Stay with the child in the present tense. Keep the hour. Extract no return. If the hour yields insight you could pitch on Monday, it failed.\n\nThis draft stays unpublished.',
    E'One unscored hour a week. Watch for extraction and insight he wants to report. A good week is the hour kept and the emptiness protected. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.'
  ),
  (
    'midcourse-correction',
    E'You do not stop the ship to become a better father. You make a small turn while it is still moving. Midcourse correction is one countable act a week that means nothing to the firm and cannot be reported as leadership development.\n\nPick it before Sunday ends. Do it once, plainly. Do not announce it. Hot weeks move the act earlier, not later. Stay midcourse: a small turn toward home, counted quietly, never dressed as leadership. If it could go in a forum update, pick a different act.\n\nThis draft stays unpublished.',
    E'One unreportable act a week, done once, not announced. Watch for reinvention speeches and fathering told as leadership. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.'
  )
) as catalog(slug, description, leader_summary)
where trainings.slug = catalog.slug
  and trainings.slug in ('fundamentals', 'anger', 'reentry', 'calm-you-can-lend', 'the-house-that-kept-going', 'knowing-again', 'after-action-at-the-door', 'direct-hours', 'unscored-child', 'midcourse-correction');
