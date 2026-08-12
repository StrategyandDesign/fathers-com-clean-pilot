/* Admin dashboard controller */
(function(){
  var demo = !(window.FC && FC.live);
  function el(id){return document.getElementById(id);}
  function show(){el('app').style.display='';}
  function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function boot(){
    if(demo){ el('demo-note').style.display=''; show(); loadContent(); return; }
    FCR.guard(['admin']).then(function(ok){
      if(!ok){ el('denied').style.display=''; return; }
      show(); loadPeople(); loadContent(); loadInstruments(); loadOrgs(); loadAudit();
    });
  }

  function loadPeople(){
    FC.sb.from('profiles').select('id,name,email').order('created_at',{ascending:false}).then(function(r){
      var rows=r.data||[];
      // fetch roles per user
      FC.sb.from('user_roles').select('user_id,role,org_id').then(function(rr){
        var byUser={};(rr.data||[]).forEach(function(x){(byUser[x.user_id]=byUser[x.user_id]||[]).push(x);});
        var html='<table class="dtable"><thead><tr><th>Name</th><th>Email</th><th>Roles</th><th></th></tr></thead><tbody>';
        rows.forEach(function(p){
          var chips=(byUser[p.id]||[]).map(function(x){return '<span class="rolechip '+x.role+'">'+x.role+(x.org_id?' ·org':'')+'</span>';}).join('')||'<span class="fine">member</span>';
          html+='<tr><td>'+esc(p.name||'-')+'</td><td class="fine">'+esc(p.email)+'</td><td>'+chips+'</td>'+
            '<td class="inline-actions"><button class="btn btn-secondary mini" data-revoke="'+p.id+'">Manage</button></td></tr>';
        });
        html+='</tbody></table>';
        el('people-table').innerHTML=html;
        el('people-table').querySelectorAll('[data-revoke]').forEach(function(b){
          b.addEventListener('click',function(){manage(b.dataset.revoke, byUser[b.dataset.revoke]||[]);});
        });
      });
    });
  }

  function manage(uid, roles){
    if(!roles.length){toast('This user has only the default member role.');return;}
    var names=roles.map(function(x){return x.role;}).join(', ');
    if(confirm('Revoke all roles ('+names+') from this user?')){
      Promise.all(roles.map(function(x){return FC.sb.from('user_roles').delete().eq('user_id',uid).eq('role',x.role).eq('org_id',x.org_id||null);}))
        .then(function(){audit('revoke_roles',uid,{roles:names});toast('Roles revoked.');loadPeople();});
    }
  }

  function grant(){
    var email=el('gr-email').value.trim(), role=el('gr-role').value;
    if(!email){el('gr-msg').textContent='Enter an email.';return;}
    FC.sb.from('profiles').select('id').eq('email',email).maybeSingle().then(function(r){
      if(!r.data){el('gr-msg').textContent='No user with that email yet. They must sign in once first.';return;}
      FC.sb.from('user_roles').insert({user_id:r.data.id,role:role}).then(function(res){
        if(res.error){el('gr-msg').textContent='Failed: '+res.error.message;return;}
        audit('grant_role',r.data.id,{role:role});
        el('gr-msg').textContent='Granted '+role+' to '+email+'.';el('gr-email').value='';loadPeople();
      });
    });
  }

  function loadContent(){
    var host=el('content-table');
    var SLUG_PAGE={fundamentals:'course-fathering-fundamentals.html',reentry:'course-coming-home-present.html',anger:'course-steady-under-pressure.html',coparenting:'course-same-team.html',manhood:'course-the-man-before-you.html'};
    var EXPECTED={fundamentals:9,reentry:12,anger:12,coparenting:12,manhood:6};
    function paintCerts(courses, counts){
      var html='<div class="eyebrow" style="margin:0 0 10px">CERTIFICATE COURSES (PRODUCT TRUTH)</div>';
      html+='<table class="dtable"><thead><tr><th>Course</th><th>Sessions</th><th>Films live</th><th>Status</th><th></th></tr></thead><tbody>';
      (courses||[]).forEach(function(c){
        var n=counts[c.id]||{sessions:0,films:0};
        var sess=n.sessions||EXPECTED[c.slug]||0;
        var page=SLUG_PAGE[c.slug];
        var link=page?'<a class="btn btn-secondary mini" href="'+page+'">Course page</a>':'';
        html+='<tr><td>'+esc(c.title)+'<div class="fine mono">'+esc(c.slug)+'</div></td>'+
          '<td class="mono">'+sess+'</td><td class="mono">'+n.films+'</td>'+
          '<td><span class="pubdot '+(c.published?'on':'off')+'"></span>'+(c.published?'Published':'Draft')+'</td>'+
          '<td class="inline-actions">'+link+'</td></tr>';
      });
      if(!(courses||[]).length){
        html+='<tr><td colspan="5" class="fine">No certificate_courses rows yet. Paste content/SEED-CONTENT.sql in the SQL editor, or keep the static short-course pages as the public source of truth.</td></tr>';
      }
      html+='</tbody></table>';
      return html;
    }
    function paintClasses(rows){
      var html='<div class="eyebrow" style="margin:22px 0 10px">LEGACY CLASS LIBRARY</div>';
      html+='<table class="dtable"><thead><tr><th>Class</th><th>Instructor</th><th>Lessons</th><th>Status</th></tr></thead><tbody>';
      if(!(rows||[]).length){
        html+='<tr><td colspan="4" class="fine">No legacy classes. The four film courses above are the live catalog.</td></tr>';
      } else {
        rows.forEach(function(c){
          html+='<tr><td>'+esc(c.title)+'</td><td class="fine">'+esc(c.instructor||'-')+'</td><td class="mono">'+(c.lesson_count||0)+'</td>'+
            '<td><span class="pubdot '+(c.published?'on':'off')+'"></span>'+(c.published?'Published':'Draft')+'</td></tr>';
        });
      }
      return html+'</tbody></table>';
    }
    if(!(window.FC&&FC.live)){
      var demo=[
        {id:'d1',slug:'fundamentals',title:'Fathering Fundamentals',published:true},
        {id:'d2',slug:'reentry',title:'Coming Home Present',published:true},
        {id:'d3',slug:'anger',title:'Steady Under Pressure',published:true},
        {id:'d4',slug:'coparenting',title:'Same Team',published:true}
      ];
      var counts={d1:{sessions:9,films:0},d2:{sessions:12,films:0},d3:{sessions:12,films:0},d4:{sessions:12,films:0}};
      host.innerHTML=paintCerts(demo,counts)+paintClasses([]);
      return;
    }
    Promise.all([
      FC.sb.from('certificate_courses').select('id,slug,title,published,hours').order('title'),
      FC.sb.from('course_videos').select('course_id,video_url,duration_seconds'),
      FC.sb.from('classes').select('id,title,instructor,published,lesson_count').order('created_at',{ascending:false})
    ]).then(function(rs){
      var counts={};
      ((rs[1]&&rs[1].data)||[]).forEach(function(v){
        var c=counts[v.course_id]=counts[v.course_id]||{sessions:0,films:0};
        c.sessions++;
        if(v.duration_seconds>0 && v.video_url && v.video_url!=='pending') c.films++;
      });
      host.innerHTML=paintCerts((rs[0]&&rs[0].data)||[], counts)+paintClasses((rs[2]&&rs[2].data)||[]);
    }, function(err){
      host.innerHTML='<p class="fine">Could not load content: '+esc(err&&err.message||'error')+'</p>';
    });
  }

  function loadInstruments(){
    FC.sb.from('instruments').select('title,slug,version,status').order('created_at',{ascending:false}).then(function(r){
      var rows=r.data||[];
      if(!rows.length){el('instr-table').innerHTML='<p class="fine">No instruments yet. Build one in Studio.</p>';return;}
      var html='<table class="dtable"><thead><tr><th>Instrument</th><th>Version</th><th>Status</th></tr></thead><tbody>';
      rows.forEach(function(i){html+='<tr><td>'+esc(i.title)+'</td><td class="mono">v'+i.version+'</td><td><span class="pill-status '+i.status+'">'+i.status+'</span></td></tr>';});
      el('instr-table').innerHTML=html+'</tbody></table>';
    });
  }

  function loadOrgs(){
    FC.sb.from('orgs').select('id,name,seats,renews_on').order('name').then(function(r){
      var rows=r.data||[];
      var html='<table class="dtable"><thead><tr><th>Organization</th><th>Seats</th><th>Renews</th><th></th></tr></thead><tbody>';
      rows.forEach(function(o){
        html+='<tr><td>'+esc(o.name)+'</td><td class="mono">'+o.seats+'</td><td class="fine">'+(o.renews_on||'-')+'</td>'+
          '<td class="inline-actions">'+
          '<button class="btn btn-secondary mini" data-orgadmin="'+o.id+'">+ org_admin</button>'+
          '<button class="btn btn-secondary mini" data-leader="'+o.id+'">+ leader</button></td></tr>';
      });
      el('orgs-table').innerHTML=html+'</tbody></table>';
      el('orgs-table').querySelectorAll('[data-orgadmin]').forEach(function(b){b.addEventListener('click',function(){grantScoped(b.dataset.orgadmin,'org_admin');});});
      el('orgs-table').querySelectorAll('[data-leader]').forEach(function(b){b.addEventListener('click',function(){grantScoped(b.dataset.leader,'circle_leader');});});
    });
  }

  function grantScoped(orgId, role){
    var email=prompt('Email of the user to grant '+role+' for this org:');
    if(!email) return;
    FC.sb.from('profiles').select('id').eq('email',email.trim()).maybeSingle().then(function(r){
      if(!r.data){toast('No user with that email yet.');return;}
      FC.sb.from('user_roles').insert({user_id:r.data.id,role:role,org_id:orgId}).then(function(res){
        if(res.error){toast('Failed: '+res.error.message);return;}
        audit('grant_scoped_role',r.data.id,{role:role,org:orgId});toast('Granted '+role+'.');
      });
    });
  }

  function createOrg(){
    var name=el('org-name').value.trim(), seats=parseInt(el('org-seats').value,10)||25;
    if(!name){toast('Name the org.');return;}
    FC.sb.from('orgs').insert({name:name,seats:seats}).select().single().then(function(r){
      if(r.error){toast('Failed: '+r.error.message);return;}
      audit('create_org',r.data.id,{name:name});el('org-name').value='';toast('Org created.');loadOrgs();
    });
  }

  function loadAudit(){
    FC.sb.from('audit_log').select('action,target,detail,at').order('at',{ascending:false}).limit(50).then(function(r){
      var rows=r.data||[];
      if(!rows.length){el('audit-table').innerHTML='<p class="fine">No audit entries yet.</p>';return;}
      var html='<table class="dtable"><thead><tr><th>When</th><th>Action</th><th>Detail</th></tr></thead><tbody>';
      rows.forEach(function(a){html+='<tr><td class="fine">'+new Date(a.at).toLocaleString()+'</td><td class="mono">'+esc(a.action)+'</td><td class="fine">'+esc(JSON.stringify(a.detail||{}))+'</td></tr>';});
      el('audit-table').innerHTML=html+'</tbody></table>';
    });
  }

  window.audit=function(action,target,detail){ if(window.FC&&FC.live) FC.sb.from('audit_log').insert({actor:FC.uid(),action:action,target:target,detail:detail}); };

  document.addEventListener('DOMContentLoaded',function(){
    boot();
    var g=el('gr-go'); if(g) g.addEventListener('click',grant);
    var o=el('org-go'); if(o) o.addEventListener('click',createOrg);
  });
})();
