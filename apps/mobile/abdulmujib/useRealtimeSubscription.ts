import { useCallback, useEffect, useRef, useState } from "react";

type ConnectionState = "connecting" | "connected" | "disconnected";

interface RealtimeEvent {
  type: "tip" | "session_update";
  payload: Record<string, unknown>;
  receivedAt: number;
}

interface UseRealtimeSubscriptionOptions {
  /** WebSocket server URL, e.g. "wss://api.chordially.io/ws" */
  url: string;
  /** Subscribe to events for a specific session. */
  sessionId?: string;
  /** Subscribe to events for a specific user (artist). */
  userId?: string;
}

/**
 * useRealtimeSubscription
 *
 * Opens a WebSocket connection to the Chordially event server and delivers
 * live tip and session-update events to the component.
 *
 * - Reconnects automatically on unintentional close (up to MAX_RETRIES).
 * - Deduplicates events by a server-supplied `eventId` so stale re-deliveries
 *   are silently dropped.
 * - Exposes `connectionState` so the UI can show connected / reconnecting UI.
 */
export function useRealtimeSubscription({
  url,
  sessionId,
  userId,
}: UseRealtimeSubscriptionOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const MAX_RETRIES = 5;

  const connect = useCallback(() => {
    setConnectionState("connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
      setConnectionState("connected");

      // Send subscription intent so the server knows what events to push
      const sub: Record<string, unknown> = { type: "subscribe" };
      if (sessionId) sub.sessionId = sessionId;
      if (userId) sub.userId = userId;
      ws.send(JSON.stringify(sub));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as {
          eventId?: string;
          type: "tip" | "session_update";
          payload: Record<string, unknown>;
        };

        // Deduplicate stale/duplicate events
        if (msg.eventId) {
          if (seenIdsRef.current.has(msg.eventId)) return;
          seenIdsRef.current.add(msg.eventId);
        }

        setEvents((prev) => [
          { type: msg.type, payload: msg.payload, receivedAt: Date.now() },
          ...prev,
        ]);
      } catch {
        // Malformed frame — ignore
      }
    };

    ws.onclose = (e) => {
      setConnectionState("disconnected");
      // Reconnect unless closed intentionally (code 1000) or max retries hit
      if (e.code !== 1000 && retriesRef.current < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** retriesRef.current, 16_000);
        retriesRef.current += 1;
        setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [url, sessionId, userId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close(1000, "unmount");
    };
  }, [connect]);

  return { connectionState, events };
}
