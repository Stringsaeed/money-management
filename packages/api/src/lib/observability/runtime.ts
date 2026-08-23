import { env } from "@trove/env/server";

import { createMetricsSink, type MetricsSink } from "./metrics";

/**
 * Per-request sink factory: Analytics Engine when the deployment binds the
 * `METRICS` dataset (Alchemy wires it in packages/infra), structured Workers
 * Logs JSON otherwise.
 */
export function requestMetrics(): MetricsSink {
  return createMetricsSink(env.METRICS);
}
