"""Package the Electron directory with a root-owned Chromium sandbox helper."""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

bundle=Path(sys.argv[1]).resolve()
out=Path(__file__).resolve().parents[1]/"dist"/"NekoStation-0.2.0-linux-amd64.deb"
with tempfile.TemporaryDirectory() as work:
    stage=Path(work)
    stage.chmod(0o755)
    app=stage/"opt"/"NekoStation"
    shutil.copytree(bundle,app,symlinks=True)
    app.chmod(0o755)
    for f in app.rglob("*"):
        if f.is_symlink():continue
        is_binary=f.name in {"NekoStation","chrome_crashpad_handler","chrome-sandbox"}
        f.chmod(0o755 if f.is_dir() or is_binary else 0o644)
    (app/"chrome-sandbox").chmod(0o4755)
    (stage/"usr/bin").mkdir(parents=True)
    (stage/"usr/bin/nekostation").symlink_to("/opt/NekoStation/NekoStation")
    icons=stage/"usr/share/icons/hicolor/512x512/apps"
    icons.mkdir(parents=True)
    shutil.copyfile(Path(__file__).resolve().parents[1]/"assets/GameTranslate-Favicon.png",icons/"nekostation.png")
    desktop=stage/"usr/share/applications";desktop.mkdir()
    (desktop/"nekostation.desktop").write_text("[Desktop Entry]\nType=Application\nName=NekoStation\nExec=nekostation\nIcon=nekostation\nCategories=Game;Emulator;\n")
    (stage/"DEBIAN").mkdir()
    (stage/"DEBIAN/control").write_text(
        "Package: nekostation\nVersion: 0.2.0\nArchitecture: amd64\nMaintainer: GameTranslate <344312616+gametranslate@users.noreply.github.com>\n"
        "Section: games\nPriority: optional\n"
        "Depends: libc6 (>= 2.31), libgtk-3-0 | libgtk-3-0t64, libnss3, libxss1, libasound2 | libasound2t64, libgbm1, libxkbcommon0, libx11-xcb1, libdrm2, libxshmfence1\n"
        "Description: PC-98 game library with an integrated Neko Project 21 emulator\n")
    subprocess.run(["dpkg-deb","--root-owner-group","-Zxz","-z3","--build",stage,out],check=True)
