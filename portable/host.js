"use strict";
window.NekoPortable = (() => {
  const db = new Promise((resolve,reject) => {
    const req = indexedDB.open("NekoStation-media",1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error("storageError"));
  });
  async function store(mode, operation) {
    const tx = (await db).transaction("files", mode);
    return new Promise((resolve,reject) => {
      const request = operation(tx.objectStore("files"));
      tx.oncomplete = () => resolve(request?.result);
      tx.onabort = tx.onerror = () => reject(new Error("storageError"));
    });
  }
  const read = key => store("readonly", table => table.get(key));
  const write = (key,value) => store("readwrite", table => table.put(value,key));
  async function keep(files) {
    const groups = new Map();
    const result = [];
    for (const file of files) {
      if (!/\.(d88|fdi|hdi|nhd)$/i.test(file.name)) { result.push(file.name); continue; }
      const key = diskTitle(file.name).toLowerCase();
      if (!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(file);
    }
    for (const group of groups.values()) {
      const hashes = await Promise.all(group.map(async f => {
        const digest = await crypto.subtle.digest("SHA-256", await f.arrayBuffer());
        return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2,"0")).join("");
      }));
      const folder = hashes.slice().sort().join("-");
      for (const file of group) {
        const path = folder+"/"+file.name;
        if (!await store("readonly", table => table.getKey(path))) await write(path,file);
        result.push(path);
      }
    }
    return result;
  }
  function pick(multiple, accept) {
    return new Promise(resolve => {
      const input = document.createElement("input");
      input.type="file"; input.accept=accept; input.multiple=multiple;
      input.onchange=()=>resolve(Array.from(input.files));
      input.oncancel=()=>resolve([]);
      input.click();
    });
  }
  const shell=document.createElement("section");
  shell.id="portable-player"; shell.hidden=true;
  document.body.append(shell);
  const exit=document.createElement("button");
  exit.className="btn exit-player"; exit.onclick=()=>toggleScreen();
  shell.append(exit);
  let frame=null, session=null, lastRect=null;
  function place(rect=lastRect) {
    lastRect=rect;
    if (!rect || !frame) {shell.hidden=true;return;}
    if (document.fullscreenElement===shell) {shell.hidden=false;frame.contentWindow.player?.visible(true,true);return;}
    const d=window.devicePixelRatio;
    shell.hidden=rect.width<=0 || rect.height<=0;
    frame.contentWindow.player?.visible(!shell.hidden,false);
    Object.assign(shell.style,{left:rect.x/d+"px",top:rect.y/d+"px",width:rect.width/d+"px",height:rect.height/d+"px"});
  }
  async function toggleScreen() {
    if(document.fullscreenElement===shell) await document.exitFullscreen();
    else await shell.requestFullscreen();
    frame?.focus();
  }
  document.addEventListener("fullscreenchange",()=>place());
  async function launch(params) {
    if(session)throw new Error("busy");
    session={...params,paths:params.paths.slice()};
    exit.textContent=params.exitLabel;
    frame=document.createElement("iframe");
    frame.title=find(params.game)?.title||"PC-98";
    frame.allow="autoplay; fullscreen";
    try {
      const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject;});
      frame.src="portable/player.html";
      shell.append(frame);
      await loaded;
      const disks=[];
      for (const path of session.paths) {
        const blob=await read(path);
        if(!blob)throw new Error("missing");
        disks.push({path,bytes:new Uint8Array(await blob.arrayBuffer())});
      }
      // Keep the game alive when the library replaces the player markup.
      const api=frame.contentWindow.player;
      if(!api)throw new Error("startFail");
      await api.start(params.settings,disks,{
        change:(path,bytes)=>write(path,new Blob([bytes])),
        command:cmd=>invoke(cmd).catch(showError),
        error:showError,
        labels:Object.fromEntries(["up","down","left","right","a","b","confirm","space"].map(k=>[k,t(k)]))
      });
      requestAnimationFrame(()=>frame?.focus());
    } catch(error) {
      frame.remove();frame=null;session=null;shell.hidden=true;throw error;
    }
  }
  let stateWork=Promise.resolve();
  function invoke(cmd) {
    // File and fullscreen pickers must start in the original user gesture.
    if(cmd==="fullscreen")return toggleScreen();
    if(cmd==="disk1" || cmd==="disk2")return swap(cmd==="disk1"?0:1);
    const work=stateWork.then(()=>control(cmd)); stateWork=work.catch(()=>{});return work;
  }
  async function swap(drive) {
    const current=session;
    const files=await pick(false,".d88,.fdi");
    if(!files.length || session!==current)return;
    if(!/\.(d88|fdi)$/i.test(files[0].name))throw new Error("format");
    const [path]=await keep(files);
    const data=await read(path);
    if(session===current)await frame.contentWindow.player.swap(drive,path,new Uint8Array(await data.arrayBuffer()));
  }
  async function control(cmd) {
    if(!session || !frame)throw new Error("ended");
    const api=frame.contentWindow.player;
    const key="state/"+session.game+"/"+session.settings.slot;
    if(cmd==="save")await write(key,await api.save());
    else if(cmd==="load"){
      const state=await read(key);
      if(!state)throw new Error("noState");
      const disks=[];
      for(const path of state.floppies){
        const blob=path && await read(path);
        if(path && !blob)throw new Error("missing");
        disks.push(blob?{path,bytes:new Uint8Array(await blob.arrayBuffer())}:null);
      }
      await api.load(state,disks);
    }else if(cmd==="close"){
      await api.stop();
      if(document.fullscreenElement===shell)await document.exitFullscreen();
      frame.remove();frame=null;session=null;lastRect=null;shell.hidden=true;
      port.notify({eventName:"ended"});return;
    }else if(cmd==="fast")api.fast();
    else if(cmd==="pause")api.pause();
    frame.focus();
  }
  const port={notify:()=>{}, async call(op,params,files) {
    if(op==="pick")return keep(await pick(true,".hdi,.nhd,.d88,.fdi"));
    if(op==="drop")return keep(files);
    if(op==="launch")return launch(params);
    if(op==="control")return invoke(params.command);
    if(op==="fullscreen")return toggleScreen();
    if(op==="surface")return place(params);
    throw new Error("error");
  }};
  return port;
})();
