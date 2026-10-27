#!/usr/bin/env python3
"""
serve.py — local static server + AI proxy for AI Essay & Quiz Grader.

Why a proxy?
  1. The upstream gateway (bifrost.pm2.fun) does not allow CORS from browsers.
  2. Privacy by design: the API key lives ONLY in this local process
     (env var BIFROST_KEY or ./key.txt). It is never sent to the browser,
     never committed to git.

Usage:
    export BIFROST_KEY="***"   # or put it in key.txt (gitignored)
    python3 serve.py
    open http://localhost:8000

Zero dependencies (Python stdlib only).
"""
import http.server
import json
import os
import socketserver
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent.resolve()
PORT = int(os.environ.get("PORT", "8000"))

UPSTREAM = os.environ.get(
    "UPSTREAM_URL", "https://bifrost.pm2.fun/openai/v1/chat/completions"
)
DEFAULT_MODEL = os.environ.get("UPSTREAM_MODEL", "nta-gptoss/openai/gpt-oss-120b")
# Reasoning models can spend minutes per grading call; keep this generous.
UPSTREAM_TIMEOUT = int(os.environ.get("UPSTREAM_TIMEOUT", "600"))

# Gateway models, fastest/most reliable first (measured 2026-10-27).
# gpt-oss-120b: essay ~10-11s, quiz ~3s, 0 failures, valid JSON every run.
# qwen3.8-max : essay 41-290s (reasoning tokens), intermittent connection resets.
AVAILABLE_MODELS = [
    {"id": "nta-gptoss/openai/gpt-oss-120b",
     "label": "GPT-OSS 120B (เร็ว ~10 วิ, เสถียร, แนะนำ)"},
    {"id": "qwen3.8-max",
     "label": "Qwen 3.8 Max (ช้า ~40-120 วิ, คิดละเอียดกว่า)"},
    {"id": "nta-qwen/Qwen/Qwen3.8-27B",
     "label": "Qwen 3.8 27B (ช้า, ทดสอบแล้วไม่ผ่าน JSON)"},
]


def load_key() -> str:
    key = os.environ.get("BIFROST_KEY", "").strip()
    if key:
        return key
    keyfile = HERE / "key.txt"
    if keyfile.exists():
        return keyfile.read_text().strip()
    return ""


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HERE), **kwargs)

    def log_message(self, fmt, *args):  # quieter logs
        sys.stderr.write("[serve] %s\n" % (fmt % args))

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "content-type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/config":
            key = load_key()
            body = json.dumps(
                {
                    "live": bool(key),
                    "model": DEFAULT_MODEL,
                    "models": AVAILABLE_MODELS,
                    "upstream": "proxy",
                    "message": "Proxy live: key held server-side."
                    if key
                    else "No BIFROST_KEY / key.txt found — app will run in DEMO MODE.",
                }
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/chat":
            self.send_error(404)
            return
        key = load_key()
        if not key:
            self._json_error(503, "no_key", "Proxy has no API key configured.")
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            req = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self._json_error(400, "bad_request", "Invalid JSON body.")
            return

        payload = {
            "model": req.get("model") or DEFAULT_MODEL,
            "messages": req.get("messages", []),
            "temperature": req.get("temperature", 0.2),
            "max_tokens": req.get("max_tokens", 8192),
        }
        # optional passthrough for provider-specific knobs (e.g. thinking control)
        for k, v in (req.get("extra") or {}).items():
            if k not in ("messages",):
                payload[k] = v
        upstream_req = urllib.request.Request(
            UPSTREAM,
            data=json.dumps(payload).encode(),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(upstream_req, timeout=UPSTREAM_TIMEOUT) as resp:
                data = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:500]
            self._json_error(e.code, "upstream_http_error", detail)
            return
        except Exception as e:  # noqa: BLE001
            self._json_error(502, "upstream_error", str(e))
            return

        try:
            msg = data["choices"][0]["message"]
            text = msg.get("content") or ""
            if not text.strip():
                # reasoning models can spend the whole budget thinking; salvage if possible
                text = msg.get("reasoning_content") or msg.get("reasoning") or ""
                if not text.strip():
                    self._json_error(
                        502, "empty_content",
                        "Model returned empty content (finish_reason="
                        + str(data["choices"][0].get("finish_reason")) + "). Retry.",
                    )
                    return
        except KeyError:
            text = json.dumps(data)[:2000]
        out = json.dumps({
            "text": text,
            "model": payload["model"],
            "usage": {
                "in": data.get("usage", {}).get("prompt_tokens"),
                "out": data.get("usage", {}).get("completion_tokens"),
                "thinking": (data.get("usage", {}).get("completion_tokens_details") or {}).get("reasoning_tokens"),
            },
            "finish_reason": data["choices"][0].get("finish_reason"),
        }).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(out)

    def _json_error(self, code, err, detail):
        body = json.dumps({"error": err, "detail": detail}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(body)


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    """Threaded so the UI + parallel consistency checks don't queue/block."""
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    key_state = "LIVE (key loaded)" if load_key() else "DEMO (no key found)"
    port = PORT
    for attempt in range(6):
        try:
            with ReusableTCPServer(("", port), Handler) as httpd:
                if port != PORT:
                    print(f"⚠️  Port {PORT} was busy — serving on {port} instead")
                print(f"AI Essay & Quiz Grader → http://localhost:{port}  [{key_state}]")
                print("กด Ctrl+C เพื่อหยุดเซิร์ฟเวอร์ (ห้ามปิดหน้าต่างนี้ระหว่างนำเสนอ)")
                try:
                    httpd.serve_forever()
                except KeyboardInterrupt:
                    print("\nbye")
            break
        except OSError as e:
            if e.errno != 48:  # not "address in use"
                raise
            print(f"⚠️  Port {port} ถูกใช้งานอยู่ (Errno 48) — ลอง port ถัดไป…")
            port += 1
    else:
        print(
            "❌ ทุก port ({}–{}) ถูกใช้งานอยู่\n"
            "   หาโปรเซสที่ค้างอยู่ด้วย:  lsof -nP -iTCP:{} -sTCP:LISTEN\n"
            "   แล้วปิดด้วย:            pkill -f serve.py".format(PORT, port, PORT)
        )
        sys.exit(1)
