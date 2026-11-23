# NekoStation

NekoStation plays PC-98 disk images inside a game library. The Windows x64 edition embeds Neko Project 21/W 0.86 rev106.

## Play on Windows

1. Download the Windows x64 ZIP from [GitHub Releases](https://github.com/gametranslate/np21w/releases).
2. Extract the whole folder to a writable location, then run `NekoStation.exe`. The launcher uses Microsoft Edge WebView2 Runtime. [Runtime download](https://developer.microsoft.com/microsoft-edge/webview2/)
3. Drop your HDI, NHD, D88 or FDI image into the library, or select it with the file picker. For a floppy set, drop the numbered disks together.

Use **Settings → Basic** to choose one of ten interface languages, rebind controls or select a save slot. English is the first-run default. F5 saves, F8 loads, F9 toggles fast-forward and F6 pauses. Use F11, Alt+Enter or the player button for fullscreen. **Advanced** contains the CPU, memory and sound board settings.

NekoStation stores Windows library data and per-game profiles under `%LOCALAPPDATA%\NekoStation`. Keep imported images at their original paths. The core can write to mounted disk images during play.

## Play on Linux, macOS or Android

Download your platform's package from [Releases](https://github.com/gametranslate/np21w/releases). On Debian or Ubuntu x64, install the `.deb` and open NekoStation from the applications menu. On macOS, select the ZIP for Apple silicon (arm64) or Intel (x64), extract it and open NekoStation.app. The Mac builds are ad hoc signed and have not been notarized by Apple. On Android 9 or newer, install the APK and select a disk with **Browse files**. Use an up-to-date Android System WebView.

These editions run the np2-wasm Neko Project 21 core inside the app, copy imported disk images into local app storage and offer touch controls on Android. Save slots are specific to each core and device. [Portable build instructions](https://github.com/gametranslate/np21w/blob/nekostation/portable/BUILD.md)

## Build the Windows edition

On 64-bit Windows with the .NET Framework 4.x compiler, run `native\Build.ps1` from PowerShell. To package the rebuilt launcher with its runtime dependencies and notices, run `python tools/package_windows.py 0.2.0`.

## Credits

Launcher and GameTranslate branding by GameTranslate. Neko Project 21/W and its components retain their upstream notices in `core/LICENSES`. The Windows package is distributed free of charge. FM Sound Generator by cisc, copyright 1998 and 2003. The WebView2 SDK notices accompany the launcher, and the Inter font license is in `assets`. [Neko Project 21/W](https://github.com/SimK98/np21w)
