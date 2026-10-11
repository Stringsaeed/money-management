import type { AnalyticsEventName, AnalyticsEvents } from "./events";

/** The slice of the PostHog client we rely on, so the no-op and opt-out rules stay testable. */
export interface AnalyticsClient {
  capture: (event: string, properties?: Record<string, string | number | boolean>) => void;
  optIn: () => Promise<void>;
  optOut: () => Promise<void>;
}

export interface Analytics {
  track: <E extends AnalyticsEventName>(event: E, props: AnalyticsEvents[E]) => void;
  setSharing: (enabled: boolean) => void;
}

/** With no client (no API key) every call is a silent no-op. Nothing here may throw into the app. */
export function createAnalytics(client: AnalyticsClient | null, sharing: boolean): Analytics {
  let enabled = sharing;
  const sync = () => {
    if (!client) return;
    (enabled ? client.optIn() : client.optOut()).catch(() => undefined);
  };
  sync();
  return {
    track: (event, props) => {
      if (!client || !enabled) return;
      try {
        client.capture(event, props);
      } catch {
        // Analytics is fire-and-forget.
      }
    },
    setSharing: (next) => {
      enabled = next;
      sync();
    },
  };
}
