#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME="$ROOT/.local-run"
STATE="$RUNTIME/server.state"
LOG="$RUNTIME/server.log"
PORT=3001
ACTION=start

usage() {
  cat <<'HELP'
Usage: ./start.sh [--port PORT | --stop | --status | --help]

Start the website, app and API in the background (default: 127.0.0.1:3001).
Missing dependencies are installed and .env.local is created only if absent.
Preview mode works without deployed contracts. Existing configuration is kept.

  --port PORT  Use a different port when starting
  --stop       Stop this script's server
  --status     Show whether this script's server is running
  --help       Show this help

Logs: .local-run/server.log
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stop|--status)
      [[ "$ACTION" == start ]] || { usage >&2; exit 2; }
      ACTION="${1#--}"; shift ;;
    --port)
      [[ $# -ge 2 ]] || { usage >&2; exit 2; }
      PORT="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
done
[[ "$PORT" =~ ^[1-9][0-9]{0,4}$ ]] && (( PORT <= 65535 )) || {
  echo "Port must be an integer from 1 to 65535." >&2; exit 2;
}
ps -p "$$" -o lstart= >/dev/null || {
  echo "Process inspection is unavailable. Run this script in your local terminal." >&2
  exit 1
}

mkdir -p "$RUNTIME"
if ! mkdir "$RUNTIME/lock" 2>/dev/null; then
  echo "Another start/stop operation is in progress. Try again shortly." >&2
  exit 1
fi
trap 'rmdir "$RUNTIME/lock" 2>/dev/null || true' EXIT
cd "$ROOT"

# Never source the state file. Check both process birth time and command before
# sending a signal, so a stale PID cannot stop an unrelated process.
managed_running() {
  [[ -f "$STATE" ]] || return 1
  PID="$(sed -n '1p' "$STATE")"
  SAVED_BIRTH="$(sed -n '2p' "$STATE")"
  SAVED_PORT="$(sed -n '3p' "$STATE")"
  [[ "$PID" =~ ^[1-9][0-9]*$ ]] || return 1
  [[ -n "$SAVED_BIRTH" ]] || return 1
  [[ "$(ps -p "$PID" -o lstart= 2>/dev/null)" == "$SAVED_BIRTH" ]] || return 1
  case "$(ps -p "$PID" -o command= 2>/dev/null)" in
    *"$ROOT/scripts/dev.mjs --port $SAVED_PORT") return 0 ;;
    *) return 1 ;;
  esac
}

if [[ "$ACTION" == status ]]; then
  if managed_running; then
    echo "Running (PID $PID): http://127.0.0.1:$SAVED_PORT"
    echo "Logs: $LOG"
  else
    echo "No server managed by ./start.sh is running."
  fi
  exit 0
fi

if [[ "$ACTION" == stop ]]; then
  if ! managed_running; then
    rm -f "$STATE"
    echo "Already stopped."
    exit 0
  fi
  kill -TERM "$PID"
  for (( attempt=0; attempt<100; attempt++ )); do
    if ! managed_running; then
      rm -f "$STATE"
      echo "Stopped the local Steption server."
      exit 0
    fi
    sleep 0.2
  done
  echo "Shutdown is still pending. Check $LOG and retry --stop." >&2
  exit 1
fi

if managed_running; then
  echo "Already running: http://127.0.0.1:$SAVED_PORT"
  echo "Use ./start.sh --stop before restarting or changing ports."
  exit 0
fi
rm -f "$STATE"
command -v node >/dev/null && command -v npm >/dev/null || {
  echo "Install Node.js 22.12 or newer (with npm), then run this script again." >&2
  exit 1
}
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 12)) { console.error("Node.js 22.12 or newer is required."); process.exit(1); }'

# Fail on a busy port rather than silently choosing another app's URL.
node --input-type=module - "$PORT" <<'NODE'
import net from "node:net";
const port = Number(process.argv[2]);
const server = net.createServer();
server.once("error", (error) => {
  console.error(`Cannot use port ${port}: ${error.code}. Try ./start.sh --port ${port + 1}`);
  process.exit(1);
});
server.listen(port, "127.0.0.1", () => server.close());
NODE

if [[ ! -x node_modules/.bin/next || package-lock.json -nt node_modules/.package-lock.json ]]; then
  echo "Installing dependencies from package-lock.json…"
  npm ci --no-fund
fi
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "Created .env.local with preview defaults."
fi

echo "Starting Steption on port ${PORT}..."
nohup node "$ROOT/scripts/dev.mjs" --port "$PORT" >"$LOG" 2>&1 < /dev/null &
PID=$!
SAVED_BIRTH="$(ps -p "$PID" -o lstart=)"
printf '%s\n%s\n%s\n' "$PID" "$SAVED_BIRTH" "$PORT" > "$STATE"

if node --input-type=module - "$PORT" "$PID" <<'NODE'
import { setTimeout } from "node:timers/promises";
const port = Number(process.argv[2]);
const pid = Number(process.argv[3]);
const deadline = Date.now() + 90000;
while (Date.now() < deadline) {
  try { process.kill(pid, 0); } catch { process.exit(1); }
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(3000) });
    await response.arrayBuffer();
    if (response.ok) process.exit(0);
  } catch { /* Wait for initial compilation. */ }
  await setTimeout(500);
}
process.exit(1);
NODE
then
  echo "Website: http://127.0.0.1:$PORT/"
  echo "App:     http://127.0.0.1:$PORT/app"
  echo "Logs:    $LOG"
  echo "Stop:    ./start.sh --stop"
else
  echo "The server did not become ready. Recent logs:" >&2
  tail -n 30 "$LOG" >&2
  if managed_running; then kill -TERM "$PID"; fi
  exit 1
fi
