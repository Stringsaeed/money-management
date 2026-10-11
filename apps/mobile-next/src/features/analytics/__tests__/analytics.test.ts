import { createAnalytics, type AnalyticsClient } from "../analytics";

const fakeClient = () => {
  const captured: string[] = [];
  const client: AnalyticsClient = {
    capture: (event) => void captured.push(event),
    optIn: () => Promise.resolve(),
    optOut: () => Promise.resolve(),
  };
  return { client, captured };
};

describe("analytics", () => {
  it("is a silent no-op without a client", () => {
    const analytics = createAnalytics(null, true);
    expect(() => analytics.track("budget_home_viewed", {})).not.toThrow();
    expect(() => analytics.setSharing(false)).not.toThrow();
  });

  it("sends nothing while sharing is off and resumes when turned on", () => {
    const { client, captured } = fakeClient();
    const analytics = createAnalytics(client, false);
    analytics.track("money_moved", {});
    analytics.setSharing(true);
    analytics.track("bill_skipped", {});
    expect(captured).toEqual(["bill_skipped"]);
  });

  it("never throws when the client does", () => {
    const { client } = fakeClient();
    client.capture = () => {
      throw new Error("boom");
    };
    expect(() => createAnalytics(client, true).track("money_moved", {})).not.toThrow();
  });
});
