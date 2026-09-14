import { getCurrencySymbol, getDateDisplayValue } from "@/components/transaction/utils";

describe("transaction utils", () => {
  it("maps supported currencies to symbols", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("AED")).toBe("AED");
  });

  it("formats relative date labels", () => {
    expect(getDateDisplayValue(new Date())).toBe("Today");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    expect(getDateDisplayValue(yesterday)).toBe("Yesterday");
  });

  it("triggers the error haptic on the active Expo platform", () => {
    const previousPlatform = process.env.EXPO_OS;
    let triggerErrorHaptic!: typeof import("@/components/transaction/utils").triggerErrorHaptic;
    let mockNotificationAsync!: jest.Mock;

    process.env.EXPO_OS = "ios";
    jest.resetModules();
    jest.isolateModules(() => {
      ({ triggerErrorHaptic } = require("@/components/transaction/utils"));
      mockNotificationAsync = jest.requireMock("expo-haptics").notificationAsync as jest.Mock;
    });
    mockNotificationAsync.mockClear();
    triggerErrorHaptic();
    expect(mockNotificationAsync).toHaveBeenCalledTimes(1);

    process.env.EXPO_OS = previousPlatform;
  });
});
