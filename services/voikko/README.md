# Voikko validation service

A tiny HTTP service that validates Finnish text against **Voikko** — the same
morphological check the seed-content generator uses. The Cloudflare Worker calls
it so that a learner's **personal island sentence** passes the *identical* "is
this real Finnish?" bar our shipped content does. (Voikko is a native library, so
it can't run inside a Worker — hence a small sidecar service.)

## API

```
POST /validate   { "text": "Minä asun Espoossa." }
   200  { "ok": true,  "invalid": [] }
   200  { "ok": false, "invalid": ["blarghti"] }   # words that aren't real Finnish
GET  /health     200  { "ok": true }
```

Optional auth: set `VOIKKO_SHARED_SECRET`; callers must then send
`X-Voikko-Secret: <that value>`.

## Run locally

```bash
# from the repo root
docker build -f services/voikko/Dockerfile -t puhuscribe-voikko .
docker run -p 8080:8080 puhuscribe-voikko
curl -s localhost:8080/validate -d '{"text":"Talo on blarghti."}'   # -> invalid: ["blarghti"]
```

## Deploy (any container host — Fly.io shown)

```bash
fly launch --no-deploy            # creates fly.toml; set internal_port = 8080
fly secrets set VOIKKO_SHARED_SECRET=<random-string>
fly deploy
```

Render / Railway / a small VM work the same way — it's one stateless container,
no database, ~150 MB. Health check: `GET /health`.

## Wire it to the Worker

Set these on the TTS Worker (GitHub repo secrets used by the deploy action, or
`wrangler secret put`), then redeploy the Worker:

- `VOIKKO_SERVICE_URL` = the service's public URL (e.g. `https://puhuscribe-voikko.fly.dev`)
- `VOIKKO_SHARED_SECRET` = the same secret you set above (only if you enabled it)

Until `VOIKKO_SERVICE_URL` is set, the Worker still translates island sentences,
but marks them **unverified** — the app saves them as clearly-labelled drafts
rather than treating them as Voikko-verified. Once the service is wired, new
sentences come back `verified: true`.
