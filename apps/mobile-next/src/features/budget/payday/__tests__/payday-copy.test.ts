import {
  gotPaidDateLabel,
  gotPaidNote,
  paydayKicker,
  periodDays,
  periodStamp,
  planPeriodStamp,
  receiptDate,
} from "../payday-copy";

const period = { start: "2026-10-25", end: "2026-11-24" };

describe("paydayKicker", () => {
  it("stamps the payday the period starts on", () => {
    expect(paydayKicker("2026-10-25")).toBe("PAYDAY · SUN 25 OCT");
  });
});

describe("gotPaidDateLabel", () => {
  it("says today and yesterday with the day, and the weekday before that", () => {
    expect(gotPaidDateLabel("2026-10-25", "2026-10-25")).toBe("Today, 25 Oct");
    expect(gotPaidDateLabel("2026-10-24", "2026-10-25")).toBe("Yesterday, 24 Oct");
    expect(gotPaidDateLabel("2026-10-23", "2026-10-25")).toBe("Fri, 23 Oct");
  });
});

describe("gotPaidNote", () => {
  it("names the month and the step logging leads to", () => {
    expect(gotPaidNote(period, "wrapUp")).toBe(
      "This starts your new month: 25 Oct – 24 Nov. Next, a 2-minute wrap-up.",
    );
    expect(gotPaidNote(period, "plan")).toBe(
      "This starts your new month: 25 Oct – 24 Nov. Next, plan your month.",
    );
  });

  it("names only the month when logging lands back on Budget home", () => {
    expect(gotPaidNote(period, null)).toBe("This starts your new month: 25 Oct – 24 Nov.");
  });
});

describe("period stamps", () => {
  it("prints the range in caps, with its days on Plan new month", () => {
    expect(periodStamp({ start: "2026-09-25", end: "2026-10-24" })).toBe("25 SEP – 24 OCT");
    expect(periodDays(period)).toBe(31);
    expect(planPeriodStamp(period)).toBe("25 OCT – 24 NOV · 31 DAYS");
    expect(receiptDate("2026-10-25")).toBe("25 OCT");
  });
});
