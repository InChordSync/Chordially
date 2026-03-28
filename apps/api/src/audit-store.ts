export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  path: string;
  method: string;
  createdAt: string;
}

const events: AuditEvent[] = [];

export function recordAuditEvent(event: AuditEvent) {
  events.unshift(event);
}

export function listAuditEvents() {
  return events;
}
