#!/usr/bin/env bash
set -euo pipefail
STEPTION_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
command -v node >/dev/null || { echo "Install Node.js 22.12+ first." >&2; exit 1; }
cd "$STEPTION_ROOT"
exec node "$STEPTION_ROOT/scripts/deploy-testnet.mjs" "$@"
