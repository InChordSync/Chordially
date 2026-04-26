# Mobile Deep-Link Strategy

## URL Scheme

The app registers the custom URL scheme `chordially://` for deep linking on both iOS and Android.

## Universal Links

Domain: `app.chordially.com`

Universal Links allow web URLs to open the app directly on iOS (via Associated Domains) and Android (via App Links / Digital Asset Links).

## Route Table

| Deep Link URL | Screen |
|---|---|
| `chordially://artist/:id` | Artist profile screen |
| `chordially://session/:id` | Live session screen |
| `chordially://auth/callback` | Auth callback / OAuth redirect handler |

## React Navigation Linking Config

```ts
const linking = {
  prefixes: ['chordially://', 'https://app.chordially.com'],
  config: {
    screens: {
      ArtistProfile: 'artist/:id',
      Session: 'session/:id',
      AuthCallback: 'auth/callback',
    },
  },
};
```

Pass `linking` as a prop to `<NavigationContainer linking={linking} />`.

## Fallback for Unrecognised Routes

If an incoming URL does not match any registered route, the app navigates to the Home screen by default. Configure this via the `getStateFromPath` override in the linking config to catch unmatched paths and redirect gracefully.
