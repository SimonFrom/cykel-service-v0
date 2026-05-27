# cykel-service-v0

A cross-platform bike-shop service management app for tracking customers, their bikes, and repair jobs. Built with Expo (React Native) and Supabase, runs on iOS, Android and the Web from a single codebase.

The UI is in Danish (*Kunder*, *Reperationer*, *Opret kunde* …) and is aimed at small bike workshops that need a lightweight alternative to a full POS / ERP system.

## Features

- **Customers** — create, list, view and delete customers, including club affiliation and free-text notes.
- **Bikes** — each customer can own multiple bikes (MTB, City, Shopping, Børne, Racer). Bikes are linked to their owner and to their repair history.
- **Repairs** — create repair jobs with line items (parts + labour), intake/delivery dates, total price, completion status and payment status.
- **Dark / light mode** — automatic theme switching driven by the device color scheme.
- **Native + Web** — same codebase ships to iOS, Android and a static web build via Expo Router.
- **Supabase backend** — authenticated data access with session persistence via `expo-secure-store` on native and `localStorage` on web.

## Tech stack

| Layer | Tool |
|------|------|
| App framework | [Expo](https://expo.dev/) ~54 + [Expo Router](https://expo.github.io/router) |
| UI | [React Native](https://reactnative.dev/) 0.81, [React Native Reusables](https://reactnativereusables.com), [Nativewind](https://www.nativewind.dev/) (Tailwind for RN) |
| State | [Zustand](https://github.com/pmndrs/zustand) stores per resource (`customerStore`, `bikeStore`, `repairStore`) |
| Forms | [react-hook-form](https://react-hook-form.com/) |
| Backend | [Supabase](https://supabase.com/) (`@supabase/supabase-js`) |
| Language | TypeScript ~5.9 |
| Icons | `lucide-react-native`, `@expo/vector-icons` |

## Project structure

```
app/                        Expo Router routes
  (tabs)/                     Tab navigator: Forside, Kunder, Reperationer
    customers/[id]/             Customer detail + nested bike detail
    repairs/                    Repair list
  createCustomerModal.tsx     Modal screens for create flows
  createBikeModal.tsx
  createRepairModal.tsx
components/
  ui/                         Domain forms (createBikeForm, createRepairForm…)
  ui/stock components/        Generic RN Reusables primitives (button, input, dialog…)
crud/                       Supabase CRUD helpers per table (bikes, customers, repairs)
store/                      Zustand stores
types/                      Shared TS types: Customer, Bike, Repair, RepairItem
utils/supabase.ts           Supabase client with platform-aware secure storage
lib/                        theme + utilities
assets/                     Icons, splash, logos
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root with your Supabase project credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<your-anon-key>
```

The Supabase schema expects tables named `customers`, `bikes` (with `customer_id`) and `repairs`. See `crud/*.ts` for the exact column names used by each query.

### 3. Run the development server

```bash
npm run dev          # expo start -c
npm run ios          # iOS simulator (macOS only)
npm run android      # Android emulator
npm run web          # Web (Metro static)
```

Inside the Expo Dev Server:

- press `i` — iOS simulator
- press `a` — Android emulator
- press `w` — Web browser

Or scan the QR code with [Expo Go](https://expo.dev/go) on a physical device.

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the Expo Dev Server with a clean cache |
| `npm run ios` | Launch on the iOS simulator |
| `npm run android` | Launch on the Android emulator |
| `npm run web` | Run the Metro web bundler |
| `npm run clean` | Remove `.expo` and `node_modules` |

## Adding UI components

This project uses [React Native Reusables](https://reactnativereusables.com). To pull in additional components:

```bash
npx react-native-reusables/cli@latest add [...components]
# e.g.
npx react-native-reusables/cli@latest add input textarea
```

Omit names to pick interactively, or pass `--all`.

## Deploying

Build and ship with [EAS](https://expo.dev/eas):

- [EAS Build](https://docs.expo.dev/build/introduction/) — native binaries for iOS and Android
- [EAS Submit](https://docs.expo.dev/submit/introduction/) — store submission
- [EAS Update](https://docs.expo.dev/eas-update/introduction/) — OTA JS updates

The web target builds to a static bundle (`app.json` → `web.output: "static"`) and can be deployed to any static host.

## Status

Early-stage internal tool — interfaces and the Supabase schema are still in flux.
