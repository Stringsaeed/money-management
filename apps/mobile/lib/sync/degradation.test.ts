import {
  DELTA_DEGRADATION_THRESHOLD_MS,
  createDeltaAvailabilityTracker,
  isDeltaPullDegraded,
  recordDeltaPullFailure,
  recordDeltaPullSuccess,
} from "@/lib/sync/degradation";

const T0 = 1_000_000;

describe("delta availability tracker", () => {
  it("is healthy before any failure", () => {
    const tracker = createDeltaAvailabilityTracker();
    expect(isDeltaPullDegraded(tracker, T0)).toBe(false);
  });

  it("does not degrade before the 10 minute threshold", () => {
    let tracker = createDeltaAvailabilityTracker();
    tracker = recordDeltaPullFailure(tracker, T0);
    expect(isDeltaPullDegraded(tracker, T0 + DELTA_DEGRADATION_THRESHOLD_MS - 1)).toBe(false);
  });

  it("degrades after delta pulls have been unavailable for 10+ minutes", () => {
    let tracker = createDeltaAvailabilityTracker();
    tracker = recordDeltaPullFailure(tracker, T0);
    expect(isDeltaPullDegraded(tracker, T0 + DELTA_DEGRADATION_THRESHOLD_MS)).toBe(true);
  });

  it("measures the window from the FIRST failure, not the last", () => {
    let tracker = createDeltaAvailabilityTracker();
    tracker = recordDeltaPullFailure(tracker, T0);
    tracker = recordDeltaPullFailure(tracker, T0 + 60_000);
    // Repeated failures do not extend the clock — still degraded at first+10m.
    expect(isDeltaPullDegraded(tracker, T0 + DELTA_DEGRADATION_THRESHOLD_MS)).toBe(true);
  });

  it("recovers immediately after a successful pull", () => {
    let tracker = createDeltaAvailabilityTracker();
    tracker = recordDeltaPullFailure(tracker, T0);
    tracker = recordDeltaPullSuccess(tracker, T0 + 1_000);
    expect(isDeltaPullDegraded(tracker, T0 + DELTA_DEGRADATION_THRESHOLD_MS + 1_000)).toBe(false);
  });
});
