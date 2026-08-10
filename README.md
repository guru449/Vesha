# Vesha — Digital Wardrobe

Cross-platform (iOS & Android) digital wardrobe app built with **Expo + React Native**.

Phase 1 MVP focus: clothing upload, AI-assisted tagging with user confirmation, and wardrobe browse/search/filter/edit/delete.

## Theme

Soft sage closet aesthetic — calm greens, cool neutrals, Fraunces + Plus Jakarta Sans. Designed to feel friendly and easy to scan on mobile.

## Requirements

- Node.js 22+
- npm
- Expo Go SDK 57 (optional, for device testing)

## Getting started

```bash
npm ci
cp .env.example .env   # optional — see Backend below
npm run web            # browser preview
npm start              # Expo Go / device
```

Without Supabase env vars, the app runs in **local demo mode** (auto-enters wardrobe, AsyncStorage only).

## Backend (Supabase) — auth, sync, cloud photos

Vesha supports an optional Supabase backend. When configured, login/register become real, wardrobe data syncs per user, and photos upload to Storage.

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy **Project URL** + **anon public key** from **Settings → API** into `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

3. In Supabase → **SQL Editor**, run the full script in [`supabase/schema.sql`](supabase/schema.sql)  
   (tables, RLS, profile trigger, `wardrobe-images` storage bucket)
4. Auth → **Providers**: Email enabled  
   For easy testing, turn **off** “Confirm email” under Auth → Providers → Email
5. Restart Expo (`npm start`) so env vars load

### AI clothing recognition (OpenAI via Edge Function)

The app never holds the OpenAI key. Recognition runs in `supabase/functions/identify-clothing`.

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy identify-clothing
```

| Mode | When | Behavior |
|------|------|----------|
| **Local demo** | Env vars missing | Skip auth, mock wardrobe, photos on device, mock AI |
| **Cloud** | Env vars set | Real auth, empty closet per user, cloud photo URLs |
| **Live AI** | Cloud + function deployed + `OPENAI_API_KEY` | Real vision tags on **Identify with AI** |

If the function isn’t deployed yet, Identify with AI falls back to the demo mock and labels the banner **Demo suggestion**.

Profile shows which backend mode is active (`Cloud sync · Supabase` vs `Local demo`).

## Investor web demo (free hosting)

### Option A — Vercel (recommended, permanent free URL)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `guru449/Vesha` GitHub repo
3. Add the two `EXPO_PUBLIC_SUPABASE_*` env vars if you want cloud mode in production
4. Deploy (uses `vercel.json`)

Or from your machine after `npm i -g vercel`:

```bash
npm ci
npx vercel --prod
```

### Option B — Netlify (also free)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop) **or** import the GitHub repo
2. Build command: `npx expo export --platform web`
3. Publish directory: `dist`

### Option C — GitHub Pages

This repo includes `.github/workflows/deploy-github-pages.yml`.

1. GitHub → **Settings → Pages**
2. Source: **GitHub Actions**
3. After the workflow runs, your demo is at  
   `https://guru449.github.io/Vesha/`

### Local static export

```bash
npm run export:web   # outputs ./dist
npx serve dist
```

## Features

- Wardrobe grid with search + category filters
- Add item (camera/library)
  - **Photo quality check** — lighting, blur, resolution gate before tagging
  - **Identify with AI** → confirm/correct attributes
  - **Add photo as-is** → saves immediately to wardrobe
  - **Enter details manually** / AI no-match fallback
- Item detail (view/edit/delete, **multi-photo gallery**, **Wear today** per piece)
- Wear history for outfits **and** individual items
- **Wear log** — compact list of days you logged looks (through today)
- **Outfits** — list, create/edit from wardrobe pieces, mark as worn, delete
- **Today** — weather-aware “What should I wear?” stylist + wear history
- **Insights** — most worn, neglected pieces, category/color mix
- **Wardrobe Health** — AI-style check: utilization, versatility %, dormant items, closet gaps
- Profile (style preferences, sign out; avatar later)
- **Supabase foundation** — auth, Postgres sync, Storage uploads

AI recognition uses **OpenAI GPT-4o-mini** when the Edge Function is deployed; otherwise it uses the local mock.

## Project structure

- `app/` — Expo Router screens
- `components/` — UI + wardrobe components
- `constants/theme.ts` — design tokens
- `context/AppContext.tsx` — auth + wardrobe state (local or cloud)
- `data/` — types + mock wardrobe / AI stub
- `lib/aiIdentify.ts` — live AI client + mock fallback
- `lib/supabase.ts` — Supabase client
- `lib/cloudData.ts` — cloud CRUD
- `lib/uploadImage.ts` — Storage upload + local fallback
- `lib/persistImage.ts` — local file copy for demo mode
- `supabase/schema.sql` — database + storage setup
- `supabase/functions/identify-clothing/` — vision Edge Function
