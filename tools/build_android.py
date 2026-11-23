"""Build an unsigned standalone APK with the official Android SDK tools."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile
from stage_port import ROOT,stage

parser=argparse.ArgumentParser()
parser.add_argument("--debug-webview",action="store_true")
args=parser.parse_args()
sdk=Path(os.environ["ANDROID_HOME"])
tools=sdk/"build-tools"/"35.0.0"
android=sdk/"platforms"/"android-35"/"android.jar"
def run(*cmd):
    subprocess.run(list(map(str,cmd)),check=True)

with tempfile.TemporaryDirectory(prefix="nekostation-apk-") as folder:
    work=Path(folder)
    stage(work/"assets"/"web")
    drawable=work/"res"/"drawable-nodpi"
    drawable.mkdir(parents=True)
    shutil.copy2(ROOT/"assets/GameTranslate-Favicon.png",drawable/"icon.png")
    manifest=(ROOT/"portable/android/AndroidManifest.xml").read_text(encoding="utf-8")
    if args.debug_webview:
        manifest=manifest.replace("<application ", '<application android:debuggable="true" ')
    (work/"AndroidManifest.xml").write_text(manifest,encoding="utf-8")
    run(tools/"aapt2","compile","--dir",work/"res","-o",work/"res.zip")
    apk=work/"base.apk"
    run(tools/"aapt2","link","-I",android,"--manifest",work/"AndroidManifest.xml","-A",work/"assets","-o",apk,work/"res.zip")
    classes=work/"classes";classes.mkdir()
    run("javac","--release","8","-cp",android,"-d",classes,ROOT/"portable/android/MainActivity.java")
    run(tools/"d8","--lib",android,"--min-api","28","--output",work,*sorted(classes.rglob("*.class")))
    with zipfile.ZipFile(apk,"a") as archive:archive.write(work/"classes.dex","classes.dex")
    out=ROOT/"dist";out.mkdir(exist_ok=True)
    suffix="debug" if args.debug_webview else "unsigned"
    run(tools/"zipalign","-f","4",apk,out/f"NekoStation-0.2.0-android-{suffix}.apk")
