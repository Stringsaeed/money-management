import { intlFormat } from "date-fns";

import { parseDate } from "@/utils/date";
import { formatUpcomingOccurrence } from "@/utils/recurring";

describe("formatUpcomingOccurrence", () => {
  it("formats tomorrow and later dates from fixed calendar strings", () => {
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
