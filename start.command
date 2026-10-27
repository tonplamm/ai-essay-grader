#!/bin/bash
# start.command — double-click to launch the AI Essay & Quiz Grader.
# Opens Terminal, loads the API key, starts the server, opens the browser.
cd "$(dirname "$0")" || exit 1

echo "════════════════════════════════════════════════"
echo "  AI Essay & Quiz Grader — starting up"
echo "════════════════════════════════════════════════"
echo

if [ ! -f key.txt ]; then
  echo "❌ ไม่พบ key.txt — สร้างไฟล์ key.txt แล้ววาง API key ลงไปก่อน"
  echo "   (กดปุ่มอะไรก็ได้เพื่อปิดหน้าต่าง)"
  read -r _
  exit 1
fi

# Kill any stale instance so we always land on port 8000
pkill -f "serve.py" 2>/dev/null
sleep 1

export BIFROST_KEY="$(cat key.txt)"

# Open the browser once the server answers (max ~15s wait)
(
  for i in $(seq 1 30); do
    if curl -s -m 2 http://localhost:8000/api/config >/dev/null 2>&1; then
      sleep 1
      open "http://localhost:8000/"
      exit 0
    fi
    sleep 0.5
  done
) &

python3 serve.py

echo
echo "── เซิร์ฟเวอร์หยุดแล้ว (ปิดหน้าต่างนี้ได้) ──"
read -r _
