import { ApiError } from "@/data/http";

import { gotPaidErrorMessage, gotPaidTiming } from "../got-paid-model";

describe("gotPaidTiming", () => {
  it("is early before the period starts", () => {
    expect(gotPaidTiming("2026-10-24", "2026-10-25")).toBe("early");
  });

  it("is on time in the first three days", () => {
    expect(gotPaidTiming("2026-10-25", "2026-10-25")).toBe("on_time");
    expect(gotPaidTiming("2026-10-27", "2026-10-25")).toBe("on_time");
  });

  it("is late after that", () => {
    expect(gotPaidTiming("2026-10-28", "2026-10-25")).toBe("late");
  });
});

describe("gotPaidErrorMessage", () => {
  it("says a viewer can't change the household budget instead of asking to try again", () => {
    const refused = new ApiError(403, "Forbidden", "household_write_required", null);
    expect(gotPaidErrorMessage(refused)).toBe(
      "You can view this household budget, but not change it.",
    );
  });

  it("keeps the offline and generic copy for other failures", () => {
    expect(gotPaidErrorMessage(new ApiError(0, "offline", "network_error", null))).toBe(
      "You're offline. Nothing was recorded.",
    );
    expect(gotPaidErrorMessage(new Error("boom"))).toBe(
      "Couldn't log your salary. Nothing was recorded, so try again.",
    );
  });
});
