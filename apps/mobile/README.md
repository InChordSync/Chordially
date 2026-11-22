# @chordially/mobile

React Native / Expo app for the Chordially mobile experience.

## Supported platforms

- iOS (simulator/device)
- Android (emulator/device)

Web is not currently a supported target for this app. Use `pnpm dev` in `apps/web` for the web experience.

## Setup

From the repo root:

```bash
pnpm install
pnpm dev:mobile
```

Or from this directory:

```bash
pnpm dev
```

## Environment variables

Copy `.env.example` values into your local environment as needed.

- `EXPO_PUBLIC_API_URL`: Base URL for the Chordially API.

Platform defaults when `EXPO_PUBLIC_API_URL` is not set:

- iOS simulator: `http://localhost:4000`
- Android emulator: `http://10.0.2.2:4000`
- Physical device: set `EXPO_PUBLIC_API_URL` to your machine LAN IP, e.g. `http://192.168.1.10:4000`

The app also tries to derive the dev host from Expo's bundle URL when available.

## Tests

Mobile tests live in `src/__tests__/**/*.test.[jt]s?(x)`.

Run from repo root:

```bash
pnpm --filter @chordially/mobile test
```

Or from this directory:

```bash
pnpm test
```
