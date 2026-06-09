"""Voikko validation microservice.

A tiny, dependency-light HTTP service that answers one question the Cloudflare
Worker can't (Voikko is a native library, Workers can't load it): "is every word
in this Finnish sentence real, standard Finnish?" It reuses the EXACT same
`VoikkoGate` the seed-content generator uses, so a learner's personal island
sentence passes the identical bar our shipped content does.

  POST /validate  { "text": "Minä asun Espoossa." }
       -> { "ok": true,  "invalid": [] }
       -> { "ok": false, "invalid": ["blarghti"] }   # not real Finnish
  GET  /health    -> { "ok": true }

No allowed-list is enforced here: islands may use ANY real Finnish word (it's the
learner's own life), we only reject invented/garbled forms. Set VOIKKO_SHARED_SECRET
to require an X-Voikko-Secret header (the Worker sends it).
"""
from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Reuse the identical gate the seed pipeline uses — same validation, one source.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "generate"))
from voikko_gate import VoikkoGate  # noqa: E402

GATE = VoikkoGate()  # no allowed-list: any real Finnish word is fine for islands
SECRET = os.environ.get("VOIKKO_SHARED_SECRET", "")
MAX_LEN = 500


class Handler(BaseHTTPRequestHandler):
    def _send(self, obj: dict, status: int = 200) -> None:
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            return self._send({"ok": True})
        return self._send({"error": "not found"}, 404)

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/validate":
            return self._send({"error": "not found"}, 404)
        if SECRET and self.headers.get("X-Voikko-Secret", "") != SECRET:
            return self._send({"error": "unauthorized"}, 401)
        try:
            length = int(self.headers.get("Content-Length", "0") or "0")
            data = json.loads(self.rfile.read(length) or b"{}")
            text = str(data.get("text", ""))[:MAX_LEN]
        except Exception:
            return self._send({"error": "bad request"}, 400)
        result = GATE.validate(text)
        return self._send({"ok": result.ok, "invalid": result.invalid_tokens})

    def log_message(self, *_args) -> None:  # keep the service quiet
        pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
