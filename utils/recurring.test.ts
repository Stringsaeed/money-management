import { intlFormat } from "date-fns";

import { parseDate } from "@/utils/date";
import { formatRecurrence, formatUpcomingOccurrence } from "@/utils/recurring";

describe("formatUpcomingOccurrence", () => {
  it("formats tomorrow and later dates", () => {
    expect(formatUpcomingOccurrence("2026-03-29", "2026-03-28")).toBe("Tomorrow");
    expect(formatUpcomingOccurrence("2026-04-05", "2026-03-28")).toBe(
      intlFormat(parseDate("2026-04-05"), {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    );
  });
});

describe("formatRecurrence", () => {
  it("labels presets and custom cadences", () => {
    expect(formatRecurrence({ frequency: "day", intervalCount: 1 })).toBe("Daily");
    expect(formatRecurrence({ frequency: "week", intervalCount: 1 })).toBe("Weekly");
    expect(formatRecurrence({ frequency: "month", intervalCount: 1 })).toBe("Monthly");
    expect(formatRecurrence({ frequency: "year", intervalCount: 1 })).toBe("Yearly");
    expect(formatRecurrence({ frequency: "week", intervalCount: 2 })).toBe("Every 2 weeks");
    expect(formatRecurrence({ frequency: "month", intervalCount: 3 })).toBe("Every 3 months");
  });
});
