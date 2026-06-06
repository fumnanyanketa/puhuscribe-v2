# Deploying PuhuScribe to Vercel

The frontend is a Vite + React app. Vercel builds and hosts it; it talks to
Supabase directly from the browser using the **publishable anon key** (safe to
expose — Row Level Security protects the data).

> The Azure TTS key and Anthropic key are **server-side only** and never go
> here. They belong in the Cloudflare Worker, added in a later phase.

## One-time setup

1. Go to **https://vercel.com** → **Sign Up** (or Log In) → **Continue with GitHub**.
2. **Add New… → Project**.
3. Find **`puhuscribe-v2`** in the repo list → **Import**.
   - If it isn't listed, click **Adjust GitHub App Permissions** and grant Vercel access to the repo.
4. On the **Configure Project** screen:
   - **Framework Preset** should auto-detect **Vite** (leave Build/Output as-is — `vercel.json` pins them).
   - Open **Environment Variables** and add these two:

     | Name | Value |
     |------|-------|
     | `VITE_SUPABASE_URL` | *your Supabase project URL* |
     | `VITE_SUPABASE_ANON_KEY` | *your Supabase publishable (anon) key* |

     (Both are in your Supabase dashboard under **Project Settings → API**.)
5. Click **Deploy**. First build takes ~1 minute.
6. When it finishes, click **Visit** to open your live `https://…vercel.app` link.

## Which branch deploys

Vercel deploys the repository's **default branch**, which is
`claude/gallant-lovelace-yw1EP` — all current work. Every later push to that
branch redeploys automatically, and every other branch gets its own preview URL.

## If the page is blank or shows an error

- **"Missing VITE_SUPABASE_URL…"** → the env vars weren't set at build time.
  Add them (step 4), then **Deployments → ⋯ → Redeploy**.
- **A "Virhe / lataus epäonnistui" panel** → the browser reached Supabase but the
  query failed. Most likely RLS or a wrong key. Re-check the anon key value.
- **Styling looks unstyled** → hard refresh (Cmd/Ctrl+Shift+R).

## Local development (optional)

```bash
npm install
# create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev      # http://localhost:5173
```
