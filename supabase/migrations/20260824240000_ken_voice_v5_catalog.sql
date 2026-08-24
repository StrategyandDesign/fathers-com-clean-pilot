-- Lock Ken-voice v5 father-facing copy to match live Pilot.
-- Updates description, leader_summary, Calm session 1 title, and session 1 checkin_prompt by slug.
-- Does not change published, released_at, or development_status.
-- Idempotent: re-run updates the same columns in place by slug / session_number.

update public.trainings as trainings
set
  description = catalog.description,
  leader_summary = catalog.leader_summary
from (
  values
  (
    'fundamentals',
    E'A father does not become effective by collecting ideas. He becomes effective in the ordinary hours, when a child learns whether this man can be counted on. Ken Canfield sat with thousands of fathers and watched that question get answered in kitchens and doorways, not in lectures. The Seven Secrets of Effective Fathers came from those lives: commitment, knowing your child, consistency, protecting and providing, affirming love, loving discipline, and a living example of integrity and faith.\n\nThis course takes those secrets one at a time. You begin with an honest look at where you stand. Then you keep a promise you can actually keep, learn this child''s world instead of the one you remember, show up in a way the house can trust, speak a specific word of encouragement, and correct without breaking the bond. The child meets a man who is there, who notices this child today, who comes back the same way, and who leaves the relationship intact.\n\nNine sessions. A short teaching, a brief checkpoint, and one practice you can use the same night. The work stays between you and the house.',
    E'Walk him through one secret at a time, used at home the same night. Watch for a kept promise, a truer picture of this child, and a correction that leaves the relationship intact. If the secrets turn into a lecture or a comparison among children, bring him back to one practiced move.'
  ),
  (
    'anger',
    E'The people nearest you feel your heat first. A child especially. Anger is not the enemy. An untrained surge is, because the body often fires before thought, and what happens in those few seconds becomes the atmosphere of the house.\n\nThis course gives you those seconds back. You learn the earliest signal, take a quiet pause, stand the body down, and come back as someone the house can remain near. When you snap, you own it the same day in a short, specific apology. Sleep, food, and ordinary movement belong here. They hold the man who has to hold the room. Catch the surge in the jaw. Keep the pause. Walk back in on time. Repair without reloading the fight.\n\nYou can finish every week even when you cannot sit with your child. The paper is enough.',
    E'Help him notice the surge before it becomes a shout, take the pause, and repair the same day. Success looks like catching it in the body, stepping away and coming back on time, and a short apology that names the snap. If steadiness turns into advice he gives others and never uses, or into talk about diagnosis, bring him back to his own next hour. Completion never requires child contact.'
  ),
  (
    'reentry',
    E'A man can do his work away from home and still walk through the door carrying the body that kept him there. The people inside did not live that stretch with him. The child he meets may not be the child he left.\n\nComing home present is a season, not a night to be graded. You give old alarms a home meaning. You keep a few promises the house can trust. You choose frequent small deposits over one intense reunion. When something breaks, you repair the same day and keep it short. If a child pulls away, that is a beginning, not a verdict. Stay aware of the body you bring home and the child in front of you. Stay consistent in a few promises. Go first.\n\nContact helps when it is recent, frequent, and good. When visits are not allowed, the week still completes on paper.',
    E'Stay with the body at the door, the child who grew, and a season of return rather than a first-night score. Watch for a few kept promises, frequent small deposits, and same-day repair. If the week becomes a reunion script or a story about where he was, bring him back to the child in front of him. Paper completes when contact is not allowed.'
  ),
  (
    'calm-you-can-lend',
    E'A father can come back from a hard stretch still carrying the body that kept him going. The people inside should not have to receive that leftover load at the door.\n\nCalm You Can Lend is the come-down before you speak. Same short ritual every return. Then a calmer voice, nearer presence, and correction that waits until you are actually home. Over twelve weeks the door itself changes. A child can settle near you. If you snap, you close it the same day. Notice when you are still high. Keep the ritual. Stay in the room once you are down, so the calm is something someone else can use.',
    E'Watch the door. The course owns a short come-down and a calm he lends outward, not a tip he repeats for other men. Success looks like the same ritual every return, soft presence with the child and with whoever is inside when they are present, and same-day repair after a snap. Sponsorship funds the organization, not a preferred seat.'
  ),
  (
    'the-house-that-kept-going',
    E'While you are away, a house often keeps running. Someone carries the routines: a co-parent, kin, a program, or the child. The wound opens when you walk in and rewrite the rules as if nothing happened without you.\n\nSee that load in plain words. Thank it once, without a speech. Join what already works. Ask before you change a rule. Take one real task the house names and finish it. Trust comes later than you want, through small kept promises and same-day repair. Notice who carried what. Finish the asked load. Keep the small promise. Watch your tone when you reenter.',
    E'He is joining a house that ran without him. The carrier may be a co-parent, kin, a program, or the child. Watch for an ask before any rule change, one joined rhythm, and trust treated as something that lags. If gratitude becomes a cover for taking the wheel again, bring him back to one named load. Sponsorship funds the organization, not a preferred seat.'
  ),
  (
    'knowing-again',
    E'Children change while you are gone. Interests, fears, friends, and the way they want you all move. Yesterday''s picture of them will miss them, because knowing is never finished when a man has been away.\n\nKnowing Again is meeting the child in front of you. You update the picture. You ask before you assume. You offer presence that fits who they are now. Small matching deposits beat a make-up weekend. Hesitation is information, not a verdict on your worth. Another caregiver may help you see what changed. They are an ally when they are part of the week, never a required messenger. Stay current on who this child is today, and meet coolness without forcing a reunion.\n\nIf you cannot sit with your child, the week still completes on paper.',
    E'He is learning this child again, not recovering a former version. Watch for an updated picture, an ask before an assumption, and presence that is not a talent review. If the week becomes a growth dashboard or a forced reunion, bring him back to one matching deposit. This stays a Super-admin draft, unpublished and unreleased. Sponsorship funds the organization, not a preferred seat.'
  )
) as catalog(slug, description, leader_summary)
where trainings.slug = catalog.slug
  and trainings.slug in ('fundamentals', 'anger', 'reentry', 'calm-you-can-lend', 'the-house-that-kept-going', 'knowing-again');

update public.sessions as sessions
set
  title = coalesce(catalog.title, sessions.title),
  checkin_prompt = catalog.checkin_prompt
from (
  values
  (
    'fundamentals',
    1,
    null::text,
    E'After this first film, write one short thing you learned, in your own words. What is one secret you want to try the same night?\n\nA) Commitment: keep a promise I can actually keep tonight\nB) Knowing this child: learn one thing about their world today\nC) Consistency: show up the same way at a time the house can trust'
  ),
  (
    'anger',
    1,
    null::text,
    E'What is the first body signal you notice when heat rises? Name it in a few words.\n\nA) Jaw, fists, or a tight chest\nB) Heat in the face, or a short breath\nC) The urge to fix the room before I speak'
  ),
  (
    'reentry',
    1,
    null::text,
    E'What is one thing your body still does when you walk through the door? Name it.\n\nA) I scan the rooms before I greet anyone\nB) My jaw or shoulders stay set from the stretch\nC) I want to take over the first five minutes'
  ),
  (
    'calm-you-can-lend',
    1,
    'Before You Speak',
    E'What is the first body signal you notice before you speak? Name it.\n\nA) Tight jaw, shallow breath, or a scan of every room\nB) The urge to fix something or quiet the house fast\nC) I usually do not notice anything until someone reacts to me'
  ),
  (
    'the-house-that-kept-going',
    1,
    null::text,
    E'Who kept one routine going while you were away, and what was that routine?\n\nA) A co-parent or kin kept a meal, bedtime, or school rhythm\nB) A program or the child kept a rule or a check-in in place\nC) I am still learning who carried which load'
  ),
  (
    'knowing-again',
    1,
    null::text,
    E'What is one thing about this child that may have changed while you were gone? Name it.\n\nA) An interest, a friend, or a fear that is new to me\nB) How they want me when I walk in\nC) I am not sure yet; I will ask before I assume'
  )
) as catalog(slug, session_number, title, checkin_prompt)
join public.trainings as trainings
  on trainings.slug = catalog.slug
where sessions.training_id = trainings.id
  and sessions.session_number = catalog.session_number;
