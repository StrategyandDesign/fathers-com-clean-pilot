/* ============================================================
   The participant dashboard. One place a man's written report always lives:
   it appears the moment he finishes and every time he returns. The report is not
   rebuilt here; it is the same component report.html uses (window.FCReport),
   rendered into this page's container. Three modes:

     (default)      the signed-in participant's own latest report.
     ?demo=1        the Marcus mock, so the infrastructure is demonstrable with
                    no live data. This is exactly what a participant sees.
     ?as=<user_id>  admin view-as. An admin sees a participant's dashboard exactly
                    as the participant sees it. Read only, admin-gated.

   Which assessment produced the result is resolved by the registry inside
   FCReport, so a father profile or a manhood profile renders correctly with no
   change here.
   ============================================================ */
(function(){
  var host = document.getElementById('dashReport');
  if(!host || !window.FCReport) return;

  var qs    = new URLSearchParams(location.search);
  var asUid = qs.get('as');
  var demo  = qs.get('demo');
  var done  = qs.get('done');

  var nameEl = document.getElementById('dashName');
  var wrapEl = document.getElementById('dashNameWrap');
  var banner = document.getElementById('dashBanner');

  function setName(n){ if(n && nameEl){ nameEl.textContent = n; if(wrapEl) wrapEl.style.display = ''; } }
  function say(html){ if(banner){ banner.style.display = ''; banner.innerHTML = html; } }
  function loading(m){ host.innerHTML = '<div class="center" style="padding:60px 0"><p class="ash">'+(m||'Loading your report\u2026')+'</p></div>'; }
  /* Two different situations that used to share one message. A man who is signed
     out may well have a report waiting; telling him to take the profile again
     would have him redo 128 items for nothing. */
  function empty(){
    host.innerHTML = '<div class="card" style="padding:30px">'+
      '<h3 class="d-22" style="margin:0 0 8px">Your report is not ready yet</h3>'+
      '<p class="fine" style="margin:0 0 16px">Take your Profile and your full written report appears here, always available.</p>'+
      '<a class="btn btn-yellow btn-sm" href="profile.html">Take your Profile</a></div>';
  }
  function signedOut(){
    host.innerHTML = '<div class="card" style="padding:30px">'+
      '<h3 class="d-22" style="margin:0 0 8px">Sign in to see your report</h3>'+
      '<p class="fine" style="margin:0 0 16px">If you have taken a Profile, it is saved to your account and it is waiting here.</p>'+
      '<div class="row wrap" style="gap:10px">'+
        '<a class="btn btn-yellow btn-sm" href="login.html">Sign in</a>'+
        '<a class="btn btn-secondary btn-sm" href="profile.html">I have not taken it yet</a>'+
      '</div></div>';
  }
  function denied(){
    host.innerHTML = '<div class="card" style="padding:30px">'+
      '<h3 class="d-22" style="margin:0 0 8px">Admin access required</h3>'+
      '<p class="fine" style="margin:0">Viewing another participant\u2019s dashboard requires an admin role.</p></div>';
  }
  /* Collapsed form on the dashboard. The full document still lives at
     report.html, one tap away from the strip at the top of it. */
  function draw(result, who){ setName(who); window.FCReport.render(host, { result: result, state: 'live', collapse: true }); }

  /* EVERY profile he holds, newest first, one row per assessment.

     A man can complete more than one. Loading only his newest meant that
     finishing the Manhood Profile made his Father Profile unreachable: the
     report, the plan and this page all took the latest row and there was no way
     to ask for the other. He keeps both now, and this page is where he chooses.

     Legacy rows written before results carried a slug are father results. */
  function loadProfilesFor(uid, onList, onNone){
    FC.sb.from('keystone_results').select('*').eq('user_id', uid)
      .order('completed_at',{ascending:false})
      .then(function(r){
        var rows = (r && r.data) || [];
        if(!rows.length){ onNone(); return; }
        var seen = {}, list = [];
        for(var i=0;i<rows.length;i++){
          var slug = rows[i].assessment_slug || 'keystone-father-profile';
          if(seen[slug]) continue;          // newest sitting of each profile
          seen[slug] = true;
          rows[i].assessment_slug = slug;
          list.push(rows[i]);
        }
        onList(list);
      }, function(){ onNone(); });
  }

  function titleFor(slug){
    if(window.FCReg && FCReg.bySlug){
      var a = FCReg.bySlug(slug), K = a && FCReg.data ? FCReg.data(a) : null;
      if(K && K.title) return K.title;
      if(a && (a.reportTitle || a.name)) return a.reportTitle || a.name;
    }
    return 'Your profile';
  }

  function fmt(iso){
    try { return new Date(iso).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}); }
    catch(e){ return ''; }
  }

  /* The switcher. Only shown when he actually holds more than one profile, so a
     man with a single profile sees no extra furniture. */
  /* The bar above the report.

     Two parts, shown independently. The CHOOSER only appears when he holds more
     than one profile, because a man with one has nothing to choose. The ACTIONS
     always appear, because his ninety-day plan is the thing he comes back to
     every week and it must be one tap from his home. These used to be tied
     together, so a man with a single profile, which is most men, got no link to
     his plan at all and had to find it in the site menu. */
  function paintSwitcher(list, activeSlug, onPick){
    var bar = document.getElementById('dashSwitch');
    if(!bar) return;
    bar.style.display = '';

    var chooser = '';
    if(list.length > 1){
      /* Two profiles are two records of two different instruments, each with its
         own report and its own plan. A row of buttons with a date crammed inside
         each one said none of that. Two cards, and the active one says it is
         showing rather than leaving the man to read a button colour. */
      chooser = '<div class="eyebrow" style="margin-bottom:10px">YOUR PROFILES</div>' +
        '<div class="dash-prof">' + list.map(function(res){
          var on = res.assessment_slug === activeSlug;
          return '<button type="button" class="dash-prof-c" aria-pressed="' + (on ? 'true' : 'false') + '" ' +
            'data-profile="' + esc(res.assessment_slug) + '">' +
            '<span class="dash-prof-k">' + (on ? 'Showing now' : 'Switch to') + '</span>' +
            '<span class="dash-prof-t">' + esc(titleFor(res.assessment_slug)) + '</span>' +
            '<span class="dash-prof-d">Completed ' + esc(fmt(res.completed_at)) + '</span>' +
          '</button>';
        }).join('') + '</div>';
    }

    bar.innerHTML = chooser +
      '<div class="row wrap" style="gap:10px">' +
        '<a class="btn btn-primary btn-sm" href="plan.html?assessment=' + encodeURIComponent(activeSlug) + '">Open your ninety-day plan</a>' +
        '<a class="btn btn-secondary btn-sm" href="report.html?assessment=' + encodeURIComponent(activeSlug) + '">Open the full report</a>' +
        '<a class="btn btn-secondary btn-sm" href="certificates.html">Browse the courses</a>' +
      '</div>';

    bar.querySelectorAll('[data-profile]').forEach(function(b){
      b.addEventListener('click', function(){ onPick(b.getAttribute('data-profile')); });
    });
  }

  function esc(t){ return (t==null?'':String(t)).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }


  /* ---------- What comes after the report ----------

     Ordered deliberately rather than laid out flat.

     Working memory holds about four items, and completion drops sharply when a
     person faces more than three or four choices at once. So this is not a menu
     of everything available. It is one primary action, then his report, then a
     short "what is next" strip. Everything he might want is reachable; only one
     thing is loud.

     For a man coming out of treatment, that matters more than it does for a
     product demo. The point is that he always knows the single next thing. */

  var OTHER = { 'keystone-father-profile': 'keystone-manhood-profile',
                'keystone-manhood-profile': 'keystone-father-profile' };

  /* ---------- YOUR COURSES ----------

     The dashboard had no idea a man was enrolled in anything. It counted
     published courses and told every man the same sentence, so a man three
     lessons into the Fundamentals was told "3 courses open to you" and had no
     route back to the lesson he stopped on. He had to go to the catalogue, find
     the card, and read it to discover he was already in it.

     This reads his actual enrolments, computes real lesson progress, and puts
     the resume on the page he lands on. Ordered by last activity, so the course
     he touched most recently is first: that is what "where you left off" means
     when a man holds three.

     Returns the enrolled count to the caller, because "what is next" must stop
     advertising the catalogue once he is already inside it. */
  function coursesStrip(uid, done){
    var host = document.getElementById('dashCourses');
    if(!host) return done(0, 0);
    if(!(window.FC && FC.live && FC.sb && uid)) return done(0, 0);

    FC.sb.from('certificate_courses').select('id,slug,title').eq('published', true)
      .then(function(cr){
        var courses = (cr && cr.data) || [];
        if(!courses.length) return done(0, 0);

        FC.sb.from('certificate_enrollments').select('course_id,state,last_activity_at').eq('user_id', uid)
          .then(function(er){
            var enrolls = (er && er.data) || [];
            if(!enrolls.length) return done(0, courses.length);

            var byId = {}; courses.forEach(function(c){ byId[c.id] = c; });
            var mine = enrolls.filter(function(e){ return byId[e.course_id]; });
            if(!mine.length) return done(0, courses.length);

            /* Lesson totals and his completions, so the bar is real rather than
               a state label dressed up as progress. */
            Promise.all([
              FC.sb.from('course_videos').select('id,course_id').then(function(r){return r;},function(){return {data:[]};}),
              FC.sb.from('video_progress').select('video_id').eq('user_id', uid).eq('completed', true)
                .then(function(r){return r;},function(){return {data:[]};})
            ]).then(function(res){
              var vids = (res[0] && res[0].data) || [];
              var doneIds = {}; ((res[1] && res[1].data) || []).forEach(function(v){ doneIds[v.video_id] = 1; });
              var total = {}, hit = {};
              vids.forEach(function(v){
                total[v.course_id] = (total[v.course_id] || 0) + 1;
                if(doneIds[v.id]) hit[v.course_id] = (hit[v.course_id] || 0) + 1;
              });

              mine.sort(function(a,b){
                return String(b.last_activity_at||'').localeCompare(String(a.last_activity_at||''));
              });

              var cards = mine.map(function(e){
                var c = byId[e.course_id];
                var n = hit[e.course_id] || 0, m = total[e.course_id] || 0;
                var finished = e.state === 'complete' || e.state === 'approved';
                var pct = finished ? 100 : (m ? Math.round((n/m)*100) : 0);
                /* Four real states, not three. A man can finish every lesson and
                   still not have submitted the final Q&A, and telling him he is
                   "in progress" at 100 percent hides the one step left. */
                var watched = !finished && m > 0 && n >= m;
                var cls = finished ? ' is-done' : (watched ? ' is-done' : (n === 0 ? ' is-new' : ''));
                var kicker = finished ? 'Certificate earned'
                           : watched ? 'Lessons complete'
                           : n === 0 ? 'Not started' : 'In progress';
                var meter = finished ? 'All lessons complete'
                          : watched ? 'Final questions left'
                          : m ? (n + ' of ' + m + ' lesson' + (m===1?'':'s'))
                              : 'Lessons open when the course is ready';
                var call = finished ? 'View your certificate'
                         : watched ? 'Finish and submit'
                         : n === 0 ? 'Start the first lesson' : 'Continue where you left off';
                return '<a class="dash-course'+cls+'" href="course.html?cert='+encodeURIComponent(c.slug)+'">'+
                  '<span class="dash-course-k">'+kicker+'</span>'+
                  '<h3 class="dash-course-t">'+esc(c.title || c.slug)+'</h3>'+
                  '<span class="dash-course-bar"><span class="dash-course-fill" style="width:'+pct+'%"></span></span>'+
                  '<p class="dash-course-m">'+meter+'</p>'+
                  '<span class="dash-course-go">'+call+' <i aria-hidden="true">&rarr;</i></span></a>';
              }).join('');

              host.innerHTML =
                '<div class="dash-sec-h"><span class="eyebrow">YOUR COURSES</span>'+
                  '<a class="link ash" href="certificates.html">All courses &rarr;</a></div>'+
                '<div class="grid-auto">'+cards+'</div>';

              done(mine.length, courses.length);
            });
          }, function(){ done(0, courses.length); });
      }, function(){ done(0, 0); });
  }

  function nextStrip(activeSlug, heldSlugs, enrolled, courseCount, hasClaim){
    var host = document.getElementById('dashNext');
    if(!host) return;

    var other = OTHER[activeSlug];
    var hasOther = other && heldSlugs.indexOf(other) > -1;
    var otherTitle = other ? titleFor(other) : '';

    /* Courses lead once a claim (or enrollment) exists. Unclaimed men should
       stay on the free plan / facilitator path, not hit the certificates enroll wall. */
    function paint(courseCount){
      var cards = [];
      enrolled = enrolled || 0;
      var remaining = Math.max(0, courseCount - enrolled);

      /* One card shape, so the three read as choices rather than a list of raw
         links. Each carries its own call so the destination is never a guess. */
      function card(href, kicker, title, body, go){
        return '<a class="dash-next" href="'+href+'">'+
          '<span class="dash-next-k">'+kicker+'</span>'+
          '<h3 class="dash-next-t">'+title+'</h3>'+
          '<p class="dash-next-b">'+body+'</p>'+
          '<span class="dash-next-go">'+go+' <i aria-hidden="true">&rarr;</i></span></a>';
      }

      if(!enrolled && !hasClaim){
        cards.push(card('plan.html','What is next',
          'Keep your ninety-day plan moving',
          'Your plan is open now. Courses unlock when a Certified Facilitator or Organization adds your seat.',
          'Open your plan'));
        cards.push(card('organizations.html','If you have a facilitator',
          'They add your seat when you are ready',
          'Under a minute on their side. After that, enrollment is free and waiting for you.',
          'Find a program'));
      } else if(!enrolled){
        cards.push(card('certificates.html','The courses',
          courseCount ? courseCount + ' course' + (courseCount===1?'':'s') + ' open to you' : 'The courses',
          courseCount ? 'Free. Finish one and you hold a Certificate of Completion with your name and a serial anyone can check.'
                      : 'Free to every man. Sessions logged, a signed certificate, no cost.',
          'Browse the courses'));
      } else if(remaining > 0){
        cards.push(card('certificates.html','The courses',
          remaining + ' more course' + (remaining===1?'':'s') + ' open to you',
          'You are already in ' + enrolled + '. Finish one and you hold a Certificate of Completion with your name and a serial anyone can check.',
          'Browse the courses'));
      }

      // SHOW_STORIES (build_pages.py): card rests while Stories are dark. Restore:
      // cards.push(card('stories.html','Stories','Men who have been here',
      //         'Short, honest accounts from men doing the same work. Read one when the week is hard.',
      //         'Read the stories'));

      if(other && !hasOther){
        cards.push(card('profile.html?assessment='+encodeURIComponent(other),'The other profile',
          esc(otherTitle),
          'You have taken one. The other measures different ground, and you keep both.',
          'Take this profile'));
      }

      host.innerHTML =
        '<div class="dash-next-h"><span class="eyebrow">WHAT IS NEXT</span></div>'+
        '<div class="grid-auto" style="gap:16px">'+cards.join('')+'</div>'+
        '<p class="dash-next-foot">'+
          'Taken this profile a while ago? <a class="link" href="profile.html?assessment='+encodeURIComponent(activeSlug)+'">Take '+esc(titleFor(activeSlug))+' again</a> '+
          'and the new result sits alongside the old one. Nothing is overwritten.'+
        '</p>';
    }

    /* The count already came back with the enrolment read, so this no longer
       runs its own query for the same rows. */
    if(courseCount != null) return paint(courseCount);
    if(!(window.FC && FC.live && FC.sb)) return paint(0);
    FC.sb.from('certificate_courses').select('id').eq('published', true)
      .then(function(r){ paint(((r && r.data) || []).length); }, function(){ paint(0); });
  }

  function showList(list, who){
    var active = list[0].assessment_slug;
    try {
      var q = new URLSearchParams(window.location.search).get('assessment');
      for(var i=0;i<list.length;i++){ if(q && list[i].assessment_slug === q) active = q; }
    } catch(e){}
    function pick(slug){
      for(var i=0;i<list.length;i++){
        if(list[i].assessment_slug === slug){
          paintSwitcher(list, slug, pick);
          draw(list[i], who);
          var held = list.map(function(x){ return x.assessment_slug; });
          var uid = (window.FC && FC.uid) ? FC.uid() : null;
          coursesStrip(uid, function(enrolled, total){
            var paintNext = function(hasClaim){
              nextStrip(slug, held, enrolled, total || null, !!hasClaim);
            };
            if(!(window.FC && FC.live && FC.sb && uid)){ paintNext(false); return; }
            FC.sb.from('participant_claims').select('id').eq('user_id', uid).limit(1)
              .then(function(cr){ paintNext(!!(cr && cr.data && cr.data.length)); },
                    function(){ paintNext(false); });
          });
          return;
        }
      }
    }
    pick(active);
  }

  /* 1) Marcus mock. The deterministic sample, shown as a named participant. */
  function showMarcus(){
    draw(window.FCReport.sampleResult(), 'Marcus Bennett');
    say('<b>Demonstration dashboard.</b> <span class="fine">This is exactly what a participant named Marcus sees the moment he finishes his profile, and every time he returns. Live participants see their own result in this same place.</span>');
  }

  /* 2) Admin view-as. Same component, the participant\u2019s data, read only. */
  function showViewAs(uid){
    loading('Loading this participant\u2019s report as they see it\u2026');
    var go = function(){
      /* His setting decides, not ours.

         The settings page offers "Let my facilitator open my report". That
         promise was not enforced anywhere: staff could open the report whether
         he had allowed it or not. A privacy control that does nothing is worse
         than no control, and for men enrolled through treatment or reentry it is
         the difference between a tool and a file kept on them.

         Staff still see that he completed it, and when. They do not see inside
         unless he has said yes. */
      FC.sb.from('profiles').select('prefs').eq('id', uid).maybeSingle().then(function(pr){
        var prefs = (pr && pr.data && pr.data.prefs) || {};
        if(prefs.share_facilitator === false){
          host.innerHTML = '<div class="card" style="padding:30px">'+
            '<h3 class="d-22" style="margin:0 0 8px">This report is private</h3>'+
            '<p class="fine" style="margin:0">He has chosen not to share it. You can still see that he completed it and when. If he wants to walk through it with you, he can open it himself or change the setting.</p></div>';
          say('<b>Private by his choice.</b> <span class="fine">Not an error, and not something to work around.</span>');
          return;
        }
        openViewAs(uid);
      }, function(){ openViewAs(uid); });
    };
    var openViewAs = function(uid){
      loadProfilesFor(uid, function(list){
        FC.sb.from('profiles').select('name,email').eq('id', uid).maybeSingle()
          .then(function(p){ showList(list, (p.data && (p.data.name || p.data.email)) || 'Participant'); },
                function(){ showList(list, 'Participant'); });
        say('<b>Admin view.</b> <span class="fine">You are seeing this participant\u2019s dashboard exactly as they see it. Read only.</span>');
      }, empty);
    };
    if(!(window.FC && FC.live)){ denied(); return; }
    FC.ready.then(function(){
      if(window.FCR && FCR.guard){ FCR.guard(['admin']).then(function(ok){ ok ? go() : denied(); }, go); }
      else go();
    }, denied);
  }

  /* 3) The participant\u2019s own dashboard. */
  function showOwn(){
    if(!(window.FC && FC.live)){ showMarcus(); return; }   // no keys: demonstrate with Marcus
    loading();
    FC.ready.then(function(){
      var uid = FC.uid && FC.uid();
      if(!uid){ signedOut(); return; }
      loadProfilesFor(uid, function(list){
        showList(list, '');
        if(done) say('<b>Your report is ready.</b> <span class="fine">It will live here from now on. Print it, email it to yourself, or come back any time.</span>');
      }, empty);
    }, empty);
  }

  if(demo)  return showMarcus();
  if(asUid) return showViewAs(asUid);
  return showOwn();
})();
