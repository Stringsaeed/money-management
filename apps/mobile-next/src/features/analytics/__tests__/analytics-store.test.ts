import * as SecureStore from "expo-secure-store";

import { getAnalyticsSharing, hydrateAnalyticsSharing } from "../analytics-store";

describe("analytics sharing default", () => {
  it("stays off until the saved choice is read, then follows it", async () => {
    expect(getAnalyticsSharing()).toBe(false);

    jest.spyOn(SecureStore, "getItemAsync").mockResolvedValueOnce(null);
    await hydrateAnalyticsSharing();
    expect(getAnalyticsSharing()).toBe(true);
  });

  it("keeps an opt-out", async () => {
    jest.spyOn(SecureStore, "getItemAsync").mockResolvedValueOnce("off");
    await hydrateAnalyticsSharing();
    expect(getAnalyticsSharing()).toBe(false);
  });
});
