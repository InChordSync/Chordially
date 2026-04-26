# Incident Severity Matrix and Runbook Template

This document provides on-call engineers with a clear severity classification and a repeatable runbook structure so incidents are handled consistently and post-mortems capture the right information.

## Severity Matrix

| Severity | Definition | Initial Response | Update Cadence | Escalation |
|---|---|---|---|---|
| **P0 — Critical** | Total service outage. All users unable to access the platform or a core service is completely unavailable. | 15 minutes | Every 15 minutes | CTO + all team leads immediately |
| **P1 — High** | Major feature or payment flow is down. Significant subset of users impacted, no acceptable workaround. | 1 hour | Every 30 minutes | Engineering lead + product lead |
| **P2 — Medium** | Degraded performance or non-critical feature unavailable. Workaround exists or impact is limited. | 4 hours | Every 2 hours | On-call engineer; escalate if not resolved in 4h |
| **P3 — Low** | Minor issue with minimal user impact (cosmetic bug, slow non-critical endpoint). | Next business day | Daily during business hours | Standard ticket queue |

---

## Runbook Template

Copy and fill in the sections below when an incident is declared.

```
# Incident: <Short Title>

Date: YYYY-MM-DD
Severity: P0 / P1 / P2 / P3
Incident Commander: <name>
Status: Investigating / Mitigating / Resolved
```

### 1. Detection

- **How was the incident detected?** (Alert, user report, monitoring dashboard, etc.)
- **Time of detection (UTC):**
- **Alert or ticket link:**
- **Initial symptoms observed:**

### 2. Impact Assessment

- **Services affected:**
- **Estimated number of users impacted:**
- **Geographic or segment scope:**
- **Revenue or SLA impact:**
- **Is data integrity at risk?** (Yes / No / Unknown)

### 3. Mitigation

- **Immediate actions taken** (with timestamps):
  - `HH:MM UTC` — <action taken>
  - `HH:MM UTC` — <action taken>
- **Root cause hypothesis:**
- **Mitigation applied:**
- **Time to mitigation (TTM):**
- **Validation:** How was it confirmed that the issue is resolved?

### 4. Communication

- **Internal notifications sent:** (Slack channel, who was paged)
- **External / customer communication:** (Status page update, support email, etc.)
- **Stakeholders notified:**
- **Time of resolution communication (UTC):**

### 5. Post-Mortem

Complete within 48 hours of resolution for P0/P1, within one week for P2.

- **Timeline of events** (detection → resolution, in chronological order):
- **Root cause (confirmed):**
- **Contributing factors:**
- **What went well:**
- **What went wrong:**
- **Action items:**

| Action | Owner | Due Date |
|---|---|---|
| <preventive/detective fix> | <name> | YYYY-MM-DD |

- **Follow-up review scheduled:** YYYY-MM-DD
