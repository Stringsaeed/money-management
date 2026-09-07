import type { CommandResult } from "@trove/protocol";

/**
 * Observability recorder (#99). A deliberately tiny seam: routers hand it a
 * finished outcome plus a clock, and every event flows to one sink.
 *
 * Sink choice — Cloudflare Workers Analytics Engine (`writeDataPoint`) when
 * the deployment binds the `METRICS` dataset, structured JSON on
 * `console.log` (Workers Logs) otherwise. Percentiles (p50/p95/p99) are NOT
 * computed in-process: Analytics Engine SQL aggregates raw latency samples at
 * query time, which is cheaper and keeps the Worker stateless.
 */

/** Minimal structural type so this module never imports cloudflare:workers. */
export interface AnalyticsEngineDatasetLike {
  writeDataPoint(dataPoint: {
    indexes?: ((ArrayBuffer | string) | null)[];
    doubles?: number[];
    blobs?: ((ArrayBuffer | string) | null)[];
  }): void;
}

export type MeasuredOperation = "commands.apply";

export type MetricEvent =
  /** A typed command rejection — kind + short reason; frequency = event count. */
  | { event: "command_rejection"; rejectionKind: string; reason: string }
  /** One raw latency sample per call; percentile queries run over these. */
  | {
      event: "latency_sample";
      operation: MeasuredOperation;
      durationMs: number;
      outcome: string;
    }
  /** An unexpected throw (not a typed rejection) with its reason. */
  | { event: "operation_failure"; operation: MeasuredOperation; reason: string }
  /** A mutation was refused because the remote kill switch is engaged. */
  | { event: "kill_switch_engaged" };

export interface MetricsSink {
  record(event: MetricEvent): void;
}

export function createBufferSink(): MetricsSink & { events: MetricEvent[] } {
  const events: MetricEvent[] = [];
  return {
    events,
    record(event) {
      events.push(event);
    },
  };
}

/**
 * Structured JSON on Workers Logs — always available, no binding required.
 * Kept single-line and flat so Workers Logs query filters stay trivial.
 */
export function createConsoleSink(log: (line: string) => void = console.log): MetricsSink {
  return {
    record(event) {
      log(JSON.stringify({ metric: true, ...event }));
    },
  };
}

/** A short, payload-free reason string for a typed rejection. */
export function rejectionReason(result: Exclude<CommandResult, { kind: "applied" }>): string {
  switch (result.kind) {
    case "stale_version":
      return `expected_version_${result.expectedVersion}_actual_${result.actualVersion}`;
    case "invalid_intent":
      return result.issues[0]?.field ?? "unknown_field";
    case "preview_required":
      return result.issues[0]?.field ?? "unknown_field";
    case "missing_entity":
      return `${result.entityType}:${result.entityId}`;
    case "forbidden":
      return result.requiredCapability;
    default:
      return result.reason;
  }
}

/** Analytics Engine when bound, console JSON otherwise. */
export function createMetricsSink(dataset: AnalyticsEngineDatasetLike | undefined): MetricsSink {
  if (!dataset || typeof dataset.writeDataPoint !== "function") {
    return createConsoleSink();
  }
  return {
    record(event) {
      // Fixed blob slots so AE SQL can GROUP BY positionally:
      //   blobs[0]=event name, blobs[1]=primary dimension, blobs[2]=detail.
      const dimensions =
        event.event === "latency_sample"
          ? [event.operation, event.outcome]
          : event.event === "command_rejection"
            ? [event.rejectionKind, event.reason]
            : event.event === "operation_failure"
              ? [event.operation, event.reason]
              : [];
      try {
        dataset.writeDataPoint({
          blobs: [event.event, ...dimensions],
          ...(event.event === "latency_sample" ? { doubles: [event.durationMs] } : {}),
        });
      } catch {
        // Observability must never take down the request path.
      }
    },
  };
}

/**
 * Times one `commands.apply` call: emits a raw latency sample tagged with the
 * outcome, a typed rejection event (kind + reason) for non-applied results,
 * and an operation_failure event if the pipeline throws. The error is always
 * rethrown — instrumentation never swallows outcomes.
 */
export async function instrumentCommandApply(
  sink: MetricsSink,
  run: () => Promise<CommandResult>,
  startedAt: () => number = Date.now,
  endedAt: () => number = Date.now,
): Promise<CommandResult> {
  const start = startedAt();
  try {
    const result = await run();
    sink.record({
      event: "latency_sample",
      operation: "commands.apply",
      durationMs: endedAt() - start,
      outcome: result.kind,
    });
    if (result.kind !== "applied") {
      sink.record({
        event: "command_rejection",
        rejectionKind: result.kind,
        reason: rejectionReason(result),
      });
    }
    return result;
  } catch (error) {
    sink.record({
      event: "operation_failure",
      operation: "commands.apply",
      reason: error instanceof Error ? error.message : String(error),
    });
    sink.record({
      event: "latency_sample",
      operation: "commands.apply",
      durationMs: endedAt() - start,
      outcome: "error",
    });
    throw error;
  }
}
