# Vesha — Digital Wardrobe

Cross-platform (iOS & Android) digital wardrobe app built with **Expo + React Native**.

Phase 1 MVP focus: registration/profile, clothing upload, AI-assisted tagging with user confirmation, and wardrobe browse/search/filter/edit/delete.

## Theme

Soft sage closet aesthetic — calm greens, cool neutrals, Fraunces + Plus Jakarta Sans. Designed to feel friendly and easy to scan on mobile.

## Requirements

- Node.js 22+
- npm
- Expo Go (optional, for device testing) or iOS Simulator / Android Emulator

## Getting started

```bash
npm ci
npm run web      # browser preview (useful for UI reviews)
npm start       # Expo Go / device (needs Expo Go SDK 57)
npm run ios     # iOS simulator (macOS)
npm run android # Android emulator
```

The app opens straight into the wardrobe (auth deferred for easy testing).

## Phase 1 screens

- Wardrobe grid with search + category filters
- Add item (camera/library)
  - **Identify with AI** → confirm/correct attributes
  - **Add photo as-is** → saves immediately to wardrobe
  - **Enter details manually** / AI no-match fallback
- Item detail (view/edit/delete)
- Profile (height/weight saved; avatar later)

AI recognition is **mocked** in Phase 1. Photos are copied into app storage so they still appear after save.

## Project structure

- `app/` — Expo Router screens
- `components/` — UI + wardrobe components
- `constants/theme.ts` — design tokens
- `context/AppContext.tsx` — auth + wardrobe state
- `data/` — types + mock wardrobe / AI stub
