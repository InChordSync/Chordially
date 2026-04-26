# MVP Launch Checklist

A reusable checklist to run through before each major release. Confirm every item before proceeding to the next section.

---

## Pre-Launch

- [ ] All required environment variables are set in production
- [ ] Database migrations have been run and verified
- [ ] Secrets and API keys have been rotated
- [ ] Smoke tests are passing in the staging environment
- [ ] Dependency versions are pinned and audited for known vulnerabilities
- [ ] Build artifacts are confirmed and checksums validated
- [ ] Rollback plan is documented and tested

---

## Launch Day

- [ ] Monitoring dashboards are live and showing real-time data
- [ ] Alerting thresholds are configured and notifications routed correctly
- [ ] Support channels are open and the on-call team is briefed
- [ ] Feature flags are configured to the intended state for launch
- [ ] Load balancer health checks are passing
- [ ] CDN cache is cleared where required
- [ ] Release notes are published and accessible to users

---

## Post-Launch

- [ ] Metrics reviewed at the 1-hour mark (error rates, latency, throughput)
- [ ] Metrics reviewed at the 24-hour mark (retention, engagement, anomalies)
- [ ] Incident runbook is linked from the release document
- [ ] Any hotfixes or follow-up issues are logged and triaged
- [ ] Retrospective is scheduled with the full team
- [ ] Monitoring dashboards updated with baseline thresholds from live traffic
