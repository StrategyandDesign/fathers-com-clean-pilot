/* Returning Home homebase. One room after login: his name, the report,
   the three trainings with Session N of N, and the writings. */
(function(){
  var root = document.getElementById('rhHome');
  if(!root) return;

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function firstName(){
    var s = window.FC && FC.session;
    var u = s && s.user;
    var meta = u && u.user_metadata;
    var n = (meta && (meta.full_name || meta.name)) || (u && u.email) || '';
    n = String(n).trim();
    if(!n) return '';
    if(n.indexOf('@')>=0) return n.split('@')[0];
    return n.split(/\s+/)[0];
  }
  function fmt(iso){
    try { return new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
    catch(e){ return ''; }
  }
  function playerHref(slug){
    return (window.FCPath && FCPath.playerHref) ? FCPath.playerHref(slug) : ('course.html?preview=1&cert='+slug);
  }
  function courses(){
    return (window.FCPath && FCPath.courses) ? FCPath.courses : [];
  }
  function packFor(slug){
    return (window.FC_COURSE_DEMO && FC_COURSE_DEMO[slug]) || null;
  }
  function localState(slug){
    var progress={}, passes={}, writings={};
    try {
      var st = JSON.parse(localStorage.getItem('fc-cw-preview-'+slug)||'{}');
      progress = st.progress || {};
      passes = st.passes || {};
      writings = st.writings || {};
    } catch(e){}
    try {
      var w = JSON.parse(localStorage.getItem('fc-cw-preview-'+slug+'-writings')||'{}');
      if(w && typeof w==='object') writings = Object.assign({}, writings, w);
    } catch(e){}
    return { progress:progress, passes:passes, writings:writings };
  }
  function sessionDone(v, st){
    var w = st.writings[v.id];
    if(w && w.savedAt) return true;
    if(st.passes[v.id]) return true;
    var p = st.progress[v.id];
    return !!(p && p.completed);
  }
  function titleOf(slug){
    var list = courses();
    for(var i=0;i<list.length;i++){ if(list[i].slug===slug) return list[i].title; }
    var pack = packFor(slug);
    return (pack && pack.title) || slug;
  }

  var serverBySlug = {};
  var serverWritings = [];

  function mergeServer(rows){
    (rows||[]).forEach(function(row){
      var slug = row.course_slug;
      if(!serverBySlug[slug]) serverBySlug[slug] = { ids:{}, rows:[] };
      if(row.video_id) serverBySlug[slug].ids[row.video_id] = true;
      serverBySlug[slug].rows.push(row);
      serverWritings.push(row);
    });
  }

  function progressFor(slug){
    var pack = packFor(slug);
    var videos = (pack && pack.videos) || [];
    var st = localState(slug);
    var done = 0;
    var next = 0;
    videos.forEach(function(v, i){
      var ok = sessionDone(v, st) || !!(serverBySlug[slug] && serverBySlug[slug].ids[v.id]);
      if(ok){ done += 1; next = i+1; }
    });
    if(serverBySlug[slug] && serverBySlug[slug].rows.length > done){
      done = Math.min(videos.length, serverBySlug[slug].rows.length);
      next = done;
    }
    if(next >= videos.length) next = Math.max(0, videos.length-1);
    return { total: videos.length, done: done, next: next };
  }

  function writingsList(){
    var out = [];
    courses().forEach(function(c){
      var st = localState(c.slug);
      var pack = packFor(c.slug);
      var videos = (pack && pack.videos) || [];
      var seen = {};
      videos.forEach(function(v, i){
        var w = st.writings[v.id];
        if(!w || !w.savedAt) return;
        seen[v.id] = true;
        out.push({
          slug: c.slug, title: c.title, session: v.title || ('Session '+(i+1)),
          ord: v.ord || (i+1), savedAt: w.savedAt,
          learned: w.learned||'', meaning: w.meaning||'', apply: w.apply||'', share: w.share||''
        });
      });
      (serverBySlug[c.slug] && serverBySlug[c.slug].rows || []).forEach(function(row){
        if(seen[row.video_id]) return;
        out.push({
          slug: c.slug, title: titleOf(c.slug),
          session: row.session_title || ('Session '+(row.session_ord||'')),
          ord: row.session_ord || 0, savedAt: row.saved_at,
          learned: row.learned||'', meaning: row.meaning||'', apply: row.apply||'', share: row.share||''
        });
      });
    });
    out.sort(function(a,b){ return String(b.savedAt||'').localeCompare(String(a.savedAt||'')); });
    return out;
  }

  function paint(){
    var name = firstName();
    var signed = !!(window.FC && FC.uid && FC.uid());
    var rec = (window.FCPath && FCPath.hasReport && FCPath.hasReport() && FCPath.courseForFocus)
      ? FCPath.courseForFocus(FCPath.focusKey && FCPath.focusKey())
      : null;
    var hasReport = !!(window.FCPath && FCPath.hasReport && FCPath.hasReport());

    var h1 = name ? ('Welcome back, '+name+'.') : 'Welcome back.';
    document.getElementById('rhHomeH').textContent = h1;

    var report = document.getElementById('rhHomeReport');
    if(hasReport && rec){
      report.innerHTML =
        '<p class="rh-home-k">Your report</p>'+
        '<p class="rh-home-copy">Your report named '+esc(rec.title)+'. That is the next training.</p>'+
        '<p class="rh-home-links"><a href="report.html">Read the report</a> · <a href="'+esc(playerHref(rec.slug))+'">Start '+esc(rec.title)+'</a></p>';
    } else {
      report.innerHTML =
        '<p class="rh-home-k">Your report</p>'+
        '<p class="rh-home-copy">The Profile is a short set of honest questions. You get a private report of where you stand as a father. It takes eight minutes. Nobody is grading you.</p>'+
        '<p class="rh-home-links"><a href="profile.html?start=quick&amp;path=rh">Take the Profile</a></p>';
    }

    var train = document.getElementById('rhHomeTrainings');
    var list = courses().slice();
    if(rec){
      list.sort(function(a,b){
        if(a.slug===rec.slug) return -1;
        if(b.slug===rec.slug) return 1;
        return 0;
      });
    }
    train.innerHTML = '<p class="rh-home-k">Your trainings</p>'+list.map(function(c){
      var p = progressFor(c.slug);
      var start = !!(rec && c.slug===rec.slug);
      var label = p.total ? ('Session '+Math.min(p.done+1, p.total)+' of '+p.total) : (c.span||'');
      if(p.done>=p.total && p.total) label = 'Finished. '+p.total+' of '+p.total;
      else if(p.done) label = 'Session '+(p.done+1)+' of '+p.total;
      var go = p.done ? 'Resume' : (start ? 'Start here' : 'Start');
      return '<a class="rh-home-row'+(start?' is-start':'')+'" href="'+esc(playerHref(c.slug))+'">'+
        '<span><span class="rh-home-row-t">'+esc(c.title)+'</span>'+
        '<span class="rh-home-row-m">'+esc(label)+'</span></span>'+
        '<span class="rh-home-go">'+esc(go)+'</span></a>';
    }).join('');

    var work = document.getElementById('rhHomeWork');
    var writes = writingsList();
    var keep = signed
      ? 'Saved to your account and this device.'
      : 'Saved on this device. An account keeps it.';
    if(!writes.length){
      work.innerHTML =
        '<p class="rh-home-k">Your work</p>'+
        '<p class="rh-home-copy">Finish a session. The four answers live here.</p>'+
        '<p class="rh-home-keep">'+esc(keep)+'</p>';
    } else {
      work.innerHTML = '<p class="rh-home-k">Your work</p>'+writes.slice(0,12).map(function(w){
        return '<article class="rh-home-write">'+
          '<p class="rh-home-write-h">'+esc(w.session)+' · '+esc(w.title)+(w.savedAt?' · '+esc(fmt(w.savedAt)):'')+'</p>'+
          (w.learned?'<p><b>What did you learn?</b> '+esc(w.learned)+'</p>':'')+
          (w.meaning?'<p><b>What does that mean to you?</b> '+esc(w.meaning)+'</p>':'')+
          (w.apply?'<p><b>How can you apply this moving forward?</b> '+esc(w.apply)+'</p>':'')+
          (w.share?'<p><b>What else would you like to share?</b> '+esc(w.share)+'</p>':'')+
        '</article>';
      }).join('')+'<p class="rh-home-keep">'+esc(keep)+'</p>';
    }

    var guest = document.getElementById('rhHomeGuest');
    if(guest){
      if(signed) guest.hidden = true;
      else {
        guest.hidden = false;
        guest.innerHTML = 'An account keeps this home. <a href="login.html?path=rh&amp;next=rh-home.html">Log in</a> · <a href="login.html?path=rh&amp;mode=signup&amp;next=rh-home.html">Create account</a>';
      }
    }
  }

  function loadServerThenPaint(){
    paint();
    if(!window.FC || !FC.ready) return;
    FC.ready.then(function(){
      paint();
      var uid = FC.uid && FC.uid();
      if(!uid || !FC.sb) return;
      FC.sb.from('session_writings')
        .select('course_slug,session_ord,session_title,learned,meaning,apply,share,saved_at,video_id')
        .eq('user_id', uid)
        .then(function(r){
          if(r && r.data) mergeServer(r.data);
          paint();
        }, function(){ paint(); });
    });
  }

  loadServerThenPaint();
})();
