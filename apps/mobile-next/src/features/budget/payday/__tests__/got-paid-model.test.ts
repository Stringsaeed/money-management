import { gotPaidTiming } from "../got-paid-model";

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
