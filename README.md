# Vesha

A minimal notes app starter built with [Next.js](https://nextjs.org) (App Router),
TypeScript, and Tailwind CSS. It demonstrates a full request/response flow: the UI
reads and writes notes through an API route (`/api/notes`).

## Requirements

- Node.js 22+
- npm (a `package-lock.json` is committed)

## Getting started

```bash
npm ci        # install dependencies from the lockfile
npm run dev   # start the dev server at http://localhost:3000
```

Open http://localhost:3000 and add a note. New notes are posted to the
`/api/notes` route and rendered back in the list.

## Available scripts

- `npm run dev` — start the development server.
- `npm run build` — create a production build.
- `npm start` — run the production server (after `npm run build`).
- `npm run lint` — run ESLint.
- `npm run typecheck` — type-check with the TypeScript compiler.

## Project structure

- `src/app/page.tsx` — the notes UI (client component).
- `src/app/api/notes/route.ts` — GET/POST API handlers.
- `src/lib/notes.ts` — in-memory notes store (swap for a database as needed).

## Notes storage

The starter keeps notes in an in-memory array, so they reset when the server
restarts. Replace `src/lib/notes.ts` with a real data layer when you need
persistence.
