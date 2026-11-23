import createNP21 from "./vendor/np21.js";

const screen=document.querySelector("#screen");
let core,settings,hooks,paused=false,fast=false,closed=false,visible=true,running=false;
const sources=new Map(), names=new Map(), dirty=new Set(), held=new Map();
const floppies=[null,null];
let flushTimer, writes=Promise.resolve();

function flush() {
  clearTimeout(flushTimer);
  const work=writes.then(async()=>{
    for(const name of Array.from(dirty)){
      dirty.delete(name);
      try{await hooks.change(sources.get(name),core.FS.readFile(name));}
      catch(error){dirty.add(name);throw error;}
    }
  });
  writes=work.catch(()=>{});return work;
}
function diskChanged(pointer) {
  const name=core.UTF8ToString(pointer).split("/").pop();
  if(!sources.has(name))return;
  if(!dirty.size)flushTimer=setTimeout(()=>flush().catch(hooks.error),450);
  dirty.add(name);
}
async function install(path,bytes) {
  if(names.has(path))return names.get(path);
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(path));
  const id=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  const name=id+"."+path.split(".").pop().toLowerCase();
  core.FS.writeFile(name,bytes);names.set(path,name);sources.set(name,path);
  return name;
}
async function mountFloppy(index,disk) {
  const name=disk?await install(disk.path,disk.bytes):null;
  core.ccall("diskdrv_setfddex",null,["number","string","number","number"],[index,name,0,0]);
  floppies[index]=disk?.path||null;
}
const scan={Enter:40,Escape:41,Backspace:42,Tab:43,Space:44,Minus:45,Equal:46,BracketLeft:47,BracketRight:48,Backslash:49,Semicolon:51,Quote:52,Backquote:53,Comma:54,Period:55,Slash:56,CapsLock:57,Insert:73,Home:74,PageUp:75,Delete:76,End:77,PageDown:78,ArrowRight:79,ArrowLeft:80,ArrowDown:81,ArrowUp:82,NumLock:83,NumpadDivide:84,NumpadMultiply:85,NumpadSubtract:86,NumpadAdd:87,NumpadEnter:88,Numpad0:98,NumpadDecimal:99,ControlLeft:224,ShiftLeft:225,AltLeft:226,ControlRight:228,ShiftRight:229,AltRight:230};
for(let i=0;i<26;i++)scan["Key"+String.fromCharCode(65+i)]=4+i;
for(let i=1;i<=9;i++){scan["Digit"+i]=29+i;scan["Numpad"+i]=88+i;}
scan.Digit0=39;
for(let i=1;i<=12;i++)scan["F"+i]=57+i;
function lookup(code) {
  const key=code.replace(/^Key|^Digit|^Arrow/,"").replace(/^Numpad(?=\d$)/,"Num");
  return Object.keys(settings.keys).find(name=>settings.keys[name]===key);
}
function target(action) {
  return ({up:settings.keypad?"Numpad8":"ArrowUp",down:settings.keypad?"Numpad2":"ArrowDown",left:settings.keypad?"Numpad4":"ArrowLeft",right:settings.keypad?"Numpad6":"ArrowRight",a:"KeyZ",b:"KeyX",confirm:"Enter",space:"Space"})[action];
}
function setKey(id,scancode,down) {
  if(!core||closed||!scancode)return;
  if(down && !held.has(id)){held.set(id,scancode);core._sdlkbd_keydown(scancode);}
  if(!down && held.delete(id) && !Array.from(held.values()).includes(scancode))core._sdlkbd_keyup(scancode);
}
function release(){for(const [id,scancode] of held)setKey(id,scancode,false);}
function keyboard(e) {
  if(!settings || !scan[e.code])return;
  e.preventDefault();e.stopImmediatePropagation();
  const action=lookup(e.code);
  const cmd=e.code==="F11" || (e.altKey && e.code==="Enter")?"fullscreen":action;
  if(["fullscreen","save","load","pause","fast"].includes(cmd)){
    if(e.type==="keydown"&&!e.repeat)hooks.command(cmd);
    return;
  }
  setKey(e.code,scan[target(action)||e.code],e.type==="keydown");
}
window.addEventListener("keydown",keyboard,true);
window.addEventListener("keyup",keyboard,true);
window.addEventListener("blur",release);
function syncRun() {
  const play=!paused && !closed && visible && !document.hidden;
  if(!core || running===play)return;
  running=play;
  if(play)core._np2_resume();else{release();core._np2_pause();}
}
document.addEventListener("visibilitychange",()=>{syncRun();if(document.hidden && hooks)flush().catch(hooks.error);});
function buildPad(){
  const pad=document.querySelector("#pad");
  for(const [action,label] of Object.entries({left:"←",up:"↑",down:"↓",right:"→",a:"A",b:"B",confirm:"↵",space:"␣",esc:"Esc"})){
    const b=document.createElement("button");b.textContent=label;b.ariaLabel=hooks.labels[action]||label;
    const code=scan[target(action)||"Escape"];
    b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);setKey("touch"+e.pointerId,code,true);};
    b.onlostpointercapture=e=>setKey("touch"+e.pointerId,code,false);
    pad.append(b);
  }
}
async function start(config,disks,callbacks){
  settings=config;hooks=callbacks;
  const font=await (await fetch("vendor/font.bmp")).arrayBuffer();
  const vars={fontfile:"font.bmp",clk_base:2457600,clk_mult:config.cpu,ExMemory:config.ram,
    SNDboard:Number(config.sound),use_menu:false,no_mouse:false,skipline:config.scan,skplight:128,
    Latencys:70,volume_F:config.volume,volume_S:config.volume,volume_A:config.volume,volume_P:config.volume,volume_R:config.volume,BEEP_vol:Math.round(config.volume*3/100)};
  core=await createNP21({canvas:screen,preRun:[mod=>{core=mod;mod.FS.writeFile("font.bmp",new Uint8Array(font));}],
    getConfig(p,type,ptr,len){
      const val=vars[core.UTF8ToString(p)];if(val===undefined)return;
      if(type===0)core.stringToUTF8(val,ptr,len);
      else if(type===5||type===8||type===11)core.HEAP32[ptr>>2]=val;
      else if(type===4||type===7||type===10)core.HEAP16[ptr>>1]=val;
      else core.HEAPU8[ptr]=Number(val);
    },setConfig(){},onReady(){core._np2_pause();},onExit(){setTimeout(()=>hooks.command("close"),0);},onDiskChange:diskChanged});
  let hd=0,fd=0;
  for(const disk of disks) {
    if(/\.(hdi|nhd)$/i.test(disk.path)){
      if(hd<2)core.ccall("diskdrv_setsxsi",null,["number","string"],[hd++,await install(disk.path,disk.bytes)]);
    }else if(fd<2)await mountFloppy(fd++,disk);
  }
  core._np2_reset();
  screen.style.maxWidth=String(640*settings.scale/8)+"px";
  buildPad();syncRun();screen.focus();
}
window.player={start,
  visible(value,fullscreen){visible=value;screen.style.maxWidth=fullscreen?"100%":String(640*(settings?.scale||8)/8)+"px";syncRun();},
  async save(){
    await flush();
    if(core.ccall("statsave_save","number",["string"],["slot.state"])!==0)throw new Error("error");
    return {data:core.FS.readFile("slot.state"),floppies:floppies.slice()};
  },
  async load(state,disks){
    for(let n=0;n<2;n++)if(floppies[n]!==state.floppies[n])await mountFloppy(n,disks[n]);
    core.FS.writeFile("slot.state",state.data);
    if(core.ccall("statsave_load","number",["string"],["slot.state"])<0)throw new Error("error");
  },
  swap:(index,path,bytes)=>mountFloppy(index,{path,bytes}),
  fast(){fast=!fast;core._np2_fast(Number(fast));},
  pause(){paused=!paused;syncRun();},
  async stop(){paused=true;syncRun();await flush();closed=true;}
};
