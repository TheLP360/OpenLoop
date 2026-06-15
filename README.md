# OpenLoop

Your private **GTD + PARA** workspace. OpenLoop renames the classic PARA
elements into a vocabulary that fits how you actually work:

| PARA / GTD | OpenLoop      | What it is                                   |
| ---------- | ------------- | -------------------------------------------- |
| Tasks      | **Next Steps**| Single physical actions                      |
| Projects   | **Outcomes**  | Multi-step results you're committed to       |
| Notes      | **Thoughts**  | Notes, journaling, free writing              |
| Resources  | **Resources** | Reference material                           |

Everything starts in **Quick Capture** (the floating **+** button) → lands in
**Intake** → gets processed into a full record with energy, priority, tags,
dates, attachments, and a **resurface date** that brings it back to Intake when
it's time to reconsider it.

It's a **PWA** — install it to your phone's home screen and it behaves like a
native app. It's backed by **Supabase** (Postgres + Auth + Storage), is
**AI-searchable** via a small API, and can capture on the fly via **Telegram**.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase**: Postgres (source of truth), Auth (single private user via RLS),
  Storage (attachments)
- **PWA**: web manifest + service worker (offline app shell)

---

## 1. Create your Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_storage_and_search.sql`
3. **Authentication → Providers → Email**: enable it. For a frictionless solo
   setup you can turn **"Confirm email"** off.
4. From **Settings → API**, grab:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — keep secret)

## 2. Configure environment

```bash
cp .env.example .env.local
# fill in the values
```

You'll set `OPENLOOP_OWNER_ID` after your first sign-in (next step).

## 3. Run locally

```bash
npm install
npm run dev
# open http://localhost:3000 → you'll be sent to /login
```

Create your account on the login screen. Then go to **Settings** — it shows your
**user id**. Put that value into:

- `.env.local` → `OPENLOOP_OWNER_ID` (so the AI / Telegram routes attribute
  captures to you), and
- `supabase/seed.sql` (replace the placeholder UUID) — then run `seed.sql` in
  the SQL editor to load the example templates (Spring Home Maintenance + the
  writing prompts). Restart `npm run dev` after editing env.

## 4. Install on your phone

Deploy (see below), open the URL in mobile Safari/Chrome, and choose **Add to
Home Screen**. It launches full-screen, with an app icon and a Quick-Capture
shortcut.

---

## Deploying (Vercel recommended)

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com) and add every variable from
   `.env.example` as a project env var.
3. Deploy. Your app lives at `https://<project>.vercel.app`.

> Any Node host works (Render, Fly, a VPS with `npm run build && npm start`).

---

## AI search

A shared-secret API lets an AI assistant read and write your OpenLoop data.
Set `AI_SEARCH_API_KEY` to a long random string, then:

**Search** (ranked fuzzy match across Next Steps, Outcomes, Thoughts, Resources):

```bash
curl -X POST https://<your-app>/api/ai/search \
  -H "x-openloop-key: $AI_SEARCH_API_KEY" \
  -H "content-type: application/json" \
  -d '{"query":"gutters","kind":"next_step","limit":10}'
```

**Browse**: `GET /api/ai/items?kind=outcome&status=active&limit=50`

**Capture** (drops into Intake):

```bash
curl -X POST https://<your-app>/api/ai/items \
  -H "x-openloop-key: $AI_SEARCH_API_KEY" \
  -H "content-type: application/json" \
  -d '{"title":"Call the roofer","kind":"next_step"}'
```

These run server-side with the service-role key, scoped to `OPENLOOP_OWNER_ID`.
(Hook this up to an MCP server or a custom GPT/assistant to chat with your data.)

## Telegram capture (optional)

1. Create a bot with [@BotFather](https://t.me/BotFather) → get the token →
   `TELEGRAM_BOT_TOKEN`.
2. Pick a random `TELEGRAM_WEBHOOK_SECRET`.
3. Find your numeric Telegram user id (e.g. via @userinfobot) →
   `TELEGRAM_ALLOWED_USER_ID` (only you can capture).
4. Register the webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<your-app>/api/telegram/webhook?secret=<TELEGRAM_WEBHOOK_SECRET>" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Now texting your bot drops a card into Intake. The first line becomes the title,
the rest the description; URLs become link attachments, and photos/documents are
saved to Storage.

---

## Data model (one table to rule them all)

All four element types live in a single polymorphic `items` table (`kind` =
`next_step | outcome | thought | resource`, nullable until you triage it). This
keeps Quick Capture, Intake, and AI search dead simple. Supporting tables:

- `attachments` — links, documents, images for any item (Storage-backed)
- `templates` + `template_steps` — Outcome templates (pre-loaded Next Steps) and
  Thought templates (writing prompts)

Row Level Security scopes every row to its owner, so the app is private by
construction.

---

## Roadmap / phases

- **Phase 1 (this build):** the four elements + full forms, Quick Capture FAB,
  Intake processing with resurface dates, attachments, templates, AI search,
  Telegram capture. Recurrence fields exist in the schema.
- **Phase 2:** the recurrence engine (materialize recurring Next Steps/Outcomes
  from `recurrence_rule`), push notifications, richer search ranking, calendar
  view, and an MCP server wrapper for the AI API.
