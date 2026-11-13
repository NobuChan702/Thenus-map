(function(){
const T=window._thenus; if(!T||!window.L)return;
const map=T.map,ctl=T.ctl,toLL=T.toLL,esc=T.esc,DM=T.DM,CFG=T.CFG,params=T.params;
const W=2048,H=1948,MAXN=200,LIM={name:40,note:280,by:24};
let base=String((CFG.live&&CFG.live.dbUrl)||'').trim();
const ov=params.get('livedb'); if(ov&&/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(ov))base=ov;
let dbRoot='',dbQs='';
try{if(base){const u=new URL(base);if(u.protocol!=='https:'&&!/^(127\.0\.0\.1|localhost)$/.test(u.hostname))throw 0;
  if(!/(\.firebaseio\.com|\.firebasedatabase\.app)$/.test(u.hostname)&&!/^(127\.0\.0\.1|localhost)$/.test(u.hostname))throw 0;
  dbRoot=u.origin+u.pathname.replace(/\/+$/,'');dbQs=u.search;}}catch(e){dbRoot='';}
const ON=!!dbRoot, TS={'.sv':'timestamp'};
const url=p=>dbRoot+p+'.json'+dbQs;
const req=(method,p,body)=>fetch(url(p),{method,cache:'no-store',body:body===undefined?undefined:JSON.stringify(body)})
  .then(r=>{if(!r.ok){const e=new Error(r.status===401||r.status===403?'the map server refused that change':'map server error '+r.status);e.status=r.status;throw e;}return r.json();});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Math.round(+v||0)));
const cut=(s,n)=>String(s==null?'':s).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,n);

const stream=(path,onData,onStatus)=>{let cache=null,es=null,timer=null,dead=false;
  const setAt=(keys,val)=>{if(!keys.length){cache=val;return;}if(!cache||typeof cache!=='object')cache={};let o=cache;
    for(let i=0;i<keys.length-1;i++){if(!o[keys[i]]||typeof o[keys[i]]!=='object')o[keys[i]]={};o=o[keys[i]];}
    const k=keys[keys.length-1];if(val===null)delete o[k];else o[k]=val;};
  const ev=patch=>e=>{let m;try{m=JSON.parse(e.data);}catch(x){return;}if(!m)return;const keys=String(m.path||'/').split('/').filter(Boolean);
    if(patch&&m.data&&typeof m.data==='object')Object.keys(m.data).forEach(k=>setAt(keys.concat(k.split('/').filter(Boolean)),m.data[k]));else setAt(keys,m.data);
    onStatus('live');onData(cache);};
  const poll=()=>{if(dead)return;req('GET',path).then(d=>{cache=d;onStatus('live');onData(cache);},e=>onStatus(e.status===401?'denied':'retry')).finally(()=>{timer=setTimeout(poll,5000);});};
  if(typeof EventSource==='function'){es=new EventSource(url(path));
    es.addEventListener('put',ev(false));es.addEventListener('patch',ev(true));
    es.addEventListener('cancel',()=>onStatus('denied'));
    es.onerror=()=>{if(es.readyState===2){es=null;onStatus('retry');poll();}else onStatus('retry');};}
  else poll();
  return {refresh:()=>req('GET',path).then(d=>{cache=d;onData(cache);}).catch(()=>{}),get:()=>cache,stop:()=>{dead=true;if(es)es.close();clearTimeout(timer);}};};

const PK='thenus.player.v1';
const me={get:()=>{try{return cut((JSON.parse(localStorage.getItem(PK)||'{}')||{}).name,LIM.by);}catch(e){return '';}},
  set:n=>{try{localStorage.setItem(PK,JSON.stringify({name:n}));}catch(e){}}};
const PAL=['#d6336c','#1c7ed6','#2b8a3e','#e8590c','#7048e8','#0c8599','#c92a2a','#5c940d','#9c36b5','#364fc7','#a61e4d','#087f5b','#862e9c','#1864ab'];
const colorFor=name=>{let h=0;const s=String(name).toLowerCase();for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return PAL[h%PAL.length];};
const okColor=c=>/^#[0-9a-f]{6}$/.test(c)?c:'#555555';
const valid=d=>d&&typeof d==='object'&&isFinite(d.x)&&isFinite(d.y)&&typeof d.name==='string';
const ago=t=>{if(!isFinite(t))return '';const s=(Date.now()-t)/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';
  return new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});};

map.createPane('pmarkers').style.zIndex=645;
const layer=L.layerGroup(); ctl.addOverlay(layer,'Player markers');
if(params.get('pmarkers')!=='0')layer.addTo(map);
const MK={}; let data={}, dragging=null, adding=false, msgT=null, box=null;
const icon=(d,id)=>L.divIcon({className:'',iconSize:[0,0],html:`<div class="pmk-pin" data-id="${esc(id)}" style="--c:${okColor(d.color)}"><span>${esc((d.by||d.name||'?').trim().charAt(0).toUpperCase())}</span></div><div class="pmk-lbl" style="--c:${okColor(d.color)}">${esc(d.name)}</div>`});
const say=(t,bad)=>{if(!box)return;const m=box.querySelector('.pmk-msg');m.textContent=t||'';m.classList.toggle('bad',!!bad);clearTimeout(msgT);if(t&&!bad)msgT=setTimeout(()=>{m.textContent='';},4000);};
const fail=e=>{say('Could not save: '+(e&&e.message||e)+'.',true);mk.refresh();};
const viewPop=(id)=>{const d=data[id]||{};const el=document.createElement('div');el.className='pop pmk-pop';
  el.innerHTML=`<h3>${esc(d.name)}</h3><div class="meta">Player marker · by <b style="color:${okColor(d.color)}">${esc(d.by||'?')}</b>${d.t?' · '+esc(ago(d.t)):''}</div>${d.note?`<p>${esc(d.note)}</p>`:''}<div class="pmk-btns"><button type="button" data-a="edit">Edit</button> <button type="button" data-a="del" class="del">Delete</button></div><div class="src">Anyone with the map link can see, drag, edit or delete this marker.</div>`;
  el.querySelector('[data-a=edit]').onclick=()=>setTimeout(()=>editPop(id),0); // deferred: swapping the popup DOM inside the click would let Leaflet treat it as a map click
  el.querySelector('[data-a=del]').onclick=()=>setTimeout(()=>{if(!confirm('Delete the marker “'+(d.name||'')+'” for everyone?'))return;const m=MK[id];if(m)layer.removeLayer(m);delete MK[id];delete data[id];render();
    req('DELETE','/markers/'+id).then(()=>say('Marker deleted.'),fail);},0);
  return el;};
const editPop=(id,isNew)=>{const d=data[id]||{},m=MK[id];if(!m)return;const el=document.createElement('div');el.className='pop pmk-pop pmk-edit';
  el.innerHTML=`<h3>${isNew?'New marker':'Edit marker'}</h3><label>Name<input data-f="name" maxlength="${LIM.name}" value="${esc(isNew?'':d.name)}" placeholder="e.g. Check out this cave"></label><label>Note (optional)<textarea data-f="note" rows="3" maxlength="${LIM.note}">${esc(d.note||'')}</textarea></label><div class="pmk-btns"><button type="button" data-a="save">Save</button> <button type="button" data-a="cancel" class="alt">Cancel</button></div><div class="src">Drag the marker to move it.</div>`;
  m._editing=true;m.setPopupContent(el);if(!m.isPopupOpen())m.openPopup();
  const nm=el.querySelector('[data-f=name]'),nt=el.querySelector('[data-f=note]');setTimeout(()=>nm.focus(),50);
  const save=()=>{const name=cut(nm.value,LIM.name)||'Marker',note=cut(nt.value,LIM.note);m._editing=false;
    if(isNew){const rec={name,note,by:d.by,color:d.color,x:d.x,y:d.y,t:TS};data[id]=Object.assign({},rec,{t:Date.now()});m.setIcon(icon(data[id],id));m.setPopupContent(viewPop(id));m.closePopup();render();
      m._saving=true;req('PUT','/markers/'+id,rec).then(()=>{m._saved=true;say('Marker added. Everyone can see it now.');if(m._pending&&data[id]){m._pending=false;req('PATCH','/markers/'+id,{x:data[id].x,y:data[id].y,t:TS}).catch(fail);}},e=>{delete data[id];layer.removeLayer(m);delete MK[id];render();fail(e);});}
    else{Object.assign(data[id]||{},{name,note,t:Date.now()});m.setIcon(icon(data[id],id));m.setPopupContent(viewPop(id));m.closePopup();
      req('PATCH','/markers/'+id,{name,note,t:TS}).then(()=>say('Saved.'),fail);}};
  el.querySelector('[data-a=save]').onclick=()=>setTimeout(save,0);
  nm.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();setTimeout(save,0);}});
  el.querySelector('[data-a=cancel]').onclick=()=>setTimeout(()=>{m._editing=false;if(isNew){layer.removeLayer(m);delete MK[id];delete data[id];render();}else{m.setPopupContent(viewPop(id));m.closePopup();}},0);};
const addMarker=(id,d)=>{const m=L.marker(toLL(d.x,d.y),{pane:'pmarkers',draggable:ON,icon:icon(d,id),title:d.name,keyboard:false,autoPan:true});m._id=id;
  m.bindPopup(()=>viewPop(id),{minWidth:220,className:'pmk-popup',offset:[0,-36]});
  m.on('popupclose',()=>{if(m._editing&&m._isNew&&!m._saved){layer.removeLayer(m);delete MK[id];delete data[id];render();}m._editing=false;});
  m.on('popupopen',()=>{if(!m._editing)m.setPopupContent(viewPop(id));});
  m.on('dragstart',()=>{dragging=id;m.closePopup();});
  m.on('dragend',()=>{const ll=m.getLatLng(),x=clamp(ll.lng,0,W),y=clamp(-ll.lat,0,H);dragging=null;m.setLatLng(toLL(x,y));
    if(!data[id])return;Object.assign(data[id],{x,y});
    if(m._isNew&&!m._saved){if(m._saving)m._pending=true;return;}   // not on the server yet: the save (or its follow-up) carries x,y
    req('PATCH','/markers/'+id,{x,y,t:TS}).then(()=>say('Moved.'),fail);});
  layer.addLayer(m);MK[id]=m;return m;};
const render=()=>{Object.keys(MK).forEach(id=>{if(!data[id]&&!MK[id]._editing){layer.removeLayer(MK[id]);delete MK[id];}});
  Object.keys(data).forEach(id=>{const d=data[id];if(!/^m[01][0-9][0-9]$/.test(id)||!valid(d))return;let m=MK[id];
    if(!m){addMarker(id,d);return;}
    if(dragging!==id){const ll=m.getLatLng();if(Math.round(ll.lng)!==Math.round(d.x)||Math.round(-ll.lat)!==Math.round(d.y))m.setLatLng(toLL(d.x,d.y));}
    const sig=d.name+'|'+d.color+'|'+d.by;if(m._sig!==sig){m._sig=sig;m.setIcon(icon(d,id));m.options.title=d.name;}
    if(m.isPopupOpen()&&!m._editing)m.setPopupContent(viewPop(id));});
  if(box){const n=Object.keys(data).filter(id=>valid(data[id])&&data[id].t).length;box.querySelector('.pmk-n').textContent=ON?'('+n+')':'';
    }};
const mk=ON?stream('/markers',d=>{const keep={};Object.keys(MK).forEach(id=>{if(MK[id]._isNew&&!MK[id]._saved&&data[id])keep[id]=data[id];});
    data=Object.assign({},d&&typeof d==='object'?JSON.parse(JSON.stringify(d)):{},keep);
    render();},
  st=>{if(!box)return;const s=box.querySelector('.pmk-st');s.className='pmk-st '+st;s.title=st==='live'?'Connected: changes appear for everyone within a second or two':st==='denied'?'The map server refused access (check the database rules)':'Reconnecting to the map server…';}):{refresh:()=>{}};

const freeSlot=()=>{const used=new Set(Object.keys(data));const free=[];for(let i=0;i<MAXN;i++){const id='m'+String(i).padStart(3,'0');if(!used.has(id))free.push(id);}
  return free.length?free[Math.floor(Math.random()*free.length)]:null;};
const setAdding=v=>{adding=v;const b=box&&box.querySelector('.pmk-add');if(b){b.classList.toggle('on',v);b.textContent=v?'Click the map… (Esc to cancel)':'+ Add marker';}
  map.getContainer().classList.toggle('pmk-adding',v);};
map.on('click',e=>{if(!adding)return;setAdding(false);const id=freeSlot();if(!id){say('The map already has '+MAXN+' player markers. Delete some first.',true);return;}
  const by=me.get()||'Player',d={name:'New marker',note:'',by,color:colorFor(by),x:clamp(e.latlng.lng,0,W),y:clamp(-e.latlng.lat,0,H)};
  data[id]=d;if(!map.hasLayer(layer))layer.addTo(map);const m=addMarker(id,d);m._isNew=true;m._saved=false;editPop(id,true);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&adding)setAdding(false);});

const ctlBox=L.control({position:'bottomright'});ctlBox.onAdd=()=>{const d=L.DomUtil.create('div','pmk-box');box=d;
  d.innerHTML=`<div class="pmk-hd"><b>Player markers</b> <span class="pmk-n"></span> <span class="pmk-st" title="Connecting…"></span><button type="button" class="pmk-min" title="Hide or show this box" aria-label="Hide or show">–</button></div>
  <div class="pmk-body"><div class="pmk-me"></div><div class="pmk-who" hidden><label>Your name, shown on your markers<input maxlength="${LIM.by}" placeholder="e.g. Ricki"></label><button type="button" class="pmk-ok">OK</button></div>
  <button type="button" class="pmk-add">+ Add marker</button><div class="pmk-msg"></div></div>`;
  L.DomEvent.disableClickPropagation(d);L.DomEvent.disableScrollPropagation(d);
  const who=d.querySelector('.pmk-who'),wi=who.querySelector('input'),meEl=d.querySelector('.pmk-me'),add=d.querySelector('.pmk-add');
  const showMe=()=>{const n=me.get();meEl.innerHTML=n?`You: <span class="pmk-sw" style="background:${okColor(colorFor(n))}"></span><b>${esc(n)}</b> <button type="button" class="pmk-link">change</button>`:'';
    const l=meEl.querySelector('.pmk-link');if(l)l.onclick=()=>{who.hidden=false;wi.value=me.get();wi.focus();};};
  let then=null;
  const ok=()=>{const n=cut(wi.value,LIM.by);if(!n){wi.focus();return;}me.set(n);who.hidden=true;showMe();if(then){const f=then;then=null;f();}};
  d.querySelector('.pmk-ok').onclick=ok;wi.addEventListener('keydown',e=>{if(e.key==='Enter')ok();});
  add.onclick=()=>{if(!ON)return;if(adding){setAdding(false);return;}if(!me.get()){then=()=>setAdding(true);who.hidden=false;wi.focus();return;}setAdding(true);};
  d.querySelector('.pmk-min').onclick=()=>{d.classList.toggle('min');try{localStorage.setItem('thenus.pmk.min',d.classList.contains('min')?'1':'');}catch(e){}};
  try{if(localStorage.getItem('thenus.pmk.min')==='1'||(window.innerWidth<700&&localStorage.getItem('thenus.pmk.min')!==''))d.classList.add('min');}catch(e){}
  if(!ON){add.disabled=true;d.querySelector('.pmk-st').className='pmk-st off';d.querySelector('.pmk-st').title='Not connected';
    d.querySelector('.pmk-msg').textContent='Shared player markers are not switched on for this map yet.';}
  showMe();return d;};ctlBox.addTo(map);
render();

const PARTY=T.party, orig=PARTY&&PARTY.P&&PARTY.P.position?Object.assign({},PARTY.P.position):null;
let liveParty=null;
const applyParty=d=>{const m=PARTY&&PARTY.marker,pos=PARTY&&PARTY.pos;if(!m||!pos)return;
  if(d&&isFinite(d.x)&&isFinite(d.y)){liveParty=d;
    
    if(m.dragging&&m.dragging._draggable&&m.dragging._draggable._moving)return;
    Object.assign(pos,{x:clamp(d.x,0,W),y:clamp(d.y,0,H),date:String(d.date||''),note:String(d.note||''),t:+d.t||0});delete pos.approx;
    
    m.setLatLng(toLL(pos.x,pos.y));m.setPopupContent(PARTY.pop(pos));}
  else{liveParty=null;if(!DM&&orig){Object.keys(pos).forEach(k=>delete pos[k]);Object.assign(pos,orig);m.setLatLng(toLL(pos.x,pos.y));m.setPopupContent(PARTY.pop(pos));}}
  };
let lfSync=null;
if(ON&&PARTY&&PARTY.marker)stream('/party/pos',applyParty,()=>{});


window.__thenusLive={on:ON,markers:()=>data};
})();
