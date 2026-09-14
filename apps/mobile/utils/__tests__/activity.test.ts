import { format } from "date-fns";

import {
  ACTIVITY_RANGE_PRESETS,
  activityRangeLabel,
  effectEmoji,
  formatActivityTimestamp,
  resolveActivityRange,
} from "../activity";

describe("effectEmoji", () => {
  it("maps known tags onto emojis", () => {
    expect(effectEmoji("ledger")).toBe("🧾");
    expect(effectEmoji("members")).toBe("👥");
  });

  it("falls back to a generic emoji for unknown tags", () => {
    expect(effectEmoji("mystery")).toBe("📝");
  });
});

describe("formatActivityTimestamp", () => {
  const now = new Date("2026-08-24T18:30:00.000Z");

  it("shows only the time for today", () => {
    expect(formatActivityTimestamp("2026-08-24T14:05:00.000Z", now)).toMatch(
      /^\d{1,2}:\d{2} [AP]M$/,
    );
  });

  it("prefixes yesterday entries with 'Yesterday'", () => {
    const label = formatActivityTimestamp("2026-08-23T14:05:00.000Z", now);
    expect(label).toContain("Yesterday");
  });

  it("includes the month and day for older entries in the same year", () => {
    const label = formatActivityTimestamp("2026-03-20T09:00:00.000Z", now);
    expect(label).toContain("Mar 20");
    expect(label).not.toContain("2026");
  });

  it("includes the year for entries from another year", () => {
    const label = formatActivityTimestamp("2024-03-20T09:00:00.000Z", now);
    expect(label).toContain("2024");
  });
});

describe("resolveActivityRange", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");

  it("yields no bounds for the all-time preset", () => {
    expect(resolveActivityRange("all", now)).toEqual({});
  });

  it("yields inclusive day bounds ending today for day-based presets", () => {
    const range = resolveActivityRange("7d", now);
    expect(range.fromDate).toBe(format(new Date("2026-08-17T12:00:00.000Z"), "yyyy-MM-dd"));
    expect(range.toDate).toBe("2026-08-24");
  });

  it("covers every preset key", () => {
    for (const preset of ACTIVITY_RANGE_PRESETS) {
      expect(activityRangeLabel(preset.key)).toBe(preset.label);
    }
  });
});

describe("activityRangeLabel", () => {
  it("falls back to All Time for unknown keys", () => {
    expect(activityRangeLabel("nonsense")).toBe("All Time");
  });
});
