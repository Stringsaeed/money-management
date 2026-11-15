import { activityAgo } from "../activity-ago";

const now = new Date("2026-10-11T12:00:00.000Z");

describe("activityAgo", () => {
  it("prints minutes, hours, then days", () => {
    expect(activityAgo("2026-10-11T11:59:40.000Z", now)).toBe("just now");
    expect(activityAgo("2026-10-11T11:55:00.000Z", now)).toBe("5m ago");
    expect(activityAgo("2026-10-11T10:00:00.000Z", now)).toBe("2h ago");
    expect(activityAgo("2026-10-08T09:00:00.000Z", now)).toBe("3d ago");
  });

  it("reads an unparsable time as just now", () => {
    expect(activityAgo("not a date", now)).toBe("just now");
  });
});
