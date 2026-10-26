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
DEFAULT_MODEL = os.environ.get("UPSTREAM_MODEL", "qwen3.8-max")


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
            with urllib.request.urlopen(upstream_req, timeout=180) as resp:
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
        out = json.dumps({"text": text, "model": payload["model"]}).encode()
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


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    key_state = "LIVE (key loaded)" if load_key() else "DEMO (no key found)"
    with ReusableTCPServer(("", PORT), Handler) as httpd:
        print(f"AI Essay & Quiz Grader → http://localhost:{PORT}  [{key_state}]")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nbye")
