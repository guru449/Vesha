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
npm run web      # browser preview
npm start       # Expo Go / device
```

The app opens straight into the wardrobe (auth deferred for easy testing).

## Investor web demo (free hosting)

### Option A — Vercel (recommended, permanent free URL)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `guru449/Vesha` GitHub repo
3. Leave defaults (uses `vercel.json`) → **Deploy**
4. Share the `*.vercel.app` link with investors

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

## Phase 1 + Outfit Builder screens

- Wardrobe grid with search + category filters
- Add item (camera/library)
  - **Identify with AI** → confirm/correct attributes
  - **Add photo as-is** → saves immediately to wardrobe
  - **Enter details manually** / AI no-match fallback
- Item detail (view/edit/delete)
- **Outfits** — list, create/edit from wardrobe pieces, mark as worn, delete
- **Today** — “What should I wear?” stylist + wear history
- Profile (height/weight saved; avatar later)

AI recognition is **mocked** in Phase 1. Photos are copied into app storage so they still appear after save.

## Project structure

- `app/` — Expo Router screens
- `components/` — UI + wardrobe components
- `constants/theme.ts` — design tokens
- `context/AppContext.tsx` — auth + wardrobe state
- `data/` — types + mock wardrobe / AI stub
- `lib/persistImage.ts` — persist camera/library photos
