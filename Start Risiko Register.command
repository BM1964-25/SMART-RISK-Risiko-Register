#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOST="127.0.0.1"
PORT="${RISK_REGISTER_PORT:-8181}"
URL="http://${HOST}:${PORT}/Risiko%20Register/index.html"
LOG_FILE="/tmp/risiko-register-http.log"
PID_FILE="/tmp/risiko-register-http.pid"

open_browser() {
  open "$URL"
}

if /usr/bin/curl -fsI "$URL" >/dev/null 2>&1; then
  open_browser
  exit 0
fi

if /usr/bin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  open_browser
  exit 0
fi

(
  cd "$PROJECT_ROOT"
  nohup /usr/bin/python3 -m http.server "$PORT" --bind "$HOST" >"$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
) >/dev/null 2>&1

for _ in {1..40}; do
  if /usr/bin/curl -fsI "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

open_browser
