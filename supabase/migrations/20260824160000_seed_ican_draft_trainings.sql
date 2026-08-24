-- Seed four Super-admin I CAN draft trainings.
-- Unpublished and unreleased. Films are Micah's hold placeholder.
-- Idempotent: re-run updates catalog rows in place by slug / session_number.
-- Do not set published = true. Do not call release RPCs.

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
    'after-action-at-the-door',
    'After-Action at the Door',
    'Name it. Own it. Close it. Same day. Then drop the clipboard.',
    'Ken Canfield I CAN (Involvement, Consistency, Awareness, Nurturance) applied to same-day repair. Ten minutes. Named, owned, and closed with the person who was there. The clipboard stops at the door. Super-admin draft. Not published. Not released to organizations. Kill the week if repair becomes a forum story or a family scorecard. Sponsorship funds the organization, not a preferred seat.',
    12,
    10,
    false,
    null,
    'in_development'
  ),
  (
    'direct-hours',
    'Direct Hours',
    'One device-down care block each weekday in town. One longer weekend block. A constraint, not a target.',
    'Ken Canfield I CAN applied to device-down care blocks. One short weekday block when you are in town. One longer weekend block. A constraint, not a target. The firm does not get these hours. Super-admin draft. Not published. Not released. Kill the week if hours become a dashboard or a forum status. Travel weeks stay on the week, the road, or the deal. Sponsorship funds the organization, not a preferred seat.',
    12,
    11,
    false,
    null,
    'in_development'
  ),
  (
    'unscored-child',
    'The Unscored Child',
    'One hour a week with no outcome, no lesson, and no college signal.',
    'Ken Canfield I CAN applied to knowing this child. One hour a week with no outcome, no lesson, and no college signal. The work is Awareness of the child in front of you. Super-admin draft. Not published. Not released. Kill the hour if it becomes a résumé line, a college story, or a family scorecard. Sponsorship funds the organization, not a preferred seat.',
    12,
    12,
    false,
    null,
    'in_development'
  ),
  (
    'midcourse-correction',
    'Midcourse Correction',
    'One countable act a week that means nothing to the firm.',
    'Ken Canfield I CAN applied to one countable weekly act that means nothing to the firm. Involvement picks it before the week starts. Consistency keeps it when the week gets hot. Awareness turns a small thing, not a reinvention. Nurturance keeps it off a slide. Super-admin draft. Not published. Not released. Kill the act if it becomes leadership development, a forum status, or a family scorecard. Sponsorship funds the organization, not a preferred seat.',
    12,
    13,
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
      'after-action-at-the-door',
      1,
      'The clipboard stops at the door',
      'The clipboard stops at the door.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Involvement ask at the door, according to this session?\nA) Bring the week''s open items inside so the household can help close them\nB) Drop the clipboard before you enter, then be present with the people in the house\nC) Hand the clipboard to a child so they can track your follow-through',
      E'Which lived practice matches this session?\nA) Set the work packet down before you walk in, then greet the first person you see\nB) Finish two more notes in the driveway so you enter already caught up\nC) Tell the house you are still on a call and will be available later'
    ),
    (
      'after-action-at-the-door',
      2,
      'Named (what happened, plain)',
      'Name what happened, in plain words.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness require when you name the miss?\nA) A polished story that protects your intent\nB) A plain sentence about what happened, without spin\nC) A private journal entry you never say out loud',
      E'Which action names the miss as this session teaches?\nA) Say one plain sentence about what happened to the person who was there\nB) Write a longer explanation for later, when you have the right words\nC) Wait until you can pair the miss with a win so the name lands softer'
    ),
    (
      'after-action-at-the-door',
      3,
      'Owned (mine, no defense)',
      'Own it as yours. No defense.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Involvement sound like when you own the miss?\nA) A shared-fault sentence that keeps your side safe\nB) A clear ''mine'' with no defense and no explanation stacked on\nC) A promise to do better that skips saying the miss was yours',
      E'Which lived practice owns the miss?\nA) Say it was yours, then stop. Do not add a because.\nB) Explain the week on the road so they understand the pressure\nC) Ask them what they did first so ownership stays even'
    ),
    (
      'after-action-at-the-door',
      4,
      'Closed (with the person who was there)',
      'Close it with the person who was there.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'Where does Nurturance close the repair?\nA) In a note to yourself after the house is quiet\nB) With the person who was there, in the same day\nC) In a later summary once you have thought it through',
      E'Which action closes the repair as taught here?\nA) Go to the person who was there and finish the repair with them\nB) Close it in your head so you do not stir the house again\nC) Send a group message so everyone hears the close at once'
    ),
    (
      'after-action-at-the-door',
      5,
      'Same day, not next week',
      'Same day, not next week.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency does this session lock?\nA) Repair when the calendar opens next week\nB) Repair the same day, before the miss hardens\nC) Repair only if the other person asks',
      E'Which practice keeps the repair on the same day?\nA) Name, own, and close it before you sleep\nB) Park it for Sunday when you have a longer block\nC) Wait until the next travel week ends so you can do it well'
    ),
    (
      'after-action-at-the-door',
      6,
      'Ten minutes is enough',
      'Ten minutes is enough.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What time box does this session teach for repair?\nA) A long talk so the other person feels the weight\nB) About ten minutes. Named, owned, closed. Then stop.\nC) No time box. Stay until every feeling is processed',
      E'Which lived practice matches the ten-minute close?\nA) Set ten minutes, do the three steps, then drop it\nB) Open a longer debrief so nothing is left unsaid\nC) Skip the close if you cannot give it a full hour'
    ),
    (
      'after-action-at-the-door',
      7,
      'Repair is not a story for forum',
      'Repair is not a story for forum.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness refuse in this session?\nA) Telling the person who was hurt\nB) Turning the repair into a story for the room\nC) Keeping the close inside the house',
      E'Which action keeps repair off the forum?\nA) Close it with the person who was there and do not retell it for status\nB) Share the repair as a leadership example this week\nC) Write the repair so it can be posted as follow-through'
    ),
    (
      'after-action-at-the-door',
      8,
      'The child heard the miss',
      'The child heard the miss.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness notice after a miss in the house?\nA) Only the adult conversation, because children miss the details\nB) The child heard it, even if they said nothing\nC) The miss only counts if the child repeats it later',
      E'Which practice includes the child who heard the miss?\nA) If a child heard it, close a short repair with that child too\nB) Protect the child by never naming what they heard\nC) Ask the child to rate how the miss felt so you can track it'
    ),
    (
      'after-action-at-the-door',
      9,
      'The other adult heard the miss',
      'The other adult heard the miss.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Nurturance does this session ask toward the other adult?\nA) Let them infer the repair from a better next week\nB) Close it with them if they heard the miss\nC) Wait for them to raise it so you do not overstep',
      E'Which action repairs with the other adult?\nA) Name, own, and close it with the adult who heard the miss\nB) Repair only with the child and assume the adult is fine\nC) Send a polished note later so you do not have to say it live'
    ),
    (
      'after-action-at-the-door',
      10,
      'When pride wants to wait',
      'When pride wants to wait, go first.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Nurturance do when pride wants to wait?\nA) Wait until you feel ready so the words are clean\nB) Go first the same day, even when pride wants a delay\nC) Wait until they apologize, then match them',
      E'Which lived practice beats the wait?\nA) Start the repair the same day, before pride writes a better speech\nB) Sit with it overnight so you do not sound proud\nC) Ask a peer whether you should wait until next week'
    ),
    (
      'after-action-at-the-door',
      11,
      'Lagging indicators come later',
      'Lagging indicators come later.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with lagging indicators this week?\nA) Build a household chart so you can see the trend\nB) Leave them for later. This week''s work is the same-day close.\nC) Use them tonight to decide whether the repair counted',
      E'Which action keeps lagging indicators later?\nA) Close today''s miss and do not score the house this week\nB) Start a weekly indicator so you know if repair is working\nC) Ask the family to mark whether the week improved'
    ),
    (
      'after-action-at-the-door',
      12,
      'A countable week of repairs',
      'A countable week means named closes, not a score.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What makes a week countable in this course?\nA) A score of how many repairs you completed\nB) Named, owned, closed misses, then the clipboard dropped\nC) A report you can bring to the next room',
      E'Which practice finishes a countable week?\nA) Keep same-day closes all week. Do not turn the week into a scorecard.\nB) Tally repairs and share the number as follow-through\nC) Skip a close if the week already looks strong'
    ),
    (
      'direct-hours',
      1,
      'Hours, not dashboards',
      'These are hours, not dashboards.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness refuse when you set Direct Hours?\nA) A visible hours board so the week stays honest\nB) A dashboard. The block is time with a person, not a tracked target.\nC) Any named block, because naming it creates pressure',
      E'Which practice keeps hours off a dashboard?\nA) Name the care block on your own calendar and do not publish a score\nB) Log hours so you can compare weeks\nC) Post the block as a status so others can follow'
    ),
    (
      'direct-hours',
      2,
      'Device down',
      'Device down.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Involvement require during the care block?\nA) Keep the device nearby in case the firm needs you\nB) Device down. Body in the room with the child.\nC) Device on silent, still in hand, so you stay available',
      E'Which lived practice is device down?\nA) Put the phone in another room for the whole block\nB) Glance only when the lock screen lights up\nC) Keep the laptop open so you can return to work faster'
    ),
    (
      'direct-hours',
      3,
      'The weekday short block',
      'One short weekday block when you are in town.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency does the weekday block ask?\nA) A long evening whenever the deal allows\nB) One short, device-down care block each weekday you are in town\nC) A flexible window you fill if leftover time appears',
      E'Which action keeps the weekday short block?\nA) Hold one short in-town block today, device down, with the child\nB) Stack leftover minutes at the end of the day and call it the block\nC) Skip today and double the block on Thursday'
    ),
    (
      'direct-hours',
      4,
      'The weekend longer block',
      'One longer weekend block.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What extra Consistency does the weekend ask?\nA) The same short weekday block, just on Saturday\nB) One longer weekend care block, still device down\nC) A packed family outing that can be posted later',
      E'Which practice is the weekend longer block?\nA) Give one longer device-down block this weekend, without a target\nB) Fill the weekend with errands and count being nearby\nC) Save the longer block for a week that looks better on paper'
    ),
    (
      'direct-hours',
      5,
      'Constraint, not target',
      'A constraint, not a target.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'How does Awareness treat the care block?\nA) As a target to beat so the week looks strong\nB) As a constraint you keep, not a number you chase\nC) As optional if the firm week is heavy',
      E'Which action treats the block as a constraint?\nA) Keep the named block. Do not add hours to win the week.\nB) Stretch the block to hit a better number\nC) Drop the block when you are already ahead'
    ),
    (
      'direct-hours',
      6,
      'The firm does not get these hours',
      'The firm does not get these hours.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'Who do these hours belong to, according to Involvement?\nA) The firm first, then the child if the deal is quiet\nB) The child. The firm does not get these hours.\nC) Whoever asked last',
      E'Which practice keeps the hours from the firm?\nA) Hold the block even when a deal message lands\nB) Take the call and shift the child to later\nC) Let the firm book over the block this once'
    ),
    (
      'direct-hours',
      7,
      'What counts as care',
      'Care is presence with the child, not a nearby body.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What counts as care in this session?\nA) Being in the house while you finish work\nB) Device-down presence with the child in their world\nC) A purchased experience you can mention later',
      E'Which action counts as care here?\nA) Stay in the child''s activity with the device down\nB) Sit nearby on email and call it presence\nC) Buy a gift in place of the block'
    ),
    (
      'direct-hours',
      8,
      'Travel weeks',
      'On a travel week, keep the constraint on the road or the deal week.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'How does Consistency treat a week on the road?\nA) Pause Direct Hours until you are back in town\nB) Keep a named constraint for that week, road or deal, then resume the in-town blocks\nC) Record a message and count it as the weekday block',
      E'Which practice holds a travel week?\nA) Name the road or deal constraint for this week and keep one contact the child can count on\nB) Let the week go and make it up with a bigger weekend later\nC) Tell the forum you are traveling so the missed hours make sense'
    ),
    (
      'direct-hours',
      9,
      'Protecting without virtue signaling',
      'Protect the block. Do not perform it.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'How does Nurturance protect the block?\nA) Announce the block so people see you keep it\nB) Protect it quietly. Do not use it as a signal.\nC) Drop it if protecting it would look rigid',
      E'Which action protects without signaling?\nA) Keep the block and do not tell a room about it\nB) Mention the block so others can copy the practice\nC) Post that you went device down this week'
    ),
    (
      'direct-hours',
      10,
      'The child notices Consistency',
      'The child notices Consistency, not the speech.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does the child notice, according to this session?\nA) The speech about why this week was hard\nB) The kept block, repeated\nC) The number of hours you meant to give',
      E'Which practice lets the child notice Consistency?\nA) Keep the same named block this week without a speech\nB) Explain the method so they appreciate the effort\nC) Skip once and tell them you are still consistent in intent'
    ),
    (
      'direct-hours',
      11,
      'Lagging indicators',
      'Lagging indicators stay later. Keep the block now.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with lagging indicators in Direct Hours?\nA) Build a weekly hours chart so you can see care working\nB) Leave them later. This week''s work is keeping the constraint.\nC) Ask the child if they felt the hours so you have a read',
      E'Which action leaves lagging indicators later?\nA) Keep this week''s blocks and do not score the household\nB) Start a simple indicator so you know if the blocks matter\nC) Collect a family rating after the weekend block'
    ),
    (
      'direct-hours',
      12,
      'Keep twelve weeks',
      'Keep twelve weeks of the constraint.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency closes this course?\nA) A strong final week that makes up for missed blocks\nB) Twelve weeks of the same constraint, not a target\nC) A report of hours at the end of the season',
      E'Which practice keeps twelve weeks?\nA) Hold this week''s blocks and return next week to the same constraint\nB) Declare the season done if this week was clean\nC) Add extra hours this week so the twelve look complete'
    ),
    (
      'unscored-child',
      1,
      'Every Other Hour Is Scored',
      'Every other hour is scored. This one is not.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness name about the rest of the week?\nA) Most hours with a child should produce a visible result\nB) Every other hour is already scored. This hour must stay free of that.\nC) Scoring helps the child take the hour seriously',
      E'Which practice treats this hour as unscored?\nA) Give the hour with no result to show when it ends\nB) Set a small goal so the hour does not waste time\nC) Ask what they learned so you have something to keep'
    ),
    (
      'unscored-child',
      2,
      'This Hour Refuses the Resume',
      'This hour refuses the résumé.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does this hour refuse?\nA) Play that cannot be named later\nB) Any résumé, college, or outcome signal\nC) Questions about the child''s actual interests',
      E'Which action refuses the résumé?\nA) Spend the hour on what they chose, with nothing to file later\nB) Steer toward an activity that could matter later\nC) Take a photo so the hour has a record'
    ),
    (
      'unscored-child',
      3,
      'Who Is This Child Now',
      'Meet the child who is here now.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'Who does Involvement meet in this session?\nA) The child you remember from last year\nB) This child, as they are now\nC) The child you are training them to become',
      E'Which practice meets the child now?\nA) Ask one question about their life this week and follow what they say\nB) Start from your old picture and check whether they still fit it\nC) Tell them who they are becoming so they have a map'
    ),
    (
      'unscored-child',
      4,
      'What They Are Into (Not What You Hope)',
      'Learn what they are into, not what you hope.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness gather in this hour?\nA) Interests that could become useful later\nB) What they are into now, even if it is not what you hope\nC) A list of activities you can coach',
      E'Which action learns what they are into?\nA) Enter their interest for the hour and leave your hope outside\nB) Redirect toward something with a longer payoff\nC) Suggest three better interests and let them pick'
    ),
    (
      'unscored-child',
      5,
      'What Frightens Them',
      'Learn what frightens them, without fixing it this hour.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'How does Awareness hold what frightens them?\nA) As a problem to solve before the hour ends\nB) As something to hear. This hour does not fix it.\nC) As a topic to avoid so the hour stays light',
      E'Which practice hears fear without a fix?\nA) If they name a fear, listen. Do not turn it into a lesson.\nB) Offer three steps they can take this week\nC) Change the subject so the hour does not get heavy'
    ),
    (
      'unscored-child',
      6,
      'What Is Coming in Six Months',
      'Ask what is coming in six months. Do not load it.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness do with the next six months?\nA) Turn their answer into a plan you can track\nB) Hear what is coming from their side, without loading college or outcome\nC) Supply the milestones they should already see',
      E'Which action asks about six months without loading it?\nA) Ask what they see coming, then listen. No advice hour.\nB) Map their answer onto school or sport goals\nC) Tell them what should be coming so they are ready'
    ),
    (
      'unscored-child',
      7,
      'Questions Only, No Advice',
      'Questions only. No advice.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Involvement move does this session lock?\nA) A short lesson after each answer\nB) Questions only. No advice in this hour.\nC) Advice first, then a question to check they heard it',
      E'Which lived practice is questions only?\nA) Ask, then wait. If advice rises, swallow it.\nB) Ask, then add the one thing they need to hear\nC) Skip questions and tell a story from your week'
    ),
    (
      'unscored-child',
      8,
      'Listen Longer Than You Talk',
      'Listen longer than you talk.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Nurturance ratio does this session teach?\nA) Talk enough to guide, then let them fill gaps\nB) Listen longer than you talk\nC) Keep a balanced back and forth so the hour feels fair',
      E'Which action listens longer than you talk?\nA) Give them the floor and keep your words short\nB) Match their time with your own stories so they feel close\nC) Summarize their words into a lesson they can keep'
    ),
    (
      'unscored-child',
      9,
      'Nothing to Show at the End',
      'Nothing to show at the end.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What should you have at the end of the hour?\nA) A note you can share about what the hour produced\nB) Nothing to show. The hour was the practice.\nC) A photo or a skill they can demonstrate',
      E'Which practice leaves nothing to show?\nA) End the hour without a product, recap, or proof\nB) Write three takeaways so the hour was not empty\nC) Ask them to name what they gained'
    ),
    (
      'unscored-child',
      10,
      'Moods Are Data You Do Not Optimize',
      'Moods are data you do not tune.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'How does Awareness treat a mood in this hour?\nA) As a state to improve before you finish\nB) As data you notice and leave alone\nC) As a reason to end the hour early',
      E'Which action leaves a mood untuned?\nA) Notice the mood. Stay. Do not try to upgrade it.\nB) Cheer them up so the hour ends on a better note\nC) Name a fix they can run after you leave'
    ),
    (
      'unscored-child',
      11,
      'Presence Without Extracting a Return',
      'Be present. Extract nothing.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Nurturance refuse to extract?\nA) Warmth, because closeness should be earned\nB) A return: gratitude, progress, or a usable story\nC) Time, because an hour without return is waste',
      E'Which practice is presence without a return?\nA) Stay for the hour and leave without taking a story or a result\nB) Ask how the hour helped so you know it was worth it\nC) Collect one line you can use later when someone asks how they are'
    ),
    (
      'unscored-child',
      12,
      'Keep One Unscored Hour Every Week',
      'Keep one unscored hour every week.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What Consistency closes this course?\nA) An excellent hour when the week is light\nB) One unscored hour every week, kept\nC) A monthly long session that replaces the weekly hour',
      E'Which practice keeps the unscored hour?\nA) Put next week''s hour on the calendar and keep it free of outcome\nB) Skip a tight week and make the next hour longer\nC) Turn the hour into a lesson week when something important is coming'
    ),
    (
      'midcourse-correction',
      1,
      'Ken''s Phrase Inside I CAN',
      'Ken''s phrase sits inside I CAN: Involvement, Consistency, Awareness, Nurturance.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'Where does Ken''s phrase sit in this course?\nA) Outside the home, as a firm operating system\nB) Inside I CAN: Involvement, Consistency, Awareness, and Nurturance\nC) In place of I CAN, as a faster weekly method',
      E'Which practice starts the course inside I CAN?\nA) Name the four: Involvement, Consistency, Awareness, Nurturance. Then pick one small home act.\nB) Translate I CAN into a firm scorecard you can run at home\nC) Skip the four and jump to a visible win'
    ),
    (
      'midcourse-correction',
      2,
      'Awareness of What to Turn',
      'Awareness names the one thing to turn.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness turn this week?\nA) The whole pattern, so the correction is complete\nB) One small thing you can actually turn\nC) Whatever the firm week left unfinished',
      E'Which action shows Awareness of what to turn?\nA) Name one small home turn for this week. Leave the rest.\nB) List five changes so the midcourse is thorough\nC) Wait for a clearer season before you name anything'
    ),
    (
      'midcourse-correction',
      3,
      'Meaningless to the Firm (The Filter)',
      'If the firm can use it, it fails the filter.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What filter does this session lock?\nA) Choose an act the firm would respect\nB) Choose an act that means nothing to the firm\nC) Choose an act you can mention in both rooms',
      E'Which practice applies the filter?\nA) Pick a home act the firm cannot use\nB) Pick an act that also trains leadership\nC) Pick an act you could brief as culture'
    ),
    (
      'midcourse-correction',
      4,
      'Unreportable as Leadership Development',
      'If you can report it as leadership development, it is the wrong act.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'When is the act the wrong one?\nA) When nobody at work will understand it\nB) When you can report it as leadership development\nC) When it takes less than ten minutes',
      E'Which action stays unreportable?\nA) Do a home act you would not put in a development note\nB) Choose an act that could sit in a development plan\nC) Write the act so it reads as growth if asked'
    ),
    (
      'midcourse-correction',
      5,
      'Involvement: Pick the Act Before the Week Starts',
      'Involvement picks the act before the week starts.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'When does Involvement pick the act?\nA) When leftover time appears midweek\nB) Before the week starts\nC) After you see how the deal week lands',
      E'Which practice is Involvement this week?\nA) Name the act before Monday begins, then keep that name\nB) Wait until Friday to see what you can still do\nC) Keep three options and pick the one that fits the firm week'
    ),
    (
      'midcourse-correction',
      6,
      'Involvement: Do It Once, Plainly',
      'Involvement does the act once, plainly.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'How does Involvement complete the act?\nA) Repeat it until it feels like a habit\nB) Do it once, plainly, this week\nC) Describe it clearly even if you do not get to it',
      E'Which lived practice does the act once, plainly?\nA) Do the named act one time this week, without a speech\nB) Talk through the act with the child so they see the intent\nC) Do a larger version so once is enough to notice'
    ),
    (
      'midcourse-correction',
      7,
      'Do Not Announce It',
      'Do not announce it.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Awareness keep off the air?\nA) The child''s name, but the act can be shared\nB) The act itself. Do not announce it.\nC) Only public posts. A small room can hear it.',
      E'Which action does not announce the act?\nA) Do it and leave it unadvertised\nB) Tell one peer so you have accountability\nC) Mention it as a quiet example of follow-through'
    ),
    (
      'midcourse-correction',
      8,
      'Consistency When the Week Gets Hot',
      'Consistency keeps the act when the week gets hot.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Consistency do on a hot week?\nA) Park the act until the deal cools\nB) Keep the same named act, even when the week gets hot\nC) Replace it with a note so the week still counts',
      E'Which practice holds a hot week?\nA) Do the named act once this week, road or deal included\nB) Skip and mark the week as too hot\nC) Announce that you will resume when the week calms'
    ),
    (
      'midcourse-correction',
      9,
      'Awareness: Correction Is Not Reinvention',
      'Awareness corrects. It does not reinvent the man.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What kind of turn is a midcourse correction?\nA) A full reinvention so the next season looks new\nB) A small correction. Not a new identity.\nC) A public reset so people can see the change',
      E'Which action is correction, not reinvention?\nA) Turn one small thing and leave the rest of the man alone\nB) Launch a new personal program this week\nC) Tell the house you are becoming someone different'
    ),
    (
      'midcourse-correction',
      10,
      'Nurturance: What You Will Not Put on a Slide',
      'Nurturance keeps the act off a slide.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What will Nurturance not put on a slide?\nA) Firm work. Home acts can be shown as culture.\nB) This week''s act. If it fits a slide, it failed the filter.\nC) Names. The act itself is fine to display.',
      E'Which practice keeps the act off a slide?\nA) Do the act and refuse to make it material\nB) Save a clean sentence in case someone asks for an example\nC) Turn the act into a short lesson others can use'
    ),
    (
      'midcourse-correction',
      11,
      'Consistency Across Twelve Quiet Weeks',
      'Consistency is twelve quiet weeks, not one visible week.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What does Consistency look like across this course?\nA) One strong week you can remember\nB) Twelve quiet weeks of the same kind of act\nC) A midseason spike when you have more room',
      E'Which practice keeps twelve quiet weeks?\nA) Do this week''s act and return next week without a display\nB) Make this week larger so the season has a peak\nC) Skip a quiet week because nobody would notice'
    ),
    (
      'midcourse-correction',
      12,
      'Stay Midcourse: I CAN Holds',
      'Stay midcourse. I CAN holds.',
      'https://www.youtube.com/watch?v=yo_nS0vpV4M',
      300,
      E'What holds when you stay midcourse?\nA) A finished identity you can present\nB) I CAN: Involvement, Consistency, Awareness, Nurturance\nC) A new method you invent for the next season',
      E'Which action stays midcourse?\nA) Keep one firm-meaningless act next week, inside I CAN, unannounced\nB) Close the course with a summary you could share\nC) Replace I CAN with whatever worked this month'
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
