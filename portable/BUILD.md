# Portable player

The Linux, macOS and Android editions use the same local HTML interface and an i386 Neko Project 21 core from np2-wasm. Imported disks are copied into the app’s local IndexedDB storage. The player writes guest disk changes to those copies. State slots are local to each app and core.

## Rebuild the shared core

Use Emscripten 3.1.74, CMake and Ninja. Clone [irori/np2-wasm](https://github.com/irori/np2-wasm), check out `563082adc69ef883a04a50f936538745502c6fa7`, and apply `portable/core.patch` with `git apply`. From that checkout run:

```sh
emcmake cmake -S src -B out -G Ninja -DCMAKE_BUILD_TYPE=MinSizeRel
cmake --build out --target np21
```

Copy `out/np21.js` and `out/np21.wasm` to `portable/vendor`. The portable source tree includes the built module, its font and the upstream notices so packaged apps can run offline.

## Package

Use Node 22.12+ and Python 3. On Linux or macOS run `npm ci --prefix tools/desktop_deps --ignore-scripts`, then `node tools/build_desktop.mjs`. Linux x64 uses dpkg-deb. macOS uses codesign and ditto. The macOS ZIP contains an ad hoc signed app.

For Android, set `ANDROID_HOME` to the SDK directory with platform 35 and build-tools 35.0.0, install a JDK and run `python3 tools/build_android.py` on Linux. Sign the resulting aligned APK with the app's release key using apksigner. The app uses the system WebView and Android's document picker. The release build disables WebView debugging.

GitHub Actions starts the archived application on macOS and boots a generated PC-98 test disk. On Android it runs the same test using an instrumentable build in the Android emulator. Test disk contents are generated during the jobs.
