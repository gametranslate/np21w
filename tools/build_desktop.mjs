import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import {execFileSync} from "node:child_process";

const root=fileURLToPath(new URL("../",import.meta.url));
const require=createRequire(new URL("desktop_deps/package.json",import.meta.url));
const {packager}=await import(require("node:url").pathToFileURL(require.resolve("@electron/packager")).href);
const [platform=process.platform,arch=process.arch]=process.argv.slice(2);
if(!["linux","darwin"].includes(platform)||!["x64","arm64"].includes(arch))throw Error("Unsupported target");
const build=path.join(root,"build","desktop-source");
await fs.mkdir(build,{recursive:true});
for(const name of ["main.cjs","package.json"])await fs.copyFile(path.join(root,"portable","desktop",name),path.join(build,name));
execFileSync("python3",[path.join(root,"tools","stage_port.py"),path.join(build,"web")]);
const icon=platform==="darwin"?path.join(root,"portable","desktop","NekoStation.icns"):undefined;
const [bundle]=await packager({name:"NekoStation",appBundleId:"us.gametranslate.nekostation",dir:build,out:process.env.NEKOSTATION_DESKTOP_OUTPUT||path.join(root,"build"),
  platform,arch,electronVersion:"45.4.1",overwrite:true,asar:true,icon,osxSign:false,appVersion:"0.2.0"});
const dist=path.join(root,"dist");
await fs.mkdir(dist,{recursive:true});
if(platform==="darwin"){
  const app=path.join(bundle,"NekoStation.app");
  execFileSync("codesign",["--force","--deep","--sign","-",app]);
  execFileSync("codesign",["--verify","--deep","--strict",app]);
  execFileSync("ditto",["-c","-k","--sequesterRsrc","--keepParent",app,path.join(dist,"NekoStation-0.2.0-macos-"+arch+".zip")]);
}else{
  if(arch!=="x64")throw Error("The Debian package currently targets amd64.");
  execFileSync("python3",[path.join(root,"tools","package_deb.py"),bundle],{stdio:"inherit"});
}
console.log(bundle);
