type SupportEvent =
  | "support_page_viewed"
  | "payment_method_selected"
  | "payment_submitted"
  | "payment_confirmed"
  | "payment_failed"
  | "receipt_viewed";

interface AnalyticsEvent {
  event: SupportEvent;
  userId: string;
  creatorId: string;
  amount?: number;
  timestamp: string;
}

const eventBuffer: AnalyticsEvent[] = [];

export function trackSupportEvent(
  event: SupportEvent,
  userId: string,
  creatorId: string,
  amount?: number
): void {
  eventBuffer.push({ event, userId, creatorId, amount, timestamp: new Date().toISOString() });
}

export function flushEvents(): AnalyticsEvent[] {
  const events = [...eventBuffer];
  eventBuffer.length = 0;
  return events;
}

export function getSupportFunnelCount(): Record<SupportEvent, number> {
  return eventBuffer.reduce(
    (acc, e) => { acc[e.event] = (acc[e.event] ?? 0) + 1; return acc; },
    {} as Record<SupportEvent, number>
  );
}
