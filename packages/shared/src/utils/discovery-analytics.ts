export interface DiscoveryFunnelEvent {
  eventName: "DISCOVERY_IMPRESSION" | "CREATOR_CLICK" | "FOLLOW_TOGGLE" | "BOOKMARK_TOGGLE"
  surface: "web_hero" | "web_search" | "mobile_explore" | "mobile_search"
  creatorId?: string
  metadata?: Record<string, unknown>
  timestamp?: string
}

export class DiscoveryAnalyticsTracker {
  private static events: DiscoveryFunnelEvent[] = []

  public static track(event: DiscoveryFunnelEvent): DiscoveryFunnelEvent {
    const record: DiscoveryFunnelEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    }
    this.events.push(record)
    return record
  }

  public static getEvents(): DiscoveryFunnelEvent[] {
    return [...this.events]
  }

  public static clear(): void {
    this.events = []
  }
}
