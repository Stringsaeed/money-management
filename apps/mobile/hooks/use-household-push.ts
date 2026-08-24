import { useEffect, useRef } from "react";

import { HOUSEHOLD_CHANNEL_PREFIX } from "@trove/protocol";

import { authClient } from "@/lib/auth-client";

/** First reconnect delay — doubles per consecutive failure, capped below. */
const PUSH_RECONNECT_BASE_MS = 1_000;
const PUSH_RECONNECT_MAX_MS = 30_000;

/**
 * React Native accepts per-socket options (headers) beyond the DOM
 * `WebSocket` signature; the upgrade route needs the session cookie.
 */
type RNWebSocket = new (
  url: string,
  protocols?: string | undefined,
  options?: { headers?: Record<string, string> } | undefined,
) => WebSocket;

const pushSocketUrl = (householdId: string): string => {
  const base = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";
  return `${base.replace(/^http/, "ws")}/api/push/household/${householdId}`;
};

interface HouseholdPushNotice {
  channel: string;
  seq: number;
}

const isHouseholdNotice = (notice: unknown, householdId: string): notice is HouseholdPushNotice => {
  if (typeof notice !== "object" || notice === null) {
    return false;
  }
  const { channel, seq } = notice as Record<string, unknown>;
  return (
    channel === `${HOUSEHOLD_CHANNEL_PREFIX}${householdId}` &&
    typeof seq === "number" &&
    Number.isFinite(seq)
  );
};

/**
 * Best-effort realtime subscription (#93): one WebSocket to the household's
 * push channel; a well-formed `{channel, seq}` notice fires the callback so a
 * sync turn pulls immediately instead of waiting for the polling interval.
 *
 * Purely a latency optimization — connection failures, non-101 upgrades, and
 * malformed messages are swallowed and reconnects back off (1s → 30s cap,
 * reset on success). The 30s poller keeps running whether push is up, down,
 * or never deployed (#85 invariant).
 */
export function useHouseholdPush(householdId: string | null, onNotice: () => void) {
  const onNoticeRef = useRef(onNotice);
  onNoticeRef.current = onNotice;

  useEffect(() => {
    if (!householdId) {
      return;
    }
    const activeHouseholdId = householdId;

    let disposed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let backoffMs = PUSH_RECONNECT_BASE_MS;

    function scheduleReconnect(): void {
      if (disposed || reconnectTimer) {
        return;
      }
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, backoffMs);
      backoffMs = Math.min(backoffMs * 2, PUSH_RECONNECT_MAX_MS);
    }

    function connect(): void {
      if (disposed) {
        return;
      }
      let connection: WebSocket;
      try {
        const cookie = authClient.getCookie();
        // RN-only options argument carries the session cookie for the upgrade.
        connection = new (WebSocket as unknown as RNWebSocket)(
          pushSocketUrl(activeHouseholdId),
          undefined,
          cookie ? { headers: { cookie } } : undefined,
        );
        socket = connection;
      } catch {
        scheduleReconnect();
        return;
      }
      connection.onopen = () => {
        if (socket === connection) {
          backoffMs = PUSH_RECONNECT_BASE_MS;
        }
      };
      connection.onmessage = (event: WebSocketMessageEvent) => {
        try {
          const notice = JSON.parse(String(event.data)) as unknown;
          if (socket === connection && isHouseholdNotice(notice, activeHouseholdId)) {
            onNoticeRef.current();
          }
        } catch {
          // Malformed push message: ignore; polling stays authoritative.
        }
      };
      connection.onerror = () => {
        if (socket === connection) {
          scheduleReconnect();
        }
      };
      connection.onclose = () => {
        if (socket !== connection) {
          return;
        }
        socket = null;
        scheduleReconnect();
      };
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      }
    };
  }, [householdId]);
}
