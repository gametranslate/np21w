"""Package a built Windows launcher from an explicit runtime file list."""
import argparse
import hashlib
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("version")
version = parser.parse_args().version
if not re.fullmatch(r"\d+\.\d+\.\d+", version):
    parser.error("Use a release version such as 0.1.0")

files = [
    "NekoStation.exe", "index.html", "style.css", "app.js", "locales.js",
    "Microsoft.Web.WebView2.Core.dll", "Microsoft.Web.WebView2.WinForms.dll",
    "WebView2Loader.dll", "native/WebView2-LICENSE.txt", "native/WebView2-NOTICE.txt",
    "README.md", "assets/GameTranslate-Favicon.png", "assets/Inter.ttf",
    "assets/Inter-license.txt", "assets/brandish.webp", "assets/lotus.webp",
    "assets/policenauts.webp", "assets/rusty.webp", "core/np21x64w.exe",
]
for folder in ("core/LICENSES", "core/language"):
    files.extend(sorted(p.relative_to(root).as_posix() for p in (root / folder).rglob("*") if p.is_file()))

out = root / "dist"
out.mkdir(exist_ok=True)
archive = out / f"NekoStation-{version}-windows-x64.zip"
with ZipFile(archive, "w", compression=ZIP_DEFLATED) as bundle:
    for name in files:
        bundle.write(root / name, "NekoStation/" + name)
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix(".zip.sha256").write_text(f"{digest}  {archive.name}\n", encoding="ascii")
print(archive, digest)
