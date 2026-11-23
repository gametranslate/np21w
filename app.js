"use strict";

const $ = selector => document.querySelector(selector);
const main = $("#main");
const modal = $("#modal");
const search = $("#search");

const symbols = {
  library: '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><path d="m15 5 3-1 4 15-3 1z"/>',
  heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>',
  history: '<path d="M3 11a9 9 0 1 1 2.8 7M3 4v7h7m2-5v6l4 2"/>',
  sliders: '<path d="M3 7h7m4 0h7M3 17h3m4 0h11"/><circle cx="12" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  book: '<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1zm0 0v15"/>',
  cpu:'<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/>',
  controller:'<path d="M8 6h8c3 0 4 2 5 6l1 4c.6 3-2 5-4 3l-3-3H9l-3 3c-2 2-5 .4-4-3l1-4c1-4 2-6 5-6Z"/><path d="M5.5 11h5m-2.5-2.5v5m8-2.5h.1m2 2h.1"/>',
  search:'<circle cx="10" cy="10" r="6.7"/><path d="m15 15 6 6"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h1m-1 6h1m-1 6h1"/>',
  play:'<path fill="currentColor" stroke="none" d="M6 3.7c0-.7.8-1.2 1.5-.8l14 8.4c.6.4.6 1.1 0 1.5l-14 8.4c-.8.5-1.5-.1-1.5-.8z"/>',
  pause:'<path d="M8 4v16m8-16v16" stroke-width="4"/>',
  folder:'<path d="M3 8V5h7l2 2h8v3M2 9h20l-3 11H4z"/>',
  sort:'<path d="M4 5h16M4 11h11M4 17h6"/>',
  down:'<path d="m6 9 6 6 6-6"/>', x:'<path d="m5 5 14 14M19 5 5 19"/>',
  import:'<path d="M12 15V3m-5 5 5-5 5 5M3 14v6h18v-6"/>',
  disk:'<path d="M3 3h15l3 3v15H3z"/><path d="M7 3v6h9V3M7 21v-8h10v8"/>',
  monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4m-5 0h10"/>',
  volume:'<path d="m3 9 4 0 5-5v16l-5-5H3zm12.5-.7a5 5 0 0 1 0 7.4m3-10.6a9 9 0 0 1 0 13.8"/>',
  keyboard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h1m2 0h1m2 0h1m2 0h1m2 0h1M6 13h1m2 0h1m2 0h1m2 0h1m-8 3h8"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  device:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M1 20h22"/>',
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
};
function icon(name) { return '<i data-icon="' + name + '" aria-hidden="true"></i>'; }
function drawIcons(root = document) {
  root.querySelectorAll('i[data-icon]:empty').forEach(el => {
    el.setAttribute("aria-hidden","true");
    el.innerHTML = '<svg viewBox="0 0 24 24">' + (symbols[el.dataset.icon] || "") + "</svg>";
  });
}
function catLogo() {
  const ctx = $("#cat").getContext("2d");
  const shape = ["......................","..##..............##..","..####..........####..","..######......######..","..##################..","..##################..",".####################.",".####################.","######################","######################","####..##########..####","####..##########..####","######################",".#########..#########.","..#####.#....#.#####..","...#####..##..#####...",".....############.....",".......########......."];
  ctx.fillStyle="#91f1b9";
  shape.forEach((row,y)=>[...row].forEach((v,x)=>{ if(v==="#") ctx.fillRect(x,y+1,1,1); }));
}
function diskIllustration(){
  const canvas = $("#disk-art");
  if (!canvas) return;
  const ctx=canvas.getContext("2d");
  function poly(points,fill){ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
  function face(x,y,back){
    ctx.save();ctx.translate(x,y);ctx.transform(1,-.16,.16,1,0,0);
    poly([[0,0],[32,0],[38,6],[38,36],[0,36]],back?"#325e48":"#a2f7c5");
    poly([[38,6],[42,8],[42,39],[38,36]],back?"#2c4a39":"#538d69");
    poly([[0,36],[38,36],[42,39],[4,39]],back?"#263d31":"#407c56");
    ctx.fillStyle=back?"#89b297":"#3c6c50";ctx.fillRect(7,0,21,12);
    ctx.fillStyle=back?"#355c45":"#a3deb4";ctx.fillRect(20,2,4,8);
    ctx.fillStyle=back?"#587c62":"#e2f9d9";ctx.fillRect(6,20,26,14);
    ctx.fillStyle=back?"#35543e":"#8eb79a";ctx.fillRect(9,23,17,1);ctx.fillRect(9,27,13,1);
    ctx.fillStyle="#3b684c";ctx.fillRect(2,31,2,2);ctx.fillRect(34,31,2,2);
    ctx.restore();
  }
  poly([[14,52],[55,44],[93,49],[53,59]],"#253e2f");
  face(48,10,true);face(25,16,false);
  [[13,23],[97,32],[78,3]].forEach(([x,y])=>{ctx.fillStyle="#80ac8a";ctx.fillRect(x-2,y,5,1);ctx.fillRect(x,y-2,1,5);});
}
const portable = window.NekoPortable;
const windowsHost = location.hostname === "nekostation.invalid" && Boolean(window.chrome?.webview);
const native = windowsHost || Boolean(portable);
const languages = {en:"English",vi:"Tiếng Việt","zh-Hans":"简体中文","zh-Hant":"繁體中文",de:"Deutsch",fr:"Français",es:"Español",it:"Italiano",ko:"한국어",ja:"日本語"};
const defaultKeys = {up:"Up",down:"Down",left:"Left",right:"Right",a:"Z",b:"X",confirm:"Enter",space:"Space",save:"F5",load:"F8",fast:"F9",pause:"F6"};
const defaults = {language:"en",scale:8,scan:false,volume:65,cpu:20,ram:13,sound:"4",slot:0,keypad:false,layout:"grid",sort:"added"};
const art = {
  lotus:{title:"Lotus Land Story",genre:"shooter",year:1998,series:"TOUHOU PROJECT  /  04"},
  rusty:{title:"Rusty",genre:"actionGenre",year:1993},policenauts:{title:"Policenauts",genre:"adventure",year:1994},
  brandish:{title:"Brandish",genre:"rpg",year:1991}
};
const storageKey="nekostation.library.v2";
const esc=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const t=key=>messages[state.settings.language][key];
const baseName=p=>p.split(/[\\/]/).pop();
const ext=p=>p.split(".").pop().toUpperCase();
const find=id=>state.games.find(g=>g.id===id);
const fold=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
function artwork(g){return Object.hasOwn(art,g?.image)?`background-image:url('assets/${g.image}.webp')`:"";}
function initialState(){
  let s;
  try{s=JSON.parse(localStorage.getItem(storageKey));}catch{}
  if(!s&&!native){
    try{
      const old=JSON.parse(localStorage.getItem("nekostation.mockup.v1"));
      if(old?.games) s={games:old.games,settings:old.settings};
    }catch{}
  }
  const games=s?.games || (native?[]:Object.entries(art).map(([id,info],i)=>({id,title:info.title,image:id,files:[info.title+([0,2].includes(i)?".hdi":".d88")],fav:i===0||i===3,added:4-i,last:i===0?1:0})));
  const settings={...defaults,...s?.settings,keys:{...defaultKeys,...s?.settings?.keys}};
  if(!Object.hasOwn(languages,settings.language))settings.language="en";
  return {games:games.filter(g=>typeof g.id==="string"&&typeof g.title==="string"&&Array.isArray(g.files)&&g.files.length),settings};
}
let state=initialState(),view="library",tab="basic",capture=null,active=null,starting=false,dragDepth=0,noticeTimer;
function persist(){
  try{localStorage.setItem(storageKey,JSON.stringify(state));}
  catch{notice(t("storageError"));}
}
function notice(message){
  const toast=$("#notice");
  (modal.open?modal:document.body).append(toast);
  toast.textContent=message;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{toast.textContent="";},4800);
}
function showError(e){notice(t(e.message)||t("error"));}
let nextRequest=0;
const pending=new Map();
function call(op,params={},files){
  if(portable)return portable.call(op,params,files);
  if(!native)return Promise.reject(new Error("browser"));
  const id=++nextRequest;
  return new Promise((resolve,reject)=>{
    pending.set(id,{resolve,reject});
    try{
      const request={id,op,...params};
      if(files)chrome.webview.postMessageWithAdditionalObjects(request,Array.from(files));
      else chrome.webview.postMessage(request);
    }catch(e){pending.delete(id);reject(e);}
  });
}
function hostMessage({data}){
  if(data.eventName){
    if(data.eventName==="ended"){
      active=null;
      if(view==="playing")view="library";
      if(modal.open&&modal.dataset.page==="session")modal.close();
      render();
    }else if(data.eventName==="hotkeyBusy")notice(t("hotkeyBusy")+" · "+data.detail);
    else if(data.eventName==="message")notice(t(data.detail)||t("error"));
    return;
  }
  const req=pending.get(data.id);
  if(req){pending.delete(data.id);data.error?req.reject(new Error(data.error)):req.resolve(data.result);}
}
if(windowsHost)chrome.webview.addEventListener("message",hostMessage);
if(portable)portable.notify=data=>hostMessage({data});
function button(act,label,symbol="",kind=""){
  return `<button class="btn ${kind}" data-act="${act}">${symbol?icon(symbol):""}${esc(label)}</button>`;
}
function heading(title,hint=""){return `<div class="titlebar"><h1>${esc(title)}</h1>${hint?"<p>"+esc(hint)+"</p>":""}</div>`;}
function applyChrome(){
  document.documentElement.lang=state.settings.language;
  document.title="NekoStation · "+t(view);
  document.querySelectorAll("nav button").forEach(b=>{
    const label=t(b.dataset.view);b.querySelector("span").textContent=label;b.setAttribute("aria-label",label);
    b.classList.toggle("active",view===b.dataset.view);
    if(view===b.dataset.view)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
  });
  $("aside.sidebar").setAttribute("aria-label",t("workspace"));
  $("nav").setAttribute("aria-label",t("workspace"));
  document.querySelectorAll(".nav-caption").forEach((el,i)=>el.textContent=t(i?"system":"collection").toLocaleUpperCase(state.settings.language));
  $(".core small").textContent=t("core").toLocaleUpperCase(state.settings.language);
  $(".crumb span").textContent=t("workspace");$("#crumb-name").textContent=t(view);
  $("#fav-count").textContent=state.games.filter(g=>g.fav).length;
  search.placeholder=t("search");search.setAttribute("aria-label",t("search"));$("#drop-overlay strong").textContent=t("drop");
}
function feature(){
  const g=[...state.games].sort((a,b)=>b.last-a.last||b.added-a.added)[0];
  const meta=art[g?.image], info=g?[meta?t(meta.genre):"PC-98",meta?.year||ext(g.files[0])].join(" · "):"HDI  /  NHD  /  D88  /  FDI";
  return `<div class="spotlights"><article class="feature ${g&&!meta?"unknown-art":""}" style="${g?artwork(g):artwork({image:"lotus"})}" ${g?'data-id="'+esc(g.id)+'"':""}>
  <span class="chip">${icon(g?.last?"history":"disk")} ${t(g?.last?"last":"library").toLocaleUpperCase(state.settings.language)}</span>
  <div class="series">${meta?.series||"PC-98"}</div><h2>${g?esc(g.title):t("first")}</h2><div class="meta">${info}</div>
  <div class="actions">${g?button("play",t("play"),"play","primary")+button("details",t("details"),"","ghost"):button("pick",t("pick"),"folder","primary")}</div></article>
  <section class="drop"><canvas id="disk-art" class="disk-art" width="110" height="62" aria-hidden="true"></canvas><h2>${t("drop")}</h2><p>HDI · NHD · D88 · FDI</p>${button("pick",t("pick"),"folder")}</section></div>`;
}
function opts(items,value){return items.map(([v,name])=>`<option value="${esc(v)}" ${String(v)===String(value)?"selected":""}>${esc(name)}</option>`).join("");}
function collection(){
  const term=fold(search.value.trim()),s=state.settings;
  const games=state.games.filter(g=>(view!=="favorite"||g.fav)&&(view!=="recent"||g.last)&&fold(g.title).includes(term));
  const order=view==="recent"?"recent":s.sort;
  games.sort((a,b)=>order==="title"?a.title.localeCompare(b.title,s.language,{numeric:true}):order==="recent"?b.last-a.last:b.added-a.added);
  const cards=games.map(g=>`<article class="card" data-id="${esc(g.id)}"><button class="card-main" data-act="details" aria-label="${t("details")} · ${esc(g.title)}">
  <div class="poster ${artwork(g)?"":"placeholder"}" style="${artwork(g)}">${artwork(g)?"":icon("disk")}</div>
  <span class="card-body"><strong>${esc(g.title)}</strong><span class="card-meta">${art[g.image]?t(art[g.image].genre):"PC-98"} · ${esc(ext(g.files[0]))}</span></span></button>
  <button class="heart ${g.fav?"on":""}" data-act="fav" aria-label="${t("favorite")} · ${esc(g.title)}" aria-pressed="${!!g.fav}">${icon("heart")}</button></article>`).join("");
  return `<section class="collection"><div class="collection-head"><div class="section-title"><h2>${t(view==="library"?"collection":view)}</h2><span class="count">${games.length}</span></div><div class="tools">
  ${view==="recent"?"":`<label class="sort">${icon("sort")}<select id="sort" aria-label="${t("sort")}">${opts([["added",t("newest")],["recent",t("last")],["title",t("titleSort")]],s.sort)}</select>${icon("down")}</label>`}
  <div class="toggle">${["grid","list"].map(k=>`<button data-layout="${k}" aria-label="${t(k)}" aria-pressed="${s.layout===k}" class="${s.layout===k?"selected":""}">${icon(k)}</button>`).join("")}</div></div></div>
  <div class="cards ${s.layout==="list"?"list":""}">${cards||'<p class="empty">'+t(term?"noResults":"empty")+'</p>'}</div></section>`;
}
function panel(label,symbol,body){return `<section class="panel"><div class="panel-heading">${icon(symbol)}<h2>${t(label)}</h2></div>${body}</section>`;}
function selectRow(label,id,items){return `<label class="setting"><strong>${t(label)}</strong><select data-setting="${id}">${opts(items,state.settings[id])}</select></label>`;}
function checkRow(label,id){return `<label class="setting"><strong>${t(label)}</strong><input type="checkbox" data-setting="${id}" ${state.settings[id]?"checked":""}></label>`;}
function keyLabel(k){return ({Up:"↑",Down:"↓",Left:"←",Right:"→",Space:"␣",Enter:"↵",Backspace:"⌫"})[k]||k;}
function bindings(ids){return '<div class="bindings">'+ids.map(id=>`<div class="binding"><span>${t(id)}</span><button class="bind-key" data-bind="${id}" aria-label="${t(id)} · ${esc(state.settings.keys[id])}">${esc(keyLabel(state.settings.keys[id]))}</button></div>`).join("")+'</div>';}
function settingsPage(){
  const s=state.settings;
  const tabs=`<div class="settings-tabs">${["basic","advanced"].map(k=>`<button class="btn ${k===tab?"primary":""}" aria-pressed="${k===tab}" data-tab="${k}">${t(k)}</button>`).join("")}</div>`;
  if(tab==="advanced"){
    const sizes=(portable?[3,7,13]:[3,7,13,31,63]).map(n=>[n,n+" MB"]);
    return heading(t("settings"),t("next"))+tabs+panel("hardware","cpu",
      selectRow("cpu","cpu",[4,8,16,20,32,42].map(n=>[n,"2.4576 MHz × "+n]))+selectRow("ram","ram",sizes)+
      selectRow("board","sound",[["2","PC-9801-26K"],["4","PC-9801-86"],["6","PC-9801-86 + 26K"]]));
  }
  const display=selectRow("scale","scale",[[8,"100%"],[12,"150%"],[16,"200%"]])+checkRow("scan","scan");
  const audio=`<div class="setting"><label for="volume">${t("volume")}</label><div class="setting-controls"><input id="volume" type="range" min="0" max="100" value="${s.volume}"><output for="volume">${s.volume}%</output>${button("testSound",t("testSound"),"volume")}</div></div>`;
  const controls=`<p>${t("bindHint")}</p>`+bindings(["up","down","left","right","a","b","confirm","space"])+selectRow("direction","keypad",[[false,t("arrows")],[true,t("keypad")]]);
  return heading(t("settings"),t("next"))+tabs+`<div class="settings-layout"><div>`+panel("language","book",selectRow("language","language",Object.entries(languages)))+
    panel("controls","controller",controls)+panel("shortcuts","keyboard",bindings(["save","load","fast","pause"])+selectRow("slot","slot",Array.from({length:10},(_,n)=>[n,String(n)]))+'<p>'+t("stateHint")+'</p><div class="actions">'+button("reset",t("reset"),"history")+'</div>')+
    '</div><div>'+panel("display","monitor",display+`<div class="preview-well"><div id="preview-frame" class="player-screen ${s.scan?"scan":""}" style="width:${(s.scale+8)*4}%"></div></div>`)+panel("sound","volume",audio)+'</div></div>';
}
function helpPage(){
  return heading(t("help"))+panel("play","play",'<p>'+t("homeHint")+'</p><p>'+t("format")+'</p>')+
    panel("multi","disk",'<p>'+t("multiHint")+'</p>')+panel("shortcuts","keyboard",'<p>'+t("stateHint")+'</p>')+
    panel("core","cpu",portable?'<p><a href="https://github.com/irori/np2-wasm" target="_blank" rel="noopener">Neko Project 21 · np2-wasm ↗</a></p>':'<p><a href="https://github.com/SimK98/np21w" target="_blank" rel="noopener">Neko Project 21/W · 0.86 rev106 ↗</a></p>');
}
function render(){
  capture=null;applyChrome();
  if(view==="playing"&&active)main.innerHTML=gamePage();
  else if(view==="settings")main.innerHTML=settingsPage();
  else if(view==="help")main.innerHTML=helpPage();
  else main.innerHTML=heading(t(view==="library"?"home":view),view==="library"?t("homeHint"):"")+
    (active?'<div class="active-session">'+icon("controller")+esc(find(active)?.title||"PC-98")+button("session",t("playing"),"arrow")+'</div>':"")+
    (view==="library"&&!search.value.trim()?feature():"")+collection()+'<div class="catalog-footer">'+icon("device")+t(native?"local":"browser")+'</div>';
  drawIcons();diskIllustration();trackSurface();
}
function navigate(next){view=next;search.value="";render();window.scrollTo(0,0);}
function dialog(page,title,body){
  const toast=$("#notice");if(toast&&modal.contains(toast))document.body.append(toast);
  modal.dataset.page=page;
  modal.innerHTML=`<div class="dialog-head"><h2 id="dialog-title">${esc(title)}</h2><button class="iconbtn" data-act="close" aria-label="${t("close")}">${icon("x")}</button></div><div class="dialog-body">${body}</div>`;
  drawIcons(modal);if(!modal.open)modal.showModal();
}
function details(g){
  dialog("details",g.title,`<div data-id="${esc(g.id)}"><div class="detail-art ${artwork(g)?"":"placeholder"}" style="${artwork(g)}">${artwork(g)?"":icon("disk")}</div>
  <ul class="detail-list">${g.files.map(p=>'<li title="'+esc(p)+'">'+icon("disk")+esc(baseName(p))+'</li>').join("")}</ul>
  <div class="actions">${button("play",t("play"),"play","primary")}${button("fav",t("favorite"),"heart",g.fav?"marked":"")}${button("remove",t("remove"))}</div></div>`);
}
function gamePage(){
  const g=find(active);
  const floppy=g.files.some(p=>["D88","FDI"].includes(ext(p)));
  return '<div class="game-head"><div class="titlebar"><h1>'+esc(g.title)+'</h1></div>'+button("to-library",t("library"),"library")+'</div>'+
    '<section class="game-display"><div id="play-surface" aria-label="'+t("playing")+'"></div></section>'+
    '<div class="game-tools">'+button("fullscreen",t("fullscreen")+" · F11","monitor","primary")+["pause","save","load","fast",...(floppy?["disk1","disk2"]:[])].map(k=>button(k,t(k))).join("")+button("stop",t("stop"),"x")+'</div>';
}
async function launch(g){
  if(!native){notice(t("browser"));return;}
  if(active===g.id){navigate("playing");return;}
  if(starting||active){notice(t("busy"));return;}
  starting=true;
  try {
    await call("launch",{game:g.id,paths:g.files,settings:state.settings,exitLabel:t("exitFull")});
    active=g.id;g.last=Date.now();persist();if(modal.open)modal.close();navigate("playing");
  }catch(e){showError(e);}finally{starting=false;}
}
function diskTitle(path){
  const stem=baseName(path).replace(/\.[^.]+$/,"");
  return stem.replace(/[\s._\-(\[]+(?:disk(?:ette)?|disc|đĩa|side)[\s._-]*[a-z0-9]+(?:\s*of\s*\d+)?[)\]]?$/i,"").replaceAll("_"," ").trim()||stem;
}
async function importPaths(paths){
  if(!paths?.length)return;
  const groups=new Map();let skipped=0;
  for(const path of paths){
    if(!/\.(hdi|nhd|d88|fdi)$/i.test(path)){skipped++;continue;}
    const title=diskTitle(path),folder=path.slice(0,path.length-baseName(path).length);
    const kind=["HDI","NHD"].includes(ext(path))?"hd":"fd";
    const id=[folder,title,kind].join("|").toLowerCase();
    let game=find(id);
    if(!game){
      const image=Object.keys(art).find(k=>fold(art[k].title)===fold(title));
      game={id,title,image,files:[],added:Date.now(),last:0,fav:false};state.games.unshift(game);
    }
    if(!game.files.some(p=>p.toLowerCase()===path.toLowerCase()))game.files.push(path);
    game.files.sort((a,b)=>a.localeCompare(b,"en",{numeric:true}));groups.set(id,game);
  }
  if(!groups.size){notice(t("format"));return;}
  persist();navigate("library");await launch(groups.values().next().value);
  if(skipped)notice(t("ignored")+" · "+skipped);
}
async function testSound(){
  try{
    const ctx=new AudioContext();await ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain();
    const now=ctx.currentTime;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(state.settings.volume*.0012,now+.02);gain.gain.linearRampToValueAtTime(0,now+.27);
    osc.type="triangle";osc.frequency.setValueAtTime(523.25,now);osc.frequency.setValueAtTime(659.25,now+.13);
    osc.connect(gain).connect(ctx.destination);osc.onended=()=>ctx.close();osc.start();osc.stop(now+.28);
  }catch{notice(t("error"));}
}
document.addEventListener("click",async e=>{
  const b=e.target.closest("button");if(!b)return;
  const g=find(b.closest("[data-id]")?.dataset.id);
  try {
    if(b.dataset.view){navigate(b.dataset.view);return;}
    if(b.dataset.tab){tab=b.dataset.tab;render();return;}
    if(b.dataset.layout){state.settings.layout=b.dataset.layout;persist();render();return;}
    if(b.dataset.bind){render();capture=b.dataset.bind;const key=main.querySelector('[data-bind="'+capture+'"]');key.textContent=t("capture");key.classList.add("waiting");key.focus();return;}
    switch(b.dataset.act){
      case "pick":if(native)await importPaths(await call("pick"));else $("#files").click();break;
      case "details":details(g);break;
      case "play":await launch(g);break;
      case "fav":g.fav=!g.fav;persist();render();if(modal.open)details(g);break;
      case "remove":if(g.id===active){notice(t("busy"));break;}state.games=state.games.filter(x=>x!==g);persist();modal.close();render();break;
      case "close":modal.close();break;
      case "session":navigate("playing");break;
      case "to-library":navigate("library");break;
      case "fullscreen":await call("fullscreen",{exitLabel:t("exitFull")});break;
      case "focus":case "save":case "load":case "fast":case "pause":case "disk1":case "disk2":
        await call("control",{command:b.dataset.act});break;
      case "stop":await call("control",{command:"close"});break;
      case "reset":state.settings.keys={...defaultKeys};persist();render();break;
      case "testSound":await testSound();break;
    }
  }catch(err){showError(err);}
});
modal.addEventListener("close",()=>{const toast=$("#notice");if(toast&&modal.contains(toast))document.body.append(toast);});
search.addEventListener("input",()=>{if(["settings","help","playing"].includes(view))view="library";render();});
document.addEventListener("keydown",e=>{
  if(view==="playing"&&!e.repeat&&(e.key==="F11"||(e.altKey&&e.key==="Enter"))){
    e.preventDefault();call("fullscreen",{exitLabel:t("exitFull")}).catch(showError);return;
  }
  if(capture){
    e.preventDefault();e.stopPropagation();if(e.repeat)return;
    const id=capture;
    if(e.key==="Escape"){render();main.querySelector('[data-bind="'+id+'"]').focus();return;}
    let key=e.code.startsWith("Numpad")&&/^Numpad\d$/.test(e.code)?e.code.replace("Numpad","Num"):e.key.replace(/^Arrow/,"");
    if(key===" ")key="Space";if(key.length===1)key=key.toUpperCase();
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||!/^(?:[A-Z0-9]|Up|Down|Left|Right|Num\d|F[1-9]|F10|Space|Enter|Tab|Backspace)$/.test(key)){notice(t("badKey"));return;}
    if(Object.entries(state.settings.keys).some(([k,v])=>k!==id&&key===v)){notice(t("conflict"));return;}
    state.settings.keys[id]=key;persist();render();main.querySelector('[data-bind="'+id+'"]').focus();return;
  }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"&&!modal.open){e.preventDefault();search.focus();search.select();}
});
main.addEventListener("change",e=>{
  const el=e.target,id=el.dataset.setting;
  if(el.id==="sort")state.settings.sort=el.value;
  else if(id){
    const old=state.settings[id];state.settings[id]=typeof old==="number"?Number(el.value):typeof old==="boolean"?(el.type==="checkbox"?el.checked:el.value==="true"):el.value;
  }else return;
  persist();render();if(id)main.querySelector('[data-setting="'+id+'"]')?.focus();
});
main.addEventListener("input",e=>{if(e.target.id==="volume"){state.settings.volume=+e.target.value;main.querySelector("output").textContent=e.target.value+"%";persist();}});
$("#files").addEventListener("change",async e=>{await importPaths(Array.from(e.target.files,f=>f.name));e.target.value="";});
const fileDrag=e=>Array.from(e.dataTransfer?.types||[]).includes("Files");
window.addEventListener("dragenter",e=>{if(fileDrag(e)){e.preventDefault();dragDepth++;if(!modal.open)$("#drop-overlay").hidden=false;}});
window.addEventListener("dragover",e=>{if(fileDrag(e)){e.preventDefault();e.dataTransfer.dropEffect=modal.open?"none":"copy";}});
window.addEventListener("dragleave",e=>{if(fileDrag(e)){dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$("#drop-overlay").hidden=true;}});
window.addEventListener("drop",async e=>{
  if(!fileDrag(e))return;e.preventDefault();dragDepth=0;$("#drop-overlay").hidden=true;if(modal.open)return;
  const files=Array.from(e.dataTransfer.files);
  try{await importPaths(native?await call("drop",{},files):files.map(f=>f.name));}catch(err){showError(err);}
});
let surfaceFrame=0,lastSurface="";
const surfaceObserver=new ResizeObserver(scheduleSurface);
function scheduleSurface(){if(native&&!surfaceFrame)surfaceFrame=requestAnimationFrame(syncSurface);}
function syncSurface(){
  surfaceFrame=0;
  const el=$("#play-surface"),r=el?.getBoundingClientRect(),d=window.devicePixelRatio;
  const rect=r?{x:Math.round(r.x*d),y:Math.round(r.y*d),width:Math.round(r.width*d),height:Math.round(r.height*d)}:{x:0,y:0,width:0,height:0};
  const stamp=JSON.stringify(rect);
  if(lastSurface===stamp)return;
  lastSurface=stamp;call("surface",rect).catch(showError);
}
function trackSurface(){
  if(!native)return;
  surfaceObserver.disconnect();
  const el=$("#play-surface");if(el)surfaceObserver.observe(el);
  scheduleSurface();
}
window.addEventListener("resize",scheduleSurface);
window.addEventListener("scroll",scheduleSurface,{passive:true});
catLogo();render();

