# Staged Rollout Plan

1. **Parallel Run**: Deploy NestJS API alongside Express API.
2. **Feature Flagging**: Gradually route traffic from Express to NestJS via reverse proxy.
3. **Full Cutover**: Drop Express and send 100% traffic to NestJS.
