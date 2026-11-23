"""Stage only runtime files for the desktop and Android webviews."""
import argparse
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]

def stage(destination):
    for name in ("style.css","app.js","locales.js","portable/host.js","portable/host.css",
                 "portable/player.html","portable/player.css","portable/player.js"):
        target=destination/name
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(ROOT/name,target)
    for folder in ("assets","portable/vendor"):
        for path in (ROOT/folder).iterdir():
            if path.is_file() and path.name!="Minh-hoa.txt":
                target=destination/folder/path.name
                target.parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(path,target)
    html=(ROOT/"index.html").read_text(encoding="utf-8")
    html=html.replace("frame-src 'none'","frame-src 'self'")
    html=html.replace('<script defer src="app.js">','<link rel="stylesheet" href="portable/host.css">\n  <script defer src="portable/host.js"></script>\n  <script defer src="app.js">')
    html=html.replace("<strong>Neko Project 21/W</strong>","<strong>Neko Project 21</strong>")
    (destination/"index.html").write_text(html,encoding="utf-8")

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("destination",type=Path)
    stage(parser.parse_args().destination)
