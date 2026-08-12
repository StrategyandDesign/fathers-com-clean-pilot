/* The guide. A father-participant help layer modeled on the working-loop
   help pattern: a floating launcher, a panel of topics for the screen he is
   on, a path stepper to the certificate, and hide-with-a-way-back. Speaks
   to one person only: the father. No other roles are named. */
(function(){
  if (document.getElementById('fc-help-launcher')) return;
  var VERSION = 'v4.14.1';
  var page = (location.pathname.split('/').pop() || 'index.html');

  var css = ''
  + '#fc-help-launcher{position:fixed;right:22px;bottom:22px;z-index:9998;width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:#0b0a08;color:#ffffff;font-size:22px;font-family:inherit;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.45)}'
  + '#fc-help-panel{position:fixed;right:22px;bottom:86px;z-index:9999;width:min(400px,calc(100vw - 32px));max-height:min(660px,calc(100vh - 120px));overflow:auto;background:#ffffff;color:#1a1710;border:1px solid #d8d2c4;border-radius:16px;padding:22px;box-shadow:0 14px 44px rgba(0,0,0,.35)}'
  + '#fc-help-panel h3{margin:0 0 4px;font-size:19px;color:#1a1710}'
  + '#fc-help-panel .fh-sub{color:#5f584a;font-size:13px;margin:0 0 14px}'
  + '#fc-help-panel .fh-x{position:absolute;top:14px;right:16px;background:none;border:0;color:#5f584a;font-size:18px;cursor:pointer}'
  + '.fh-sec{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.09em;color:#7a7264;margin:16px 0 6px}'
  + '.fh-step{display:flex;gap:10px;align-items:baseline;padding:4px 8px;border-radius:6px;font-size:13.5px;color:#3a3426}'
  + '.fh-step .n{font-family:ui-monospace,monospace;font-size:11px;color:#7a7264;min-width:14px}'
  + '.fh-step.here{background:#f6f1e2;color:#1a1710;font-weight:600}'
  + '.fh-step.here .tag{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.08em;color:#705400;margin-left:auto;font-weight:600}'
  + '.fh-topic{display:block;width:100%;text-align:left;background:none;border:0;padding:7px 0;color:#705400;font-size:15px;cursor:pointer;font-family:inherit;text-decoration:none}'
  + '.fh-topic:hover{text-decoration:underline;color:#4d3a00}'
  + '.fh-art{font-size:14px;line-height:1.6;color:#1a1710}'
  + '.fh-art p{margin:0 0 10px}'
  + '.fh-back{background:none;border:0;color:#5f584a;cursor:pointer;padding:0;margin-bottom:12px;font-size:13px;font-family:inherit}'
  + '.fh-foot{display:flex;justify-content:space-between;align-items:center;margin-top:16px;border-top:1px solid #e6e0d2;padding-top:12px}'
  + '.fh-hide{background:none;border:0;color:#5f584a;cursor:pointer;font-size:13px;font-family:inherit}'
  + '.fh-ver{font-family:ui-monospace,monospace;font-size:11px;color:#7a7264}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // ---- The path to the certificate: eight steps, current one inferred. ----
  var PATH = ['Arrive','Start free','Your baseline','Your ninety-day plan','Your course','Checkpoints and the final','Submit the work','Your certificate'];
  // The page itself is the only honest evidence of position. Anywhere
  // else, the path renders as a map with no claimed location.
  function pathStep(){
    if (page === 'certificate.html') return 8;
    if (page === 'course.html') return 6;
    if (page === 'class.html' || page.indexOf('course-') === 0 || page === 'certificates.html' || page === 'enroll.html') return 5;
    if (page === 'plan.html') return 4;
    if (page === 'profile.html') return 3;
    return 0;
  }

  // ---- Topics. One audience: the father. ----
  var T = {
    start: { t: 'Start here: what this is', b: '<p>This platform trains four things a father can actually practice: involvement, consistency, awareness, and nurturance. You measure where you stand, get a ninety-day plan, take a self-paced film course with a Certified Facilitator available for questions, and finish with a Certificate of Completion that anyone can check online.</p><p>Everything a man needs here is free: the Profile, the plan, the courses, and the certificate when you earn it. That is not a trial. It is the model.</p>' },
    account: { t: 'Create your free account', b: '<p>Tap Start your Profile anywhere on the site. Enter your email and we send you a sign-in link; tap it and you are in. No password to remember, no card, no cost.</p><p>If you are in a program, your facilitator may set you up in the room instead. Either way it costs you nothing.</p>' },
    free: { t: 'Is this really free?', b: '<p>Yes. Every course and the Certificate of Completion are free to the man who takes them, always. Sponsors fund organization certification and facilitator credentialing; the courses stay free to you.</p>' },
    profile: { t: 'Take your Profile, get your plan', b: '<p>The Keystone Profile is a set of honest questions about your fathering, taken in one sitting. Answer straight; nobody is grading you. You get four scores and an overall baseline, and your numbers compare you to yourself over time, never to other men.</p><p>From your answers we build a ninety-day plan: one clear thing to work on first.</p>' },
    course: { t: 'Pick your course', b: '<p>Fathering Fundamentals is the flagship and serves every man. Coming Home Present is built for a father returning to his children after time away. Steady Under Pressure trains the pause, the repair, and the habits underneath them. Same Team is for fathers raising children across two homes.</p><p>Every written session is published on each course page, free to read right now.</p>' },
    session: { t: 'How a session works', b: '<p>Each session is about an hour: a film you watch on your schedule, and one practice you can actually do before the next session. Time on task is measured while you watch; when the film ends you take a short checkpoint, and passing it unlocks the next session. One clear next step, every time.</p>' },
    checkpoint: { t: 'The checkpoint rule', b: '<p>Checkpoints pass at eighty percent. You get three tries an hour; if you miss three, take a break, reread the session, and come back after the window, or ask your Certified Facilitator. That is what support is for.</p>' },
    practice: { t: 'The practice between sessions', b: '<p>Every session ends with a practice built so you can complete it wherever you are right now, before you are home. No practice ever requires contact with your child, and none ever asks you to go beyond the rules that govern you now or any court order.</p>' },
    seat: { t: 'If your seat is not claimed yet', b: '<p>Enrollment runs through people, not codes. A facilitator or organization claims your seat, which takes them under a minute, and then the Enroll button works for you at no cost. If you see a message that your seat is not claimed, ask the person who told you about the course.</p>' },
    certificate: { t: 'What your certificate carries', b: '<p>Your name, confirmed by your Certified Facilitator. Your sessions, completed and measured. The final, written by you and read by a person. And a unique serial with a public page where any court, program, or employer can confirm it in ten seconds, no login.</p><p>We certify the work. You supply the change.</p>' },
    send: { t: 'Send it where it counts', b: '<p>When your certificate issues, the verification link is yours to send: to your officer, your program, your employer, or anyone who needs to see that you did the work. The page shows your name, the course, the record, and how your identity was confirmed. Nothing else.</p>' },
    privacy: { t: 'Who can see what', b: '<p>Your answers are yours. Programs see group totals, never your individual answers. Your written reflections are read by your facilitator to approve your work, and you never need to use real names in them. The public verification page shows your name and course title for your serial, and nothing more.</p>' },
    hide: { t: 'Minimizing this guide', b: '<p>Minimize closes this panel back down to the question-mark icon in the corner; the icon always stays. Tap it, press the question-mark key, or use the Help link in the footer to open the guide again.</p>' },
    keys: { t: 'Work at speed', b: '<p>Press the question-mark key on any page to open this guide. Escape closes it. Everything else is one clear button at a time; that is by design.</p>' }
  };

  var CONTEXT = {
    'index.html': { name: 'the front page', topics: ['start','account','free','profile','course'] },
    'profile.html': { name: 'your Profile', topics: ['profile','privacy','free'] },
    'plan.html': { name: 'your plan', topics: ['profile','course','session'] },
    'certificates.html': { name: 'the courses', topics: ['course','session','seat','certificate'] },
    'class.html': { name: 'the flagship course', topics: ['session','checkpoint','practice','certificate'] },
    'enroll.html': { name: 'enrollment', topics: ['seat','free','account','certificate'] },
    'course.html': { name: 'your course room', topics: ['session','checkpoint','practice','send'] },
    'verify.html': { name: 'verification', topics: ['certificate','send','privacy'] },
    'certificate.html': { name: 'your certificate', topics: ['certificate','send','privacy'] }
  };
  function coursePage(){ return page.indexOf('course-') === 0; }
  var ctx = CONTEXT[page] || (coursePage() ? { name: 'this course', topics: ['session','checkpoint','practice','seat'] } : { name: 'this page', topics: ['start','account','course'] });

  var ORDER = [
    ['START', ['start','account','free']],
    ['THE WORK', ['profile','course','session','checkpoint','practice','seat']],
    ['YOUR RECORD', ['certificate','send','privacy']],
    ['THIS GUIDE', ['hide','keys']]
  ];

  var open = false, panel = null;
  function launcher(){
    var b = document.createElement('button');
    b.id = 'fc-help-launcher'; b.type = 'button'; b.textContent = '?';
    b.setAttribute('aria-label', 'Open the guide');
    b.addEventListener('click', toggle);
    document.body.appendChild(b);
    return b;
  }
  function render(topicKey){
    if (panel) panel.remove();
    panel = document.createElement('div');
    panel.id = 'fc-help-panel';
    var h = '<button class="fh-x" aria-label="Close">&times;</button>';
    if (topicKey && T[topicKey]) {
      h += '<button class="fh-back">&larr; All topics</button>'
        + '<h3>' + T[topicKey].t + '</h3><div class="fh-art">' + T[topicKey].b + '</div>';
    } else {
      var step = pathStep();
      h += '<h3>The Guide</h3><p class="fh-sub">Topics for ' + ctx.name + '</p>'
        + ctx.topics.map(function(k){ return '<button class="fh-topic" data-t="' + k + '">' + T[k].t + '</button>'; }).join('')
        + '<div class="fh-sec">THE PATH</div>'
        + PATH.map(function(name, idx){
            var here = (idx + 1) === step;
            return '<div class="fh-step' + (here ? ' here' : '') + '"><span class="n">' + (idx + 1) + '</span><span>' + name + '</span>' + (here ? '<span class="tag">YOU ARE HERE</span>' : '') + '</div>';
          }).join('');
      ORDER.forEach(function(sec){
        var rest = sec[1].filter(function(k){ return ctx.topics.indexOf(k) === -1; });
        if (!rest.length) return;
        h += '<div class="fh-sec">' + sec[0] + '</div>'
          + rest.map(function(k){ return '<button class="fh-topic" data-t="' + k + '">' + T[k].t + '</button>'; }).join('');
      });
      h += '<div class="fh-foot"><button class="fh-hide">Minimize</button><span class="fh-ver">' + VERSION + '</span></div>';
    }
    panel.innerHTML = h;
    document.body.appendChild(panel);
    panel.querySelector('.fh-x').addEventListener('click', toggle);
    var back = panel.querySelector('.fh-back'); if (back) back.addEventListener('click', function(){ render(null); });
    panel.querySelectorAll('.fh-topic').forEach(function(t){ t.addEventListener('click', function(){ render(t.getAttribute('data-t')); }); });
    var hide = panel.querySelector('.fh-hide'); if (hide) hide.addEventListener('click', function(){ toggle(); });
  }
  function toggle(){ open = !open; if (open) render(null); else if (panel) { panel.remove(); panel = null; } }
  window.FCHelp = { show: function(){ if (!open) toggle(); } };

  launcher();
  document.addEventListener('keydown', function(e){
    if (e.key === '?' && !/input|textarea|select/i.test((e.target && e.target.tagName) || '')) { window.FCHelp.show(); }
    if (e.key === 'Escape' && open) toggle();
  });
  // First arrival: open the guide once, on the front page only.
  try {
    if (page === 'index.html' && !localStorage.getItem('fc_help_seen')) {
      localStorage.setItem('fc_help_seen', '1');
      setTimeout(function(){ if (!open) toggle(); }, 1200);
    }
  } catch(e){}
})();
