# Patra — 3D Pop-Up Invitation Studio

Interactive 3D paper-craft invitation creator for Weddings, Haldi & Mehendi, Receptions, Birthdays, Parties, Baby Showers, Engagements, Housewarmings, and Festivals.

## Workspace Structure
- `packages/shared` — Shared TypeScript types, 9 categories, 27 curated templates, 12 palettes, modular 3D props, 8 music tracks, and INR/USD pricing plans.
- `apps/studio-3d` — Three.js + React interactive 4-room folding paper-craft 3D engine & Web Audio synth + video exporter (runs standalone in browser or embedded in Expo WebView via `?embed=1`).
- `apps/server` — Node.js + Express + TypeScript + Prisma (local PostgreSQL/pgAdmin) + Brevo OTP emails + Expo Push Notifications + Dodo Payments checkout & webhooks.
- `apps/mobile` — React Native (Expo + TypeScript) mobile app with 3D origami splash screen, 9-category template gallery, Custom Room Builder, full-bleed 3D editor, persistent local Exports gallery, Referral program, and Dodo Payments paywall.

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure PostgreSQL (pgAdmin) & Server Env
1. Create a local database named `patra` in pgAdmin.
2. Copy `apps/server/.env.example` to `apps/server/.env` and set `DATABASE_URL`, `JWT_SECRET`, `BREVO_API_KEY`, and `DODO_API_KEY`.
3. Push the Prisma schema:
```bash
npm run prisma:generate
npm run prisma:push
```

### 3. Run Everything Locally
Open 3 terminals:
```bash
# Terminal 1: 3D Studio Engine (http://localhost:5173)
npm run dev:studio

# Terminal 2: Express API Server (http://localhost:4000)
npm run dev:server

# Terminal 3: Expo Mobile App
npm run dev:mobile
```

> Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_STUDIO_URL` in `apps/mobile/.env` (see `apps/mobile/.env.example`) to your machine's LAN IP when testing on a physical phone with Expo Go.
