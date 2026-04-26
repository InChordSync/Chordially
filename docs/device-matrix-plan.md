# Device Matrix Plan – Chordially MVP

This document defines the device coverage required before each release milestone.

## Priority Tiers

| Tier | Description |
|------|-------------|
| P0   | Must pass on every sprint — blockers if failing |
| P1   | Must pass before each release candidate |
| P2   | Best-effort; failures are logged but non-blocking |

## iOS Devices

| Device        | OS Version | Priority | Notes                    |
|---------------|------------|----------|--------------------------|
| iPhone 15 Pro | iOS 17     | P0       | Latest flagship          |
| iPhone 14     | iOS 17     | P0       | High market share        |
| iPhone 13     | iOS 16     | P0       | Common deployment target |
| iPhone 12     | iOS 16     | P1       | Lower end of support     |

## Android Devices

| Device            | OS Version  | Priority | Notes                         |
|-------------------|-------------|----------|-------------------------------|
| Pixel 6           | Android 12  | P0       | Reference Android hardware    |
| Pixel 6           | Android 13  | P0       | OS upgrade coverage           |
| Samsung Galaxy S22| Android 13  | P0       | High market share OEM         |
| Samsung Galaxy S22| Android 14  | P1       | Latest Samsung OS             |
| OnePlus 11        | Android 13  | P1       | Alternative OEM validation    |
| OnePlus 11        | Android 14  | P2       | Extended coverage             |

## Testing Cadence

- **Each sprint (P0):** Run automated UI tests on P0 devices via emulator/simulator in CI.
- **Pre-release (P0 + P1):** Manual smoke test on physical P0 and P1 devices before tagging a release candidate.
- **Post-release (P2):** Community or QA team spot-checks on P2 devices within one week of release.

## Notes

- iOS Simulator covers basic layout and logic; at least one physical iPhone must be tested per release.
- Android emulators (AVD) are acceptable for P0 CI runs; physical devices required for P1 pre-release sign-off.
- New device additions require a PR updating this document and sign-off from the mobile lead.
