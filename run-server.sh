#!/bin/bash
# run-server.sh — launchd entry point. Loads the key and runs serve.py.
# launchd keeps this alive: if it ever exits, it restarts automatically.
cd "$(dirname "$0")" || exit 1

if [ -f key.txt ]; then
  export BIFROST_KEY="$(cat key.txt)"
fi

# launchd runs with no PATH, so use an absolute interpreter path.
PY="$(command -v python3 2>/dev/null || echo /usr/local/bin/python3)"
exec "$PY" serve.py
