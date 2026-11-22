# @chordially/mobile

Expo/React Native app for Chordially.

## Configuration

- `EXPO_PUBLIC_API_URL`: backend base URL (e.g. `http://localhost:4000`). In release builds, this must be set or the app fails fast at startup.
- iOS bundle identifier: `com.chordially.mobile`
- Android package: `com.chordially.mobile`
- URL scheme: `chordially`

## Versioning

- `expo.version`: user-facing app version (`1.0.0`).
- `ios.buildNumber`: increment for each iOS submission.
- `android.versionCode`: increment as an integer for each Android submission.

## Permissions

Image picking uses `expo-image-picker`. `app.json` configures `photosPermission` with a user-facing string. Run `expo prebuild --no-install` to verify native permission config.

## Monorepo / Metro

The app consumes `@chordially/shared` via workspace dependency. `metro.config.js` adds the repo root to `watchFolders` and configures node module resolution for monorepo development. Jest maps `@chordially/shared` to `../../packages/shared/src/index.ts`.
