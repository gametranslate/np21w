const {app,BrowserWindow,Menu,protocol,net,shell}=require("electron");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const origin="neko://library";
protocol.registerSchemesAsPrivileged([{scheme:"neko",privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
const links=new Set(["https://gametranslate.us/","https://github.com/irori/np2-wasm"]);
let window;
app.whenReady().then(()=>{
  const root=path.join(__dirname,"web");
  protocol.handle("neko",request=>{
    const url=new URL(request.url);
    if(url.hostname!=="library" || request.method!=="GET")return new Response(null,{status:403});
    const file=path.resolve(root,"."+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+path.sep))return new Response(null,{status:403});
    return net.fetch(pathToFileURL(file).href);
  });
  Menu.setApplicationMenu(null);
  function open(){
    window=new BrowserWindow({title:"NekoStation",width:1240,height:800,minWidth:650,minHeight:480,
      backgroundColor:"#111417",icon:path.join(root,"assets","GameTranslate-Favicon.png"),
      webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,autoplayPolicy:"no-user-gesture-required",disableHtmlFullscreenWindowResize:process.platform==="darwin"}});
    if(process.platform==="darwin"){
      window.webContents.on("enter-html-full-screen",()=>window.setSimpleFullScreen(true));
      window.webContents.on("leave-html-full-screen",()=>window.setSimpleFullScreen(false));
    }
    window.webContents.setWindowOpenHandler(({url})=>{
      if(links.has(url))shell.openExternal(url);
      return {action:"deny"};
    });
    window.webContents.on("will-navigate",(event,url)=>{if(url!==origin+"/index.html")event.preventDefault();});
    window.loadURL(origin+"/index.html");
    window.on("closed",()=>{window=null;});
  }
  open();
  app.on("activate",()=>{if(!window)open();});
});
app.on("window-all-closed",()=>app.quit());
