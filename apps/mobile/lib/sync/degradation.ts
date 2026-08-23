/**
 * Delta-pull availability tracking (#99): the client degrades to local-only
 * mode after `sync.getDelta` has been unavailable for 10+ consecutive
 * minutes. The window is anchored at the FIRST failure of an outage streak —
 * repeated failures never extend it — and any successful pull clears it.
 */

/** How long delta pulls may fail before the app falls back to local-only. */
export const DELTA_DEGRADATION_THRESHOLD_MS = 10 * 60_000;

export interface DeltaAvailabilityTracker {
  /** Timestamp (ms) of the first failure in the current outage streak, if any. */
  readonly failingSince: number | null;
}

export function createDeltaAvailabilityTracker(): DeltaAvailabilityTracker {
  return { failingSince: null };
}

export function recordDeltaPullFailure(
  tracker: DeltaAvailabilityTracker,
  now: number,
): DeltaAvailabilityTracker {
  return tracker.failingSince === null ? { failingSince: now } : tracker;
}

export function recordDeltaPullSuccess(
  _tracker: DeltaAvailabilityTracker,
  _now: number,
): DeltaAvailabilityTracker {
  return createDeltaAvailabilityTracker();
}

export function isDeltaPullDegraded(tracker: DeltaAvailabilityTracker, now: number): boolean {
  return (
    tracker.failingSince !== null && now - tracker.failingSince >= DELTA_DEGRADATION_THRESHOLD_MS
  );
}
