# Innonzu by Innovatoor

A real estate marketplace for Rwanda: rent or sell houses, sell plots.
Owners list directly and pay Innovatoor a one-time listing fee; seekers
browse and contact owners directly, with no commission agents in between.

This folder contains the **real, deployable app** - a Flask + SQLite/Postgres
backend with a proper database, and a frontend that talks to it over a
JSON API. (This is different from the single-file version you may have seen
running as a Claude.ai artifact preview, which used the browser's own storage
instead of a real database and could not process real payments.)

```
innonzu-app/
  backend/     Flask API, database models, payment provider
  frontend/    index.html + app.js (talks to the backend API)
```

## 1. Run the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# open .env and at minimum set:
#   SECRET_KEY        - any long random string
#   ADMIN_PASSWORD    - change from the default
#   DEV_MODE=1        - while you don't have real MTN MoMo credentials yet

# load the .env file into your shell (or use python-dotenv / your host's env settings)
export $(grep -v '^#' .env | xargs)

python3 seed.py        # adds 4 example listings so the site isn't empty
python3 app.py         # starts on http://127.0.0.1:5000
```

The first time it runs, it creates `innonzu.db` (SQLite) and prints the admin
username/password it created (from `ADMIN_USERNAME` / `ADMIN_PASSWORD`, or
`admin` / `innonzu-admin` if you didn't set them - **change this**).

## 2. Run the frontend

The frontend is plain HTML/CSS/JS - no build step. Because it calls the
backend across origins, open it through a small local server rather than
double-clicking the file:

```bash
cd frontend
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080` in your browser. If your backend runs
somewhere other than `http://127.0.0.1:5000`, change the one line near the
top of `frontend/index.html`:

```html
<script>
  window.INNONZU_API_BASE = "http://127.0.0.1:5000";
</script>
```

## 3. Try it

- Browse the 4 seeded listings, try "Smart search" (works with plain keyword
  matching until you add an Anthropic API key - see below).
- Click "List your property", fill it in, upload a couple of photos, then on
  the payment step enter any phone number and send the request. With
  `DEV_MODE` unset or set, the built-in mock payment provider approves itself
  automatically after ~3 seconds (no real money moves) and your listing goes
  live.
- Go to "My listings" with the phone number you listed with to edit the
  price or mark it rented/sold.
- Go to "Innovatoor admin" (bottom of the footer) to log in and set the
  listing fee for rent/sale/plot separately.

## Turning on real features

### AI smart search + description writer
Set `ANTHROPIC_API_KEY` in `backend/.env` (get one at
[console.anthropic.com](https://console.anthropic.com)). Without it, smart
search falls back to plain keyword matching and the description helper
falls back to a simple templated sentence - the app still works either way.

### Real mobile money payments (MTN MoMo)
This is what you asked for: owners enter a phone number and get sent a real
payment prompt on their handset, rather than picking a provider first.

1. Create an account at [momodeveloper.mtn.com](https://momodeveloper.mtn.com)
2. Subscribe to the **Collections** product to get a Subscription Key
3. Create an API user + API key (sandbox first, then production once MTN
   approves your business)
4. Set in `backend/.env`:
   ```
   MOMO_SUBSCRIPTION_KEY=...
   MOMO_API_USER=...
   MOMO_API_KEY=...
   MOMO_ENVIRONMENT=sandbox        # or mtnrwanda for production
   ```
5. Remove/unset `DEV_MODE`.

The app automatically switches from the mock payment provider to
`backend/payments/mtn_momo.py` the moment those variables are set - nothing
else in the code changes. **Important:** that file is written against MTN's
published API shape but hasn't been tested against a live MTN account (no
sandbox credentials were available while building this) - test it against
your own sandbox before trusting it with real money, and re-check
momodeveloper.mtn.com for any changes to the endpoints. Adding Airtel Money
or a card processor later means writing one more file next to it that
implements the same two methods (`request_to_pay`, `check_status`) - see
`backend/payments/base.py`.

### Production database
SQLite is fine to start. For real traffic, run Postgres and set:
```
DATABASE_URL=postgresql://user:password@host:5432/innonzu
```

### Deploying
- Backend: any host that runs Python (a small VPS, Render, Railway,
  PythonAnywhere...). Run it with `gunicorn app:app` instead of the dev
  server (`gunicorn` is already in requirements.txt).
- Frontend: any static host (same VPS, Netlify, GitHub Pages, or served
  directly by Flask). Just make sure `window.INNONZU_API_BASE` in
  `index.html` points at wherever the backend actually lives, and set
  `ALLOWED_ORIGIN` in the backend's `.env` to your frontend's real domain
  once you're not developing locally anymore (leaving it as `*` is fine for
  development, but should be tightened before going live).

## What's still worth hardening before real users touch this

- **Owner identity** is currently just "does the phone number you typed match
  the one on the listing" - fine for a first version, but anyone who knows a
  number could edit or delete that listing. A real version should verify
  phone ownership with an SMS/OTP code before allowing edits.
- **Admin auth** is a single username/password. Fine for one or two
  Innovatoor staff; add proper user roles if the team grows.
- **Rate limiting** isn't implemented - add it before this is public, so
  the AI endpoints and payment requests can't be spammed.
