# Mobile Auth QA Scenarios (Quick Run)

Issue: #384

Run these checks in under 10 minutes on a dev build.

1. Register with a new email and confirm success screen appears.
2. Sign in with valid credentials and confirm authenticated landing.
3. Sign in with wrong password and confirm friendly error copy.
4. Trigger forgot-password request and confirm neutral success message.
5. Open verification deep link and confirm completion state.

Expected outcome: no crashes, clear messaging, and consistent state transitions.
