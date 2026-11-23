#!/usr/bin/env bash
set -euo pipefail
adb install dist/*debug.apk
adb shell am start -n us.gametranslate.nekostation/.MainActivity
for attempt in {1..60}; do
  pid=$(adb shell pidof us.gametranslate.nekostation | tr -d '\r' || true)
  if [[ -n "$pid" ]] && adb shell cat /proc/net/unix | grep -F "webview_devtools_remote_$pid" >/dev/null; then break; fi
  sleep 1
done
adb forward tcp:9222 "localabstract:webview_devtools_remote_$pid"
python tools/smoke_port.py --cdp http://localhost:9222
