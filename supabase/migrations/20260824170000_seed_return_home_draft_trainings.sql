-- Seed three Super-admin return-home I CAN draft trainings.
-- Unpublished and unreleased. Films are Micah's hold placeholder.
-- Idempotent: re-run updates catalog rows in place by slug / session_number.
-- Keep these rows unpublished. Do not call release RPCs.

insert into public.trainings (
  slug,
  title,
  description,
  leader_summary,
  session_count,
  order_index,
  published,
  released_at,
  development_status
)
values
  (
    'calm-you-can-lend',
    'Calm You Can Lend',
    'Come down from the stretch. Then let the people inside borrow your steadiness.',
    'When you walk in after a hard stretch away, your body may still be high. This course trains you to notice that as a body signal, come down at the door, and lend calm to the people who live there when they are present. Children borrow the adult''s nervous system. Other caregivers in the house may borrow it on a loaded day too, when they are there. Ken Canfield''s I CAN spine holds the work: Awareness of the surge, Consistency of a return ritual, Involvement in staying present once you are down, and Nurturance in the calm you offer. Each week is a short film, one checkpoint, and one lived practice. Education for steadiness at home. Not treatment. Not a diagnosis path. Super-admin draft. Not published. Not released. Kill the week if come-down becomes a peer tip he never uses at his own door, or if body language becomes diagnosis theater. Sponsorship funds the organization, not a preferred seat.',
    12,
    14,
    false,
    null,
    'in_development'
  ),
  (
    'the-house-that-kept-going',
    'The House That Kept Going',
    'Honor what kept going. Join the house that already works. Rebuild trust without taking the wheel.',
    'While you were gone, the house kept going. Someone kept routines: a co-parent, kin, a program, or the child. See that load, thank it without theater, join what already works. No second cockpit. Ken I CAN: Awareness of what already kept going, Involvement in one real load the house names, Consistency of follow-through, Nurturance in how you reenter. Education for joining a running house. Not therapy. Super-admin draft. Not published. Not released. Kill the week if whoever kept the house becomes a COO, or if gratitude covers taking the wheel again. No spouse-or-mother default. Sponsorship funds the organization, not a preferred seat.',
    12,
    15,
    false,
    null,
    'in_development'
  ),
  (
    'knowing-again',
    'Knowing Again',
    'Meet the child who grew while you were gone. Countable presence that matches who they are now.',
    'Children change across a stretch away. Update the picture after every return, ask before you assume, countable presence that fits who they are now. Optional caregivers as allies only. Ken I CAN: Awareness of who they are now, Involvement in small deposits that match, Consistency of showing up after the next stretch, Nurturance when meeting hesitation without forcing a reunion script. Education for knowing your child again. Not a talent review. Super-admin draft. Not published. Not released. Kill the week if the child profile becomes a talent review or growth dashboard. No spouse-or-mother default. Sponsorship funds the organization, not a preferred seat.',
    12,
    16,
    false,
    null,
    'in_development'
  )
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  leader_summary = excluded.leader_summary,
  session_count = excluded.session_count,
  order_index = excluded.order_index,
  published = false,
  released_at = null,
  first_published_at = null,
  first_released_at = null,
  released_by = null,
  development_status = 'in_development';

with catalog (
  training_slug,
  session_number,
  title,
  keyline,
  video_url,
  duration_seconds,
  checkin_prompt,
  action_prompt
) as (
  values
    (
      'calm-you-can-lend',
      1,
      'Body at the door',
      'Your body arrives before your words do.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness name first at the door, according to this session?\nA) A speech about the stretch, so the house understands why you are still high\nB) The body signal that arrived before your words\nC) Whether anyone inside looks ready for you to speak',
      E'Which lived practice matches this session?\nA) Walk in talking so the house knows you made it\nB) Name one body signal silently before you speak, then enter\nC) Ask the first person you see to rate how tense you look'
    ),
    (
      'calm-you-can-lend',
      2,
      'Come down',
      'Same short come-down every return. Not a performance.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency does this session lock at the door?\nA) A new come-down each return, so it stays honest\nB) The same short come-down every return, not a performance\nC) A come-down only when someone inside is watching',
      E'Which practice keeps the come-down as taught here?\nA) Greet first, then settle later if the house is loud\nB) Run the same short four-beat come-down before you engage the house\nC) Skip the ritual when the stretch was short'
    ),
    (
      'calm-you-can-lend',
      3,
      'Home noise with new meaning',
      'Kid noise is not a threat signal. It is home.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with kid noise after a stretch away?\nA) Treat it as the same threat signal you scanned for while away\nB) Hear it as home, not as a threat signal\nC) Ask the house to stay quiet until you finish coming down',
      E'Which action gives home noise new meaning?\nA) Correct the first loud sound so the room drops to work-quiet\nB) Stay with one noisy or messy cue and silently rename it as home\nC) Leave until the house is silent'
    ),
    (
      'calm-you-can-lend',
      4,
      'Lend calm to child',
      'Children borrow the adult''s nervous system. Lend one they can use.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Nurturance does the child borrow in this session?\nA) A speech about why you were gone\nB) Your come-down calm, offered so they have a nervous system they can use\nC) A plan for how they should feel about the return',
      E'Which lived practice lends calm a child can borrow?\nA) Tell the child to calm down so you can settle\nB) After you come down, give five unhurried minutes they can borrow\nC) Hand them a task so the energy has somewhere to go'
    ),
    (
      'calm-you-can-lend',
      5,
      'Lend calm to whoever is inside',
      'Whoever is inside on a loaded day may need to borrow you too.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'Who does Nurturance lend calm to in this session?\nA) Only the child, because other adults should already be steady\nB) Whoever is inside on a loaded day, without assuming who\nC) Only one assumed adult role, if that person is present',
      E'Which action lends calm without assuming who is inside?\nA) Wait to offer calm until you know which adult is home\nB) After you come down, lend steady presence to whoever is there, or rehearse if the house is empty\nC) Ask who is in charge so you know where to put the calm'
    ),
    (
      'calm-you-can-lend',
      6,
      'Snap and same-day repair',
      'When you snap after a stretch, same-day repair beats a better speech later.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness choose after a snap that came from leftover load?\nA) A better speech later, once you have the right words\nB) Same-day repair with the person who felt it\nC) An explanation of the stretch so the snap makes sense',
      E'Which practice closes a snap as taught here?\nA) Park the snap for a longer talk when the week is lighter\nB) Close it the same day with the person who felt it, in two plain sentences\nC) Ask them to forget it because you were still coming down'
    ),
    (
      'calm-you-can-lend',
      7,
      'Borrowed calm under kid heat',
      'Kid heat is when they need to borrow you most.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Nurturance holds when the child runs hot?\nA) Match their heat so they know you are with them\nB) Lend calm then. That is when they need to borrow you most.\nC) Leave until they are easy again',
      E'Which action stays lendable under kid heat?\nA) Raise your voice so the heat ends faster\nB) Lower your voice, stay near, and do not match the spike\nC) Send them to another room until you feel ready'
    ),
    (
      'calm-you-can-lend',
      8,
      'Protect boring hours',
      'Boring hours after you come down rebuild more than a big reunion night.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency rebuilds more than a big reunion night?\nA) A special night that makes up for the time gone\nB) A boring hour after you come down, kept ordinary\nC) A speech about how you will be different now',
      E'Which practice protects a boring hour?\nA) Fill the first evening with an outing so the return feels special\nB) Keep one ordinary hour after the come-down and do not upgrade it\nC) Skip the quiet hour if the house already looks fine'
    ),
    (
      'calm-you-can-lend',
      9,
      'When pride wants to stay high',
      'Pride wants to stay high. The door still asks you to come down.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness refuse when pride wants to stay high?\nA) The door ritual, because staying high proves you can handle the house\nB) Pride that says skip the come-down. The door still asks you to come down.\nC) Any ritual, because pride means you already arrived well',
      E'Which action beats pride that wants to stay high?\nA) Enter still high and call it being sharp for the house\nB) Run the come-down anyway, even when pride says you are fine\nC) Ask a peer if staying high looks stronger'
    ),
    (
      'calm-you-can-lend',
      10,
      'Lagging warmth',
      'Warmth may lag. Do not score the hug.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with lagging warmth after you lend calm?\nA) Wait for a smile or hug before you count the ritual\nB) Leave the warmth later. Do not score the hug.\nC) Ask if it worked so you know whether to keep the ritual',
      E'Which practice drops the score for 48 hours?\nA) Check faces to see if the calm paid off\nB) Take no temperature. Live the next ordinary steps.\nC) Ask the house to show more warmth so the week counts'
    ),
    (
      'calm-you-can-lend',
      11,
      'A countable week of come-downs',
      'Countable means you can name the come-downs. It does not mean you publish them.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What makes a week countable in this course?\nA) A published streak or a peer story about the ritual\nB) Come-downs you can name. Not a count you publish.\nC) Credit for effort, even when the door ritual was skipped',
      E'Which practice finishes a countable week of come-downs?\nA) Share the tally so the week has a witness\nB) Keep a private count of kept come-downs, then destroy the list\nC) Skip a return if you already talked about the method'
    ),
    (
      'calm-you-can-lend',
      12,
      'Keep the ritual without scoring it',
      'Keep the come-down. Drop the scoreboard.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency keeps, and what does it drop?\nA) The scoreboard, so you can prove the week worked\nB) The come-down. Drop the scoreboard.\nC) A peer tip you can pass along, even if you skip your own door',
      E'Which lived practice keeps the ritual without scoring it?\nA) Tally come-downs so you have a number for later\nB) Keep the standing door rule this week and do not score or share it\nC) Teach the method this week and use it later when you have time'
    ),
    (
      'the-house-that-kept-going',
      1,
      'The house kept going',
      'While you were gone, the house kept going.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness name first in this session?\nA) How much the house suffered without your system\nB) While you were gone, the house kept going\nC) Which person failed to keep the house at your standard',
      E'Which lived practice matches this session?\nA) Walk in ready to restore the way you ran things\nB) Say one plain sentence: while you were gone, the house kept going\nC) Ask who dropped the ball so you know where to start'
    ),
    (
      'the-house-that-kept-going',
      2,
      'See the load',
      'See the load in plain words. Whoever carried it.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with the load that kept the house going?\nA) Turn it into a title for whoever stayed, like an operator role\nB) See it in plain words, whoever carried it, without a default person\nC) Assume one default adult carried it, then thank that person',
      E'Which action sees the load as taught here?\nA) Guess the load from your old picture of the house\nB) Name one real load in plain words, as the house actually ran\nC) Skip naming the load so you can start fresh'
    ),
    (
      'the-house-that-kept-going',
      3,
      'Thank without theater',
      'Thank without making it a speech.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Nurturance does this session ask?\nA) A public speech so the load is finally seen\nB) A plain thank-you, without theater\nC) A thank-you that also explains how you will take over now',
      E'Which practice thanks without theater?\nA) Give a long tribute so the week has a moment\nB) Say a short thank-you to whoever kept a named routine, then stop\nC) Post the gratitude so others can see you noticed'
    ),
    (
      'the-house-that-kept-going',
      4,
      'Ask before you change a rule',
      'Ask before you change a rule.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Involvement do before a rule changes?\nA) Change it on day one so the house feels you are back\nB) Ask the people who kept the house before you change a rule\nC) Change it quietly and explain later if anyone objects',
      E'Which action asks before you change a rule?\nA) Swap one rule tonight so the return has a mark\nB) Ask first. Leave the running rule in place until they answer.\nC) Announce the new rule and invite comments after it starts'
    ),
    (
      'the-house-that-kept-going',
      5,
      'Join the system that already works',
      'Join what already works.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Involvement move does this session lock?\nA) Build a better system beside the one that ran while you were gone\nB) Join the system that already works\nC) Watch for a week, then install your own plan',
      E'Which lived practice joins what already works?\nA) Start a parallel routine so you have your own cockpit\nB) Step into one existing routine and keep it the way it already runs\nC) Rewrite the week so it matches how you work on the road'
    ),
    (
      'the-house-that-kept-going',
      6,
      'One load the house names',
      'Take one load the house names. Do it fully.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'Which load does Involvement take this week?\nA) The load you think they needed most\nB) One load the house names, done fully\nC) Every load, so you catch up faster',
      E'Which practice takes one named load fully?\nA) Pick three loads and do a piece of each\nB) Take the one load they name and finish it without handing it back\nC) Offer to oversee the loads and assign them out'
    ),
    (
      'the-house-that-kept-going',
      7,
      'No second cockpit',
      'Do not install a second cockpit.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency refuses in this session?\nA) Joining a routine you did not design\nB) A second cockpit beside the house that already runs\nC) Asking before you add a new track',
      E'Which action keeps a second cockpit out?\nA) Add your own tracking so both systems can compare\nB) Keep one running system. Do not stand up a second one.\nC) Run your version on weekends and theirs on weekdays'
    ),
    (
      'the-house-that-kept-going',
      8,
      'When you snap at the system',
      'Snapping at the system is information.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with a snap at the running house?\nA) Treat it as proof the house needs your system back\nB) Treat it as information. The snap is yours to read.\nC) Ignore it so you do not have to name it',
      E'Which practice uses the snap as information?\nA) Use the snap to justify changing a rule tonight\nB) Name the snap as yours, then return to the running system\nC) Ask the house to defend how they ran things'
    ),
    (
      'the-house-that-kept-going',
      9,
      'Same-day repair with whoever was there',
      'Repair same day with whoever was there.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'Where does Nurturance close a miss in this session?\nA) With whoever you assume kept the house, even if they were not there\nB) Same day, with whoever was actually there\nC) In a later speech once you have the right words',
      E'Which action repairs with whoever was there?\nA) Wait to see who usually carries the house, then repair with that person\nB) Close it the same day with the person who was present\nC) Repair only with the child and skip the adult who heard it'
    ),
    (
      'the-house-that-kept-going',
      10,
      'The child saw the override',
      'The child saw the override.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Nurturance notice if you override the running house?\nA) Only the adult reaction, because children miss the power move\nB) The child saw the override, even if they said nothing\nC) The override only counts if someone complains',
      E'Which practice includes the child who saw the override?\nA) Protect the child by never naming what they saw\nB) If a child saw you take the wheel, close a short repair with that child too\nC) Ask the child to rate the override so you can track trust'
    ),
    (
      'the-house-that-kept-going',
      11,
      'Lagging trust',
      'Trust lags. Keep small promises.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with lagging trust this week?\nA) Push for a reunion talk so trust catches up\nB) Leave trust later. Keep small promises now.\nC) Score how trusted you feel so you know if joining is working',
      E'Which action keeps small promises while trust lags?\nA) Ask the house to trust you faster because you thanked them\nB) Keep one small named promise today. Do not demand the feeling.\nC) Take the wheel again so the house sees you are useful'
    ),
    (
      'the-house-that-kept-going',
      12,
      'A countable week of joining',
      'Join for a week. Do not take over.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency closes this course?\nA) A week of taking over so the house can rest\nB) A week of joining the running house, without taking the wheel\nC) A new ops plan you leave behind when you go again',
      E'Which practice finishes a countable week of joining?\nA) End the week by installing your preferred system\nB) Join for the week. Do not take over. Drop any scorecard.\nC) Summarize the house as a team you now lead'
    ),
    (
      'knowing-again',
      1,
      'The child who grew',
      'Meet the child who grew.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'Who does Awareness meet after a stretch away?\nA) The child you remember from before you left\nB) The child who grew while you were gone\nC) The child you hope they became',
      E'Which lived practice meets the child who grew?\nA) Start from your old picture and see what still fits\nB) Meet this child as they are now, without the old script\nC) Tell them who they were so they can help you catch up'
    ),
    (
      'knowing-again',
      2,
      'Update the picture',
      'Update the picture. Drop the old one.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with the old picture?\nA) Keep it as the base and add notes\nB) Update it. Drop the old one.\nC) File both pictures so you can compare later',
      E'Which action updates the picture as taught here?\nA) Hold the old picture until you have enough new data\nB) Drop one old assumption today and look again\nC) Build a profile so the next return is faster'
    ),
    (
      'knowing-again',
      3,
      'Ask before you assume',
      'Ask before you assume.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Involvement move does this session lock?\nA) Assume from the last stretch, then confirm if you have time\nB) Ask before you assume\nC) Ask a required messenger so you do not have to ask the child',
      E'Which practice asks before you assume?\nA) Fill in the blank from memory, then play\nB) Ask one question about their life now and follow the answer\nC) Wait for another adult to brief you before you speak to the child'
    ),
    (
      'knowing-again',
      4,
      'Hesitation is information',
      'Hesitation is information, not rejection.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'How does Nurturance read hesitation in this session?\nA) As rejection you should push through with a reunion script\nB) As information, not rejection\nC) As a mood to fix before the hour ends',
      E'Which action treats hesitation as information?\nA) Press for a hug so the return looks complete\nB) Stay. Notice the hesitation. Do not force a reunion.\nC) Leave and come back only when they look ready'
    ),
    (
      'knowing-again',
      5,
      'Small deposits that fit',
      'One small deposit that fits today''s child.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Involvement deposit does this session ask?\nA) A large make-up gesture that covers the stretch away\nB) One small deposit that fits today''s child\nC) A deposit that could also look good on a talent list',
      E'Which lived practice is a small deposit that fits?\nA) Buy something bigger than last time so they feel the return\nB) Give one small, fitting presence they can use today\nC) Plan a showcase so the deposit has a result'
    ),
    (
      'knowing-again',
      6,
      'Frequency after cycles',
      'Frequency beats a make-up weekend.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency beats a make-up weekend?\nA) One large weekend that pays the stretch back\nB) Frequency. Show up again after the next stretch.\nC) A message that explains why the next stretch will be shorter',
      E'Which practice chooses frequency over a make-up weekend?\nA) Stack one big weekend and call the cycle closed\nB) Name the next kept time and keep it, even if it is small\nC) Wait for a free weekend that can make up the missed days'
    ),
    (
      'knowing-again',
      7,
      'Presence before providing',
      'Presence before providing.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Involvement put first in this session?\nA) A provision that proves you thought of them while away\nB) Presence, before providing\nC) A plan for what they should want next',
      E'Which action puts presence before providing?\nA) Hand over the gift first so the return has a mark\nB) Be in their world first. Let provision wait.\nC) Ask what they want so you can provide before you sit down'
    ),
    (
      'knowing-again',
      8,
      'When you missed a milestone',
      'Name the missed milestone without extracting a resume.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'How does Awareness name a missed milestone?\nA) Ask them to walk you through every win so you can catch up\nB) Name it plainly. Do not extract a resume.\nC) Skip it so you do not make the miss heavier',
      E'Which practice names the miss without a resume?\nA) Have them list what you missed so you can file it\nB) Say you missed that milestone, then stop extracting\nC) Turn the miss into a growth note you can keep'
    ),
    (
      'knowing-again',
      9,
      'Soft repair with the child',
      'Soft repair. No forced reunion.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Nurturance does a soft repair refuse?\nA) Naming the miss at all\nB) A forced reunion script\nC) Staying if the child hesitates',
      E'Which action is a soft repair?\nA) Push the reunion until they play along\nB) Offer a short, unforced repair and let them set the pace\nC) Ask another adult to make the child come to you'
    ),
    (
      'knowing-again',
      10,
      'Optional ally in knowing',
      'An ally may help you see. They are not required.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'How does Awareness treat another caregiver in this session?\nA) As a required messenger you must wait on\nB) As an optional ally who may help you see, not a required one\nC) As a required default adult who should brief you',
      E'Which practice keeps the ally optional?\nA) Refuse to ask the child until another adult reports\nB) If an ally is part of the week, you may ask. You still meet the child yourself.\nC) Assume one default adult will translate the child for you'
    ),
    (
      'knowing-again',
      11,
      'Lagging closeness',
      'Closeness lags. Keep showing up.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with lagging closeness?\nA) Wait to show up until closeness returns\nB) Leave closeness later. Keep showing up now.\nC) Score closeness so you know if knowing-again is working',
      E'Which action keeps showing up while closeness lags?\nA) Ask the child to act closer so the week counts\nB) Show up again today without demanding the feeling\nC) Pause until the child initiates'
    ),
    (
      'knowing-again',
      12,
      'A countable week of knowing again',
      'Know again for a week. Then destroy the list.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency closes this course?\nA) A kept profile you can reuse on the next return\nB) A week of knowing again, then destroy the list\nC) A talent review so the next stretch has a baseline',
      E'Which practice finishes a countable week of knowing again?\nA) Save the notes as a growth dashboard\nB) Know them this week, then destroy the list\nC) Share the profile with a room so the work is visible'
    )
)
insert into public.sessions (
  training_id,
  session_number,
  title,
  keyline,
  video_url,
  order_index,
  duration_seconds,
  checkin_prompt,
  action_prompt
)
select
  trainings.id,
  catalog.session_number,
  catalog.title,
  catalog.keyline,
  catalog.video_url,
  catalog.session_number,
  catalog.duration_seconds,
  catalog.checkin_prompt,
  catalog.action_prompt
from catalog
join public.trainings on trainings.slug = catalog.training_slug
on conflict (training_id, session_number) do update
set
  title = excluded.title,
  keyline = excluded.keyline,
  video_url = excluded.video_url,
  order_index = excluded.order_index,
  duration_seconds = excluded.duration_seconds,
  checkin_prompt = excluded.checkin_prompt,
  action_prompt = excluded.action_prompt;
