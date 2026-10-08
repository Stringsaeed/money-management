import { DEV_MENU_PREFERENCES, IOS_DEV_MENU_DEFAULTS, lockDevMenu } from "../disable-dev-menu";

describe("lockDevMenu", () => {
  it("turns off the iOS menu gestures and closes the sheet", () => {
    const setIosDefaults = jest.fn();
    const setPreferences = jest.fn().mockResolvedValue(undefined);
    const hideMenu = jest.fn();
    const scheduled: (() => void)[] = [];

    lockDevMenu({
      platform: "ios",
      setIosDefaults,
      setPreferences,
      hideMenu,
      schedule: (callback) => {
        scheduled.push(callback);
      },
    });

    expect(setIosDefaults).toHaveBeenCalledWith(IOS_DEV_MENU_DEFAULTS);
    expect(setPreferences).toHaveBeenCalledWith(DEV_MENU_PREFERENCES);
    expect(hideMenu).toHaveBeenCalledTimes(1);
    expect(IOS_DEV_MENU_DEFAULTS.EXDevMenuIsOnboardingFinished).toBe(true);
    for (const callback of scheduled) callback();
    expect(hideMenu).toHaveBeenCalledTimes(1 + scheduled.length);
  });

  it("leaves iOS defaults alone on Android and still closes the sheet", () => {
    const setIosDefaults = jest.fn();
    const hideMenu = jest.fn();

    lockDevMenu({
      platform: "android",
      setIosDefaults,
      setPreferences: jest.fn().mockResolvedValue(undefined),
      hideMenu,
      schedule: () => undefined,
    });

    expect(setIosDefaults).not.toHaveBeenCalled();
    expect(hideMenu).toHaveBeenCalledTimes(1);
  });
});
