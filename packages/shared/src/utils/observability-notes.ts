export const observabilityNotes: Record<string, { logs: string[]; counters: string[]; alerts: string[] }> = {
  auth: {
    logs: ["login_attempt", "login_success", "login_failure", "logout"],
    counters: ["auth.attempts", "auth.failures"],
    alerts: ["auth.failures > 50/min → PagerDuty"],
  },
  payment: {
    logs: ["payment_initiated", "payment_confirmed", "payment_failed"],
    counters: ["payment.initiated", "payment.confirmed", "payment.failed"],
    alerts: ["payment.failed > 10/min → Slack #payments-alerts"],
  },
  profile: {
    logs: ["profile_updated", "avatar_uploaded"],
    counters: ["profile.updates"],
    alerts: [],
  },
  stellar: {
    logs: ["stellar_tx_submitted", "stellar_tx_confirmed", "stellar_tx_failed"],
    counters: ["stellar.submitted", "stellar.confirmed", "stellar.failed"],
    alerts: ["stellar.failed > 5/min → PagerDuty"],
  },
};

export function printObservabilityNotes(): void {
  for (const [domain, notes] of Object.entries(observabilityNotes)) {
    console.log(`\n[${domain}]`);
    console.log(`  Logs: ${notes.logs.join(", ")}`);
    console.log(`  Counters: ${notes.counters.join(", ")}`);
    if (notes.alerts.length) console.log(`  Alerts: ${notes.alerts.join("; ")}`);
  }
}
