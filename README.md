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
npm start       # Expo dev server (scan QR for iOS/Android)
npm run ios     # iOS simulator (macOS)
npm run android # Android emulator
```

## Phase 1 screens

- Welcome / Login / Register
- Wardrobe grid with search + category filters
- Add item (camera/library) → AI identify → confirm/correct attributes
- Item detail (view/edit/delete)
- Profile

AI recognition is **mocked** in Phase 1 so the UX flow can be validated before the real Phase 2 recognition engine.

## Project structure

- `app/` — Expo Router screens
- `components/` — UI + wardrobe components
- `constants/theme.ts` — design tokens
- `context/AppContext.tsx` — auth + wardrobe state
- `data/` — types + mock wardrobe / AI stub
