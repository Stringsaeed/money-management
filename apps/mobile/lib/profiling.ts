/**
 * Performance profiling utilities for Envelopes and Transactions.
 *
 * On-device usage (QA steps):
 * 1. Enable Hermes profiler: Settings → Advanced → "Debug JS Remotely" OFF
 * 2. Use React DevTools Profiler with "Highlight updates" enabled
 * 3. On iOS: Instruments → Time Profiler, Core Animation, or Allocations
 * 4. On Android: systrace or Flipper Performance plugin
 *
 * These helpers log timing data for later analysis. They are intentionally
 * simple to avoid introducing measurement overhead bias.
 */

const PROFILING_ENABLED = __DEV__;

interface ProfileMetadata {
  count?: number;
  itemType?: string;
  source?: string;
}

interface ProfileEntry {
  label: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  metadata?: ProfileMetadata;
}

const entries: ProfileEntry[] = [];

/**
 * Measure synchronous execution time.
 */
export function profileSync<T>(label: string, fn: () => T, metadata?: ProfileMetadata): T {
  if (!PROFILING_ENABLED) return fn();
  const startMs = performance.now();
  try {
    return fn();
  } finally {
    const endMs = performance.now();
    const entry: ProfileEntry = {
      label,
      startMs,
      endMs,
      durationMs: endMs - startMs,
      metadata,
    };
    entries.push(entry);
    console.log(`[PERF] ${label}: ${entry.durationMs.toFixed(2)}ms`, metadata ?? "");
  }
}

/**
 * Measure async execution time.
 */
export async function profileAsync<T>(
  label: string,
  fn: () => Promise<T>,
  metadata?: ProfileMetadata,
): Promise<T> {
  if (!PROFILING_ENABLED) return fn();
  const startMs = performance.now();
  try {
    return await fn();
  } finally {
    const endMs = performance.now();
    const entry: ProfileEntry = {
      label,
      startMs,
      endMs,
      durationMs: endMs - startMs,
      metadata,
    };
    entries.push(entry);
    console.log(`[PERF] ${label}: ${entry.durationMs.toFixed(2)}ms`, metadata ?? "");
  }
}

/**
 * Mark a point in time for later reference.
 */
export function profileMark(label: string, metadata?: ProfileMetadata): void {
  if (!PROFILING_ENABLED) return;
  const now = performance.now();
  console.log(`[PERF MARK] ${label} @ ${now.toFixed(2)}ms`, metadata ?? "");
}

/**
 * Get all recorded profile entries.
 */
export function getProfileEntries(): readonly ProfileEntry[] {
  return entries;
}

/**
 * Clear recorded entries.
 */
export function clearProfileEntries(): void {
  entries.length = 0;
}

/**
 * Generate a summary report of profile entries.
 */
export function getProfileSummary(): string {
  if (entries.length === 0) return "No profile entries recorded.";

  const byLabel = new Map<string, number[]>();
  for (const entry of entries) {
    const durations = byLabel.get(entry.label) ?? [];
    durations.push(entry.durationMs);
    byLabel.set(entry.label, durations);
  }

  const lines: string[] = ["=== Profile Summary ==="];
  for (const [label, durations] of byLabel) {
    const count = durations.length;
    const total = durations.reduce((sum, d) => sum + d, 0);
    const avg = total / count;
    const max = Math.max(...durations);
    const min = Math.min(...durations);
    lines.push(
      `${label}: count=${count}, avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`,
    );
  }
  return lines.join("\n");
}
