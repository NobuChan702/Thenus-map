(function(){
const D=window.THENUS_DATA, W=2048, H=1948;
const params=new URLSearchParams(location.search);
const CFG=Object.assign({build:'home',version:'18',daysPerUnit:1/24.35},window.THENUS_CONFIG||{});
if(params.get('build')==='module'||params.get('build')==='home')CFG.build=params.get('build');
const V='?v='+CFG.version, DM=false;

const art=s=>{const u=CFG.build==='module'?(s.emblem||''):(s.token||s.emblem||'');return u?u+V:'';};
document.documentElement.dataset.build=CFG.build;
const toLL=(x,y)=>L.latLng(-y,x);
const bounds=L.latLngBounds(toLL(0,H),toLL(W,0));
const MAXZ=CFG.maxZoom||4.5;
const map=L.map('map',{crs:L.CRS.Simple,minZoom:-2.5,maxZoom:MAXZ,zoomSnap:0.25,zoomDelta:0.5,wheelPxPerZoomLevel:90,
  maxBounds:bounds.pad(0.12),attributionControl:false});
map.fitBounds(bounds);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const geo=(data,opts)=>L.geoJSON(data,Object.assign({coordsToLatLng:c=>toLL(c[0],c[1])},opts));
map.createPane('compass').style.zIndex=350;
const travelGrid=L.layerGroup();   // v16, filled further down

const Z7=window.THENUS_Z7||null;
const z7has=(x,y)=>{if(!Z7)return false;if(x<0||y<0||x>=Z7.w||y>=Z7.h)return false;const i=y*Z7.w+x;return (Z7.bits.charCodeAt(i>>2)-48)>>(i&3)&1;};
const DeepTiles=L.TileLayer.extend({createTile:function(c,done){
  if(c.z>=4&&!z7has(c.x,c.y)){const cv=document.createElement('canvas');cv.width=cv.height=256;const im=new Image();
    im.onload=()=>{const g=cv.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(im,(c.x&1)*128,(c.y&1)*128,128,128,0,0,256,256);done(null,cv);};
    im.onerror=()=>done(null,cv);im.src='tiles/6/'+(c.x>>1)+'/'+(c.y>>1)+'.webp'+V;return cv;}
  return L.TileLayer.prototype.createTile.call(this,c,done);}});
const tiles=()=>new DeepTiles('tiles/{z}/{x}/{y}.webp'+V,{tileSize:256,minZoom:-3,maxZoom:MAXZ,minNativeZoom:-3,maxNativeZoom:Z7?4:3,zoomOffset:3,
  bounds:bounds,noWrap:true,keepBuffer:3,updateWhenZooming:false});
const painted=tiles();
const regionInfo={}; D.labels.regions.forEach(r=>regionInfo[r.name]=r);
const regionPop=(name)=>{const r=regionInfo[name]||{};return `<div class="pop"><h3>${esc(name)}</h3><div class="meta">Geographic / cultural region (not a realm)</div><p>${esc(r.canon||'')}</p>${r.danger?`<p class="danger"><b>Dangers:</b> ${esc(r.danger)}</p>`:''}${''}</div>`;};
const regionAreas=(fill)=>geo(D.regions,{style:f=>({color:f.properties.color,weight:0,fillColor:f.properties.color,fillOpacity:fill}),
  onEachFeature:(f,l)=>l.bindPopup(regionPop(f.properties.name))});
const DAYU=1/CFG.daysPerUnit;
const spheres=L.layerGroup();
(D.labels.spheres||[]).filter(sp=>DM||!sp.dm).forEach(sp=>{const N=7;
  for(let i=N;i>=1;i--)spheres.addLayer(L.circle(toLL(sp.x,sp.y),{radius:sp.r*i/N,stroke:false,fillColor:sp.color,fillOpacity:0.13,interactive:false}));
  spheres.addLayer(L.circle(toLL(sp.x,sp.y),{radius:sp.r,color:sp.color,weight:2,opacity:.85,dashArray:'3 5',fill:true,fillOpacity:0})
    .bindPopup(`<div class="pop"><h3>${esc(sp.seat)}: sphere of influence</h3><p>${esc(sp.holder)}. Roughly the city and its immediate surroundings (about ${(sp.r/DAYU).toFixed(1).replace('.0','')} day${sp.r/DAYU>1.05?'s':''}' travel); it does not rule the wider region.</p><p class="meta">Outside these circles, towns and villages are independent.</p>${''}</div>`,{maxWidth:Math.min(300,window.innerWidth-60)}));});
const political=L.layerGroup([tiles(),spheres]);
painted.addTo(map);
L.imageOverlay('data/compass.svg'+V,L.latLngBounds(toLL(25,370),toLL(395,0)),{pane:'compass'}).addTo(map);

const borders=geo(D.borders,{style:{color:'#fbf6ea',weight:2.2,opacity:.85,dashArray:'8 7',lineCap:'round',interactive:false}}).addTo(map);
const labels=L.layerGroup();
const LBLS=[];
const PRI={'city-lbl':5,'village':4,'lm-lbl':3,'region-lbl':2,'sea-lbl':1};
const lbl=(x,y,cls,html,rot)=>{const m=L.marker(toLL(x,y),{interactive:false,keyboard:false,
  icon:L.divIcon({className:'lbl '+cls,html:`<div class="lbl-inner" style="--rot:${rot||0}deg">${html}</div>`,iconSize:[0,0]})});
  m._pri=cls.indexOf('village')>=0?PRI.village:(PRI[cls.split(' ')[0]]||1);m._cls=cls;LBLS.push(m);return m;};
const scrollSVG='<svg viewBox="0 0 100 26" preserveAspectRatio="none"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e9c6"/><stop offset=".55" stop-color="#e8d19c"/><stop offset="1" stop-color="#c8a464"/></linearGradient></defs>'+
 '<path d="M8,6 L0,8 L5,15 L0,22 L10,21 Z" fill="#b48f55" stroke="#4a3520" stroke-width=".8" vector-effect="non-scaling-stroke"/>'+
 '<path d="M92,6 L100,8 L95,15 L100,22 L90,21 Z" fill="#b48f55" stroke="#4a3520" stroke-width=".8" vector-effect="non-scaling-stroke"/>'+
 '<path d="M8,3 Q50,0 92,3 L92,23 Q50,20 8,23 Z" fill="url(#sg)" stroke="#4a3520" stroke-width="1.2" vector-effect="non-scaling-stroke"/></svg>';
const LP={};
D.labels.seas.forEach(s=>labels.addLayer(lbl(s.x,s.y,'sea-lbl',esc(s.name),s.rot)));
D.labels.regions.forEach(r=>{const rm=lbl(r.x,r.y,'region-lbl',esc(r.name),r.rot);rm.options.interactive=true;
  rm.bindPopup(()=>regionPop(r.name),{maxWidth:Math.min(320,window.innerWidth-60)});labels.addLayer(rm);
  LP['region:'+r.name]=rm;});
D.labels.cities.forEach(c=>{
  const tree=c.name.indexOf('Tree')>=0, vil=c.kind==='village';
  labels.addLayer(L.marker(toLL(c.x,c.y),{icon:L.divIcon({className:'',html:`<div class="city-dot${tree?' tree':''}${vil?' village':''}"></div>`,iconSize:[0,0]})})
    .bindPopup(`<div class="pop"><h3>${esc(c.name)}</h3>${c.full?`<div class="meta">${esc(c.full)}</div>`:''}<div class="meta">${c.status?`<b>${esc(c.status)}</b> · `:''}${esc(c.region)} (geographic region)</div><p>${esc(c.canon)}</p>${c.known?`<div class="meta"><b>What the party has seen</b></div><ul class="known">${c.known.map(k=>`<li>${esc(k)}</li>`).join('')}</ul>`:''}${''}</div>`));
  LP[c.name]=labels.getLayers()[labels.getLayers().length-1];
  labels.addLayer(lbl(c.x,c.y,'city-lbl'+(c.kind==='village'?' village':''),`<div class="scroll">${scrollSVG}${esc(c.name)}</div>`,0));
});
(D.labels.landmarks||[]).forEach(l=>{
  const title=l.suggestedName||l.name;
  const m=L.marker(toLL(l.px,l.py),{icon:L.divIcon({className:'',iconSize:[0,0],html:`<div class="lm-hit${l.pin?' lm-pin '+l.kind:''}"></div>`})})
    .bindPopup(`<div class="pop"><h3>${esc(title)}</h3>${l.suggestedName?`<div class="meta">${esc(l.name)}</div>`:''}<p>${esc(l.canon)}</p>${''}</div>`);
  labels.addLayer(m); LP[title]=m;
  labels.addLayer(lbl(l.x,l.y,'lm-lbl'+(l.kind?' '+l.kind:''),esc(title),0));});
(D.labels.ports||[]).forEach(pt=>{   // ports. Public: unlabeled harbor symbol unless data gives it a name.
  const m=L.marker(toLL(pt.x,pt.y),{icon:L.divIcon({className:'',iconSize:[0,0],html:'<div class="port-sym" title="">⚓</div>'}),interactive:DM||!!pt.name,keyboard:false});
  if(pt.name){m.bindPopup(`<div class="pop"><h3>${esc(pt.name)}</h3><div class="meta">Port</div></div>`);LP[pt.name]=m;
    const pl=lbl(pt.x,pt.y,'city-lbl village port',`<div class="scroll">${scrollSVG}${esc(pt.name)}</div>`,0);pl._pri=3.5;labels.addLayer(pl);}
  
  labels.addLayer(m);});
labels.addTo(map);

const SP=D.creatures.species, act={day:true,night:true,unset:true};
const creatures=L.layerGroup().addTo(map);
const popupHTML=s=>{
  const a=s.activity==='night'?'☾ Night':s.activity==='day'?'☀ Day':('');
  return `<div class="pop"><div class="hd"><img src="${art(s)}" alt=""><div><h3>${esc(s.name)}</h3><div class="meta">${esc(s.size||'')} · ${esc(s.tier||'')}</div></div></div>
  ${s.habitat?`<p><b>Habitat:</b> ${esc(s.habitat)}</p>`:''}
  ${a?`<p><b>Active:</b> ${a}</p>`:''}
  ${s.desc?`<p>${esc(s.desc)}</p>`:''}${''}</div>`;};
const toks=D.creatures.tokens.map(t=>{
  const s=SP[t.name];
  const badge=s.activity==='night'?'<span class="badge" title="Nocturnal">☾</span>':s.activity==='day'?'<span class="badge" style="background:#e9a93a;color:#fff">☀</span>':'';
  const tierCls=s.tier==='Rend'?'rend':s.tier==='Kael'?'kael':'tier-x';
  const m=L.marker(toLL(t.x,t.y),{riseOnHover:true,
    icon:L.divIcon({className:'',iconSize:[0,0],html:`<div class="tok ${tierCls}"><img src="${art(s)}" alt="${esc(s.name)}" loading="lazy" decoding="async" draggable="false"><span class="ring"></span>${badge}</div>`})});
  m.bindTooltip(esc(s.name),{direction:'top',offset:[0,0],className:'tok-tip',opacity:1});
  m.bindPopup(popupHTML(s),{maxWidth:Math.min(320,window.innerWidth-60),autoPanPadding:[20,20]}); m._t=t; m._s=s; return m;});
const HL={name:null,hideOthers:false};
const refresh=()=>{
  const z=map.getZoom(), c0=map.getContainer();
  const vb=map.getBounds().pad(0.25);
  toks.forEach(m=>{const hl=HL.name&&m._s.name===HL.name;
    const show=hl||(!(HL.name&&HL.hideOthers)&&act[m._s.activity]&&z>=m._t.minZoom-1e-6&&(m._t.minZoom<0||vb.contains(m.getLatLng())));
    if(show&&!creatures.hasLayer(m))creatures.addLayer(m); else if(!show&&creatures.hasLayer(m))creatures.removeLayer(m);
    const el=m.getElement&&m.getElement(); if(el&&el.firstChild){el.firstChild.classList.toggle('hl',!!hl);el.style.zIndex=hl?5000:'';}});
  c0.style.setProperty('--cz',Math.pow(2,z).toFixed(4));
  const c=map.getContainer();
  c.style.setProperty('--ls',Math.max(.6,Math.min(1.9,Math.pow(1.3,z+0.6))).toFixed(3));
  c.style.setProperty('--ts',Math.round(Math.max(window.innerWidth<700?18:26,Math.min(56,(window.innerWidth<700?26:34)+7*z)))+'px');
};
map.on('zoomend moveend',refresh);refresh();
const DN=L.control({position:'topright'});
DN.onAdd=()=>{const d=L.DomUtil.create('div','dnf');const n={day:0,night:0,unset:0};
  Object.values(SP).forEach(s=>n[s.activity]++);
  const opts=Object.keys(SP).sort().map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');
  d.innerHTML='<details'+(window.innerWidth<700?'':' open')+'><summary><b>Creatures</b></summary><div class="dnf-body"><i class="sub">Activity</i>'+['day','night','unset'].map(k=>`<label><input type="checkbox" data-k="${k}" checked> ${k==='day'?'☀ Day':k==='night'?'☾ Night':('○ Any time')} (${n[k]} species)</label>`).join('<br>')+
    `<label class="cf"><i class="sub">Find creature</i><select class="cf-sel"><option value="">All creatures</option>${opts}</select></label><label><input type="checkbox" class="cf-hide"> Hide other creatures</label></div></details>`;
  L.DomEvent.disableClickPropagation(d);L.DomEvent.disableScrollPropagation(d);
  d.addEventListener('change',e=>{if(e.target.dataset.k){act[e.target.dataset.k]=e.target.checked;refresh();}
    else if(e.target.classList.contains('cf-sel')){e.target.value?highlight(e.target.value):clearHL();}
    else if(e.target.classList.contains('cf-hide')){HL.hideOthers=e.target.checked;refresh();}});return d;};
DN.addTo(map);
const hint=L.control({position:'bottomleft'});hint.onAdd=()=>{const d=L.DomUtil.create('div','hint');d.textContent='Zoom in to reveal more creature tokens · click a token for its bestiary entry';return d;};hint.addTo(map);
map.on('overlayadd overlayremove',()=>{DN.getContainer().style.display=map.hasLayer(creatures)?'':'none';});

const P=window.THENUS_PARTY||{name:'Party',position:null,trail:[]};
const LSK='thenus.party.dm.v1';
let pos=P.position?Object.assign({},P.position):null;

map.createPane('party').style.zIndex=640;
const crest='<svg viewBox="0 0 60 78" width="100%" height="100%"><defs><linearGradient id="pb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8312a"/><stop offset="1" stop-color="#6e1414"/></linearGradient></defs>'+
 '<rect x="27" y="0" width="6" height="78" rx="2" fill="#5a3b1d" stroke="#2a1a0b"/><circle cx="30" cy="4" r="5" fill="#e7b85a" stroke="#5a3b1d"/>'+
 '<path d="M6 12 H54 V48 L30 64 L6 48 Z" fill="url(#pb)" stroke="#f1d58a" stroke-width="3"/>'+
 '<path d="M30 22 L35 34 L48 35 L38 43 L41 55 L30 48 L19 55 L22 43 L12 35 L25 34 Z" fill="#f1d58a" stroke="#5a1010" stroke-width="1"/></svg>';
const partyIcon=L.divIcon({className:'',iconSize:[0,0],html:`<div class="party-tok${DM?' dm':''}">${crest}<div class="party-lbl">${esc(P.name||'Party')}</div></div>`});
const partyPop=p=>`<div class="pop"><h3>${esc(P.name||'Party')}</h3><div class="meta">${esc(p.date||'')}</div><p>${esc(p.note||'')}</p>${''}</div>`;
const partyLayer=L.layerGroup(), journey=L.layerGroup();
let partyM=null;

if(pos){partyM=L.marker(toLL(pos.x,pos.y),{pane:'party',icon:partyIcon,draggable:DM,title:P.name||'Party',zIndexOffset:2000}).bindPopup(partyPop(pos));
  partyM.on('drag',()=>{const ll=partyM.getLatLng();pos.x=Math.round(ll.lng);pos.y=Math.round(-ll.lat);});
  partyM.on('dragend',()=>{pos.approx=false;try{localStorage.setItem(LSK,JSON.stringify(pos));}catch(e){}partyM.setPopupContent(partyPop(pos));});
  partyLayer.addLayer(partyM);partyLayer.addTo(map);}
if(P.start){partyLayer.addLayer(L.marker(toLL(P.start.x,P.start.y),{pane:'party',icon:L.divIcon({className:'',iconSize:[0,0],html:'<div class="jstart">⚑</div>'})})
  .bindTooltip(esc(P.start.name),{direction:'top',offset:[0,-16]}).bindPopup(`<div class="pop"><h3>${esc(P.start.name)}</h3><p>The party's journey began here.</p></div>`));if(!map.hasLayer(partyLayer))partyLayer.addTo(map);}


map.createPane('routes').style.zIndex=420;
const routes=L.layerGroup();
(D.routes&&D.routes.features||[]).forEach(f=>{
  if(f.geometry.type==='LineString'){const ll=f.geometry.coordinates.map(c=>toLL(c[0],c[1])),pr=f.properties;
    const tip=`<b>${esc(pr.canonName||'Known route')}</b>${pr.from?`<br>${esc(pr.from)} ↔ ${esc(pr.to)}`:''}`;
    routes.addLayer(L.polyline(ll,{pane:'routes',color:'#f4e4bf',weight:5.5,opacity:.55,lineCap:'round',lineJoin:'round',interactive:false}));
    routes.addLayer(L.polyline(ll,{pane:'routes',color:'#6b4423',weight:2.6,opacity:.95,dashArray:'7 6',lineCap:'round',lineJoin:'round'}).bindTooltip(tip,{sticky:true}));}
  else routes.addLayer(L.marker(toLL(f.geometry.coordinates[0],f.geometry.coordinates[1]),{pane:'routes',icon:L.divIcon({className:'',iconSize:[0,0],html:'<div class="bridge"></div>'})}).bindTooltip('Bridge'));});
routes.addTo(map);
const routeW=()=>{const z=map.getZoom(),k=Math.max(1,Math.min(1.6,1.6-0.2*z));routes.eachLayer(l=>{if(l.setStyle&&l.options.dashArray)l.setStyle({weight:2.6*k});else if(l.setStyle)l.setStyle({weight:5.5*k});});};
map.on('zoomend',routeW);routeW();





let visitedLayer=L.layerGroup();
if(!DM){((window.THENUS_PINS&&window.THENUS_PINS.pins)||[]).filter(p=>p&&isFinite(p.x)&&isFinite(p.y)).forEach(p=>visitedLayer.addLayer(
  L.marker(toLL(+p.x,+p.y),{pane:'party',draggable:false,title:String(p.name||'Place visited'),icon:L.divIcon({className:'',iconSize:[0,0],html:`<div class="vp-pin"><span>⚑</span></div><div class="vp-lbl">${esc(p.name||'')}</div>`})})
  .bindPopup(`<div class="pop"><h3>${esc(p.name||'Place visited')}</h3>${p.date?`<div class="meta">${esc(p.date)}</div>`:''}${p.note?`<p>${esc(p.note)}</p>`:''}</div>`)));
  visitedLayer.addTo(map);}


map.createPane('ambient').style.zIndex=340;map.getPane('ambient').style.pointerEvents='none';
const Ambient=L.Layer.extend({onAdd(m){
  const c=L.DomUtil.create('div','amb-clouds',m.getContainer());
  for(let i=0;i<7;i++){const d=L.DomUtil.create('div','amb-cloud',c);d.style.top=(4+i*13+Math.random()*6)+'%';
    d.style.animationDuration=(110+Math.random()*90)+'s';d.style.animationDelay=(-Math.random()*200)+'s';d.style.setProperty('--cs',(0.7+Math.random()*0.6).toFixed(2));}
  this._c=c;const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 '+W+' '+H);
  s.innerHTML='<defs><mask id="amb-sea" maskUnits="userSpaceOnUse" x="0" y="0" width="'+W+'" height="'+H+'"><image href="data/seamask.png'+V+'" x="0" y="0" width="'+W+'" height="'+H+'" preserveAspectRatio="none"/></mask>'+
    '<pattern id="amb-wv" width="46" height="23" patternUnits="userSpaceOnUse"><path d="M2 8q6-4 12 0t12 0M25 19q6-4 12 0t12 0" fill="none" stroke="#eef8fa" stroke-width="1.1" stroke-linecap="round"/>'+
    '<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="46 0" dur="16s" repeatCount="indefinite"/></pattern></defs>'+
    '<g mask="url(#amb-sea)"><rect class="amb-wave" width="'+W+'" height="'+H+'" fill="url(#amb-wv)"/></g>';
  this._w=L.svgOverlay(s,bounds,{interactive:false,pane:'ambient'}).addTo(m);
  this._z=()=>{s.style.display=m.getZoom()>2.25?'none':'';};m.on('zoomend',this._z);this._z();},
  onRemove(m){this._c.remove();m.removeLayer(this._w);m.off('zoomend',this._z);}});
const ambient=new Ambient();
const Frame=L.Layer.extend({onAdd(m){const c=m.getContainer();c.classList.add('framed');
  const f=L.DomUtil.create('div','pframe',c);f.innerHTML='<i class="pf-c tl"></i><i class="pf-c tr"></i><i class="pf-c bl"></i><i class="pf-c br"></i>'+
   '<svg class="rose" viewBox="-50 -50 100 100" aria-hidden="true"><circle r="31" fill="none" stroke="#4a3520" stroke-width="1.2"/><circle r="27" fill="none" stroke="#4a3520" stroke-width=".6" stroke-dasharray="1.5 2.2"/>'+
   '<g fill="#e9d6a6" stroke="#4a3520" stroke-width=".8"><path d="M0-25 4-4 25 0 4 4 0 25-4 4-25 0-4-4Z" transform="rotate(45)"/></g>'+
   '<g stroke="#3b2614" stroke-width=".8"><path d="M0-44 6-6 0 0Z" fill="#7a5428"/><path d="M0-44-6-6 0 0Z" fill="#f6e8c4"/><path d="M0 44-6 6 0 0Z" fill="#7a5428"/><path d="M0 44 6 6 0 0Z" fill="#f6e8c4"/>'+
   '<path d="M44 0 6 6 0 0Z" fill="#7a5428"/><path d="M44 0 6-6 0 0Z" fill="#f6e8c4"/><path d="M-44 0-6-6 0 0Z" fill="#7a5428"/><path d="M-44 0-6 6 0 0Z" fill="#f6e8c4"/></g>'+
   '<circle r="3" fill="#7a5428" stroke="#3b2614" stroke-width=".8"/><text y="-46" text-anchor="middle" font-family="Thenus Fell,Georgia,serif" font-size="11" fill="#3b2614">N</text></svg>';
  this._f=f;},onRemove(m){this._f.remove();m.getContainer().classList.remove('framed');}});
const frame=new Frame();if(params.get('frame')!=='0')frame.addTo(map);
if(params.get('anim')==='1')ambient.addTo(map);
const ctl=L.control.layers({'Painted terrain':painted,'Spheres of influence':political},{'Region borders (geographic)':borders,'Labels &amp; cities':labels,'Known travel routes':routes,'Creature tokens':creatures,'Party':partyLayer,'Places visited':visitedLayer,'Travel days (grid)':travelGrid,'Map frame &amp; compass':frame,'Ambient animation (clouds &amp; water)':ambient},{collapsed:window.innerWidth<700,position:'topright'}).addTo(map);


if(params.get('mode')==='political'){map.removeLayer(painted);political.addTo(map);}
if(params.get('nocreatures')==='1'){map.removeLayer(creatures);DN.getContainer().style.display='none';}
if(params.get('view')){const [x,y,z]=params.get('view').split(',').map(Number);map.setView(toLL(x,y),z,{animate:false});refresh();}
if(params.get('popup')){const c=map.getCenter(),ms=toks.filter(m=>m._s.name===params.get('popup'));
  const m=ms.sort((p,q)=>c.distanceTo(p.getLatLng())-c.distanceTo(q.getLatLng()))[0];
  if(m){map.setView(m.getLatLng(),map.getZoom(),{animate:false});if(!creatures.hasLayer(m))creatures.addLayer(m);setTimeout(()=>{m.openPopup();const e=m.getPopup().getElement();if(e)e.style.opacity=1;},1200);}}
if(params.get('party')==='1'&&pos){map.setView(toLL(pos.x,pos.y),map.getZoom(),{animate:false});refresh();}
if(params.get('noroutes')==='1')map.removeLayer(routes);

map.createPane('title').style.zIndex=355;
L.marker(toLL(210,262),{pane:'title',interactive:false,keyboard:false,icon:L.divIcon({className:'',iconSize:[0,0],
  html:'<div class="cartouche"><div class="ct-in"><span class="ct-orn">❦</span><span class="ct-title">Thenus</span><span class="ct-orn r">❦</span></div></div>'})}).addTo(map);
const vg=document.createElement('div');vg.className='vignette';map.getContainer().appendChild(vg);
const zcls=()=>{const z=map.getZoom(),c=map.getContainer();
  c.classList.toggle('z-far',z<-1.25);c.classList.toggle('z-mid',z>=-1.25&&z<0.75);c.classList.toggle('z-near',z>=0.75&&z<2.25);c.classList.toggle('z-deep',z>=2.25);};
const declutter=()=>{if(!map.hasLayer(labels))return;
  const boxes=[];const pad=1;
  document.querySelectorAll('.city-dot,.lm-pin').forEach(e=>{const r=e.getBoundingClientRect();if(r.width){const b=[r.left+1,r.top+1,r.right-1,r.bottom-1];b.src=e.className;boxes.push(b);}});
  const items=LBLS.filter(m=>labels.hasLayer(m)&&m.getElement()).sort((a,b)=>b._pri-a._pri);
  items.forEach(m=>{const el=m.getElement(),inner=el.firstChild;inner.style.visibility='';});
  items.forEach(m=>{const inner=m.getElement().firstChild;
    if(getComputedStyle(inner).display==='none')return;
    const r=inner.getBoundingClientRect();if(!r.width)return;
    const b=[r.left-pad,r.top-pad,r.right+pad,r.bottom+pad];
    const hit=boxes.some(o=>!(b[2]<=o[0]||b[0]>=o[2]||b[3]<=o[1]||b[1]>=o[3]));
    if(hit&&m._pri<5){inner.style.visibility='hidden';const o=boxes.find(o=>!(b[2]<=o[0]||b[0]>=o[2]||b[3]<=o[1]||b[1]>=o[3]));inner.dataset.hit=(o.src||'label')+':'+o.map(Math.round).join(',')+' me:'+b.map(Math.round).join(',');}else{b.src=m._cls;boxes.push(b);}});};
map.on('zoomend moveend',()=>{zcls();setTimeout(declutter,30);});zcls();setTimeout(declutter,300);
const DAY=1/CFG.daysPerUnit;
const sb=L.control({position:'bottomleft'});sb.onAdd=()=>{const d=L.DomUtil.create('div','scalebar');
  d.innerHTML='<div class="sb-bar"><span></span><span></span><span></span><span></span></div><div class="sb-lbl"></div>'+('');
  const upd=()=>{const ppu=Math.pow(2,map.getZoom());let best=0.5;for(const n of [0.5,1,2,3,5,10,15,20,30]){if(n*DAY*ppu<=170)best=n;}
    if(DAY*ppu>=36&&DAY*ppu<=340)best=1;
    d.querySelector('.sb-bar').style.width=(best*DAY*ppu).toFixed(0)+'px';d.querySelector('.sb-lbl').textContent=best===0.5?'½ day':best+(best===1?' day':' days');};
  map.on('zoomend',upd);upd();return d;};sb.addTo(map);
map.createPane('tgrid').style.zIndex=360;
(()=>{const G=CFG.travelGrid||{spacing:21.083,angles:[60,-60],offsets:[10.28,10.18]};
  G.angles.forEach((ang,k)=>{const nx=Math.cos(ang*Math.PI/180),ny=Math.sin(ang*Math.PI/180);
    const vals=[0,W].flatMap(x=>[0,H].map(y=>x*nx+y*ny)),lo=Math.min(...vals),hi=Math.max(...vals);
    for(let c=G.offsets[k]+Math.ceil((lo-G.offsets[k])/G.spacing)*G.spacing;c<=hi;c+=G.spacing){
      const P=[];
      if(Math.abs(ny)>1e-9){[0,W].forEach(x=>{const y=(c-x*nx)/ny;if(y>=0&&y<=H)P.push([x,y]);});}
      if(Math.abs(nx)>1e-9){[0,H].forEach(y=>{const x=(c-y*ny)/nx;if(x>=0&&x<=W)P.push([x,y]);});}
      if(P.length>=2)travelGrid.addLayer(L.polyline([toLL(...P[0]),toLL(...P[1])],{pane:'tgrid',color:'#1c1208',weight:1.5,opacity:0.78,interactive:false,className:'tgrid-line'}));}});})();
const meas={on:false,pts:[],layer:L.layerGroup().addTo(map)};
const msr=L.control({position:'topleft'});msr.onAdd=()=>{const d=L.DomUtil.create('div','measure');
  d.innerHTML='<button type="button" class="ms-btn" title="Click points on the map to measure travel time">📏 Measure (days)</button><div class="ms-out" hidden><div class="ms-total"></div><ol class="ms-legs"></ol><div class="ms-help">Click the map to add points · double-click or Finish to stop</div><button type="button" class="ms-fin">Finish</button> <button type="button" class="ms-clr">Clear</button></div>';
  L.DomEvent.disableClickPropagation(d);L.DomEvent.disableScrollPropagation(d);
  const btn=d.querySelector('.ms-btn'),out=d.querySelector('.ms-out'),tot=d.querySelector('.ms-total'),legs=d.querySelector('.ms-legs'),help=d.querySelector('.ms-help'),fin=d.querySelector('.ms-fin');
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])*CFG.daysPerUnit;
  const fmt=v=>v.toFixed(1)+(v.toFixed(1)==='1.0'?' day':' days');
  const draw=()=>{meas.layer.clearLayers();const P=meas.pts;
    if(P.length>1){meas.layer.addLayer(L.polyline(P.map(p=>toLL(p[0],p[1])),{color:'#fff6dc',weight:6,opacity:.75,interactive:false}));
      meas.layer.addLayer(L.polyline(P.map(p=>toLL(p[0],p[1])),{color:'#7a1a14',weight:2.6,dashArray:'8 6',interactive:false}));}
    let t=0;const L2=[];
    P.forEach((p,i)=>{meas.layer.addLayer(L.circleMarker(toLL(p[0],p[1]),{radius:4.5,color:'#7a1a14',weight:2,fillColor:'#f1d58a',fillOpacity:1,interactive:false}));
      if(i>0){const v=dist(P[i-1],p);t+=v;L2.push(v);const m=[(P[i-1][0]+p[0])/2,(P[i-1][1]+p[1])/2];
        meas.layer.addLayer(L.marker(toLL(m[0],m[1]),{interactive:false,keyboard:false,icon:L.divIcon({className:'',iconSize:[0,0],html:`<div class="ms-leg">${v.toFixed(1)} d</div>`})}));}});
    tot.innerHTML=`<b>Total: ${fmt(t)}</b>`+(P.length<2?' <i>(add points)</i>':'');
    legs.innerHTML=L2.map((v,i)=>`<li>Leg ${i+1}: ${fmt(v)}</li>`).join('');};
  const setOn=on=>{meas.on=on;btn.classList.toggle('on',on);map.getContainer().classList.toggle('measuring',on);
    help.hidden=!on;fin.hidden=!on;if(on){out.hidden=false;map.doubleClickZoom.disable();}else{setTimeout(()=>map.doubleClickZoom.enable(),300);}};
  btn.onclick=()=>{if(meas.on){setOn(false);}else{meas.pts=[];draw();setOn(true);}};
  fin.onclick=()=>setOn(false);
  d.querySelector('.ms-clr').onclick=()=>{meas.pts=[];draw();setOn(false);out.hidden=true;};
  map.on('click',e=>{if(!meas.on)return;meas.pts.push([e.latlng.lng,-e.latlng.lat]);draw();});
  map.on('dblclick',()=>{if(meas.on)setOn(false);});
  msr._api={add:(x,y)=>{meas.pts.push([x,y]);draw();},start:()=>{meas.pts=[];draw();setOn(true);},finish:()=>setOn(false)};
  return d;};msr.addTo(map);
const lg=L.control({position:'bottomright'});lg.onAdd=()=>{const d=L.DomUtil.create('div','legend');
  const sw=(c,t)=>`<div class="lg-row"><span class="sw" style="background:${c}"></span>${t}</div>`;
  const ic=(h,t)=>`<div class="lg-row"><span class="ic">${h}</span>${t}</div>`;
  d.innerHTML=`<details${window.innerWidth<700||params.get('legend')==='0'?'':(params.get('legend')==='1'?' open':'')}><summary><b>Legend</b></summary><div class="lg-body">
  <div class="lg-h">Places</div>${ic('<span class="city-dot"></span>','City')}${ic('<span class="city-dot village"></span>','Village')}${ic('<span class="lm-pin-ic"></span>','Landmark')}${ic('<span class="lg-ruin">⛫</span>','Ruins')}${ic('<span class="lg-cav"></span>','Great Cavern')}
  <div class="lg-h">Lines</div>${ic('<span class="ln route"></span>','Known travel route')}${ic('<span class="bridge lg"></span>','Bridge')}${ic('<span class="ln border"></span>','Geographic region border')}${ic('<span class="lg-sph"></span>','Sphere of influence (Spheres view)')}
  <div class="lg-h">Land</div>${sw('#b8a46a','Grassland / savanna')}${sw('#e2c487','Desert')}${sw('#4f6a3c','Forest')}${sw('#3c5838','Deep forest / jungle')}${sw('#b97a3c','Autumn woods')}${sw('#6c7448','Marsh / wetland')}${sw('#a99273','Mountains')}${sw('#56463f','Volcanic foothills')}${sw('#e9ecef','Snow / peaks')}
  <div class="lg-h">Tokens</div>${ic('<span class="lg-tok kael"></span>','Kael-tier creature')}${ic('<span class="lg-tok rend"></span>','Rend-tier creature')}${ic('<span class="badge lgb">☾</span>','Night-active')}${ic('<span class="badge lgb day">☀</span>','Day-active')}${ic('<span class="lg-party"></span>','The party')}
  </div></details>`;
  L.DomEvent.disableClickPropagation(d);L.DomEvent.disableScrollPropagation(d);return d;};lg.addTo(map);
const IDX=[];
D.labels.cities.forEach(c=>IDX.push({t:c.name,k:c.kind==='village'?'Village':'City',x:c.x,y:c.y,go:()=>LP[c.name]}));
(D.labels.landmarks||[]).forEach(l=>IDX.push({t:l.suggestedName||l.name,k:l.kind==='cavern'?'Great Cavern':'Landmark',x:l.px,y:l.py,go:()=>LP[l.suggestedName||l.name]}));
D.labels.regions.forEach(r=>IDX.push({t:r.name,k:'Region',x:r.x,y:r.y,region:r}));
D.labels.seas.forEach(r=>IDX.push({t:r.name,k:'Sea',x:r.x,y:r.y}));
(D.labels.ports||[]).forEach(pt=>{if(pt.name)IDX.push({t:pt.name,k:'Port',x:pt.x,y:pt.y,go:()=>LP[pt.name]});});
Object.keys(SP).forEach(n=>IDX.push({t:n,k:'Creature',n:toks.filter(m=>m._s.name===n).length,creature:true}));
const chip=L.control({position:'topleft'});
const highlight=(name,anim=true)=>{HL.name=name;if(!map.hasLayer(creatures))creatures.addTo(map);map.getContainer().classList.add('hl-mode');
  const ms=toks.filter(m=>m._s.name===name);refresh();
  if(ms.length){const b=L.latLngBounds(ms.map(m=>m.getLatLng())).pad(0.3);if(anim)map.flyToBounds(b,{maxZoom:0,duration:0.8});else map.fitBounds(b,{maxZoom:0,animate:false});}
  chipEl.innerHTML=`<img src="${art(SP[name])}" alt=""><b>${esc(name)}</b> × ${ms.length} <button type="button" class="hl-clear" title="Clear highlight">Clear ✕</button>`;chipEl.hidden=false;
  chipEl.querySelector('.hl-clear').onclick=clearHL;const sel=document.querySelector('.cf-sel');if(sel)sel.value=name;};
const clearHL=()=>{HL.name=null;map.getContainer().classList.remove('hl-mode');chipEl.hidden=true;const sel=document.querySelector('.cf-sel');if(sel)sel.value='';refresh();};
let chipEl;
const srch=L.control({position:'topleft'});srch.onAdd=()=>{const d=L.DomUtil.create('div','search');
  d.innerHTML='<input type="search" placeholder="Search places &amp; creatures…" aria-label="Search places and creatures" autocomplete="off"><ul class="sr" hidden></ul><div class="hl-chip" hidden></div>';
  L.DomEvent.disableClickPropagation(d);L.DomEvent.disableScrollPropagation(d);
  const inp=d.querySelector('input'),ul=d.querySelector('.sr');chipEl=d.querySelector('.hl-chip');
  const pick=it=>{ul.hidden=true;inp.value=it.t;inp.blur();
    if(it.creature){highlight(it.t);return;}
    const ll=toLL(it.x,it.y),z=Math.max(map.getZoom(),it.k==='Region'||it.k==='Sea'?-0.5:1);
    map.flyTo(ll,z,{duration:0.8});
    map.once('moveend',()=>{const m=it.go&&it.go();if(m&&m.openPopup){if(!map.hasLayer(labels))labels.addTo(map);m.openPopup();}
      else if(it.region)L.popup({maxWidth:Math.min(300,window.innerWidth-60)}).setLatLng(ll).setContent(regionPop(it.region.name)).openOn(map);});};
  const show=()=>{const q=inp.value.trim().toLowerCase();if(!q){ul.hidden=true;return;}
    const res=IDX.filter(it=>it.t.toLowerCase().includes(q)).sort((a,b)=>(a.t.toLowerCase().indexOf(q)-b.t.toLowerCase().indexOf(q))||a.t.localeCompare(b.t)).slice(0,12);
    ul.innerHTML=res.length?res.map((it,i)=>`<li data-i="${IDX.indexOf(it)}"><span>${esc(it.t)}</span><em>${it.k}${it.creature?' · '+it.n:''}</em></li>`).join(''):'<li class="none">No matches</li>';ul.hidden=false;};
  inp.addEventListener('input',show);inp.addEventListener('focus',show);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){const li=ul.querySelector('li[data-i]');if(li)pick(IDX[+li.dataset.i]);}if(e.key==='Escape'){ul.hidden=true;}});
  ul.addEventListener('click',e=>{const li=e.target.closest('li[data-i]');if(li)pick(IDX[+li.dataset.i]);});
  return d;};srch.addTo(map);
if(window.innerWidth<700){const h=document.querySelector('.hint');if(h)h.style.display='none';}
if(params.get('hl')){highlight(params.get('hl'),false);}
if(params.get('mlayers')==='1'){ctl.expand();const d=document.querySelector('.dnf details');if(d)d.open=true;}
if(params.get('q')){const inp=document.querySelector('.search input');inp.value=params.get('q');inp.dispatchEvent(new Event('input'));}
window._thenusMap=map;
/* ---- v17.1 live hook (BEGIN): read by live.js (player markers + live party flag). Keep this block when merging v18. ---- */
window._thenus={map,ctl,toLL,esc,DM,CFG,params,party:{P,LSK,pop:p=>partyPop(p),get pos(){return pos;},get marker(){return partyM;}}};
/* ---- v17.1 live hook (END) ---- */
if(params.get('grid')==='1')travelGrid.addTo(map);
if(params.get('measure')){const v=params.get('measure').split(';').map(p=>p.split(',').map(Number));setTimeout(()=>{msr._api.start();v.forEach(p=>msr._api.add(p[0],p[1]));if(params.get('mfinish')==='1')msr._api.finish();},400);}
if(params.get('lpopup')&&LP[params.get('lpopup')]){const m=LP[params.get('lpopup')];setTimeout(()=>{m.openPopup();const e=m.getPopup().getElement();if(e)e.style.opacity=1;},1500);}
})();
