# Noesis Peak 🏔️
### Academy Performance Platform — SV 07 Elversberg

---

## What this is

A full-stack web app with two sides:
- **Players** → Check-In, Recovery, Stats, Rating Card, Coach Messages
- **Coaches** → Redirects to the existing athlete monitoring dashboard

---

## Deploy in 15 minutes

### Step 1 — Supabase setup
1. Open your Supabase project → SQL Editor
2. Paste and run the contents of `supabase_setup.sql`
3. Replace `YOUR_COACH_EMAIL@example.com` with your actual email before running

### Step 2 — Deploy to Vercel
1. Push this folder to a GitHub repo (or upload via Vercel CLI)
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo
3. Add these environment variables in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL      → from Supabase: Settings → API
   NEXT_PUBLIC_SUPABASE_ANON_KEY → from Supabase: Settings → API
   ```
4. Click Deploy — done ✅

### Step 3 — Create accounts for players
1. In Supabase → Authentication → Users → Invite user
2. Enter the player's email — they get a magic link to set their password
3. After they sign up, link them to their player record:
   ```sql
   UPDATE public.players SET profile_id = '<their_uuid>'
   WHERE name = 'Max Mustermann';
   ```
   Find the UUID in Supabase → Authentication → Users

### Step 4 — Send coach messages
In Supabase → Table Editor → `coach_messages`:
- Add a row with `title`, `body`, and optionally `target_squad` (e.g. 'U17')

---

## Project structure

```
app/
├── page.tsx           → root redirect (coach/player)
├── login/page.tsx     → login screen
├── player/
│   ├── layout.tsx     → nav + auth guard
│   ├── page.tsx       → check-in + streak
│   ├── recovery/      → recovery protocol
│   ├── stats/         → wellness trends
│   ├── card/          → FIFA-style rating card
│   └── messages/      → coach messages
├── coach/page.tsx     → redirects to dashboard
lib/
├── supabase.ts        → Supabase client
└── i18n.ts            → DE/EN translations
```

---

## Adding a new language
Edit `lib/i18n.ts` — add a new language object and update the `Lang` type.

---

Built by Panos Basios · SV 07 Elversberg · 2026
