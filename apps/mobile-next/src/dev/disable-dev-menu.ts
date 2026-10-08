import { Platform, Settings } from "react-native";
import { requireOptionalNativeModule } from "expo";

export const DEV_MENU_PREFERENCES = {
  motionGestureEnabled: false,
  touchGestureEnabled: false,
  keyCommandsEnabled: false,
  showsAtLaunch: false,
  showFloatingActionButton: false,
} as const;

export const IOS_DEV_MENU_DEFAULTS = {
  EXDevMenuMotionGestureEnabled: false,
  EXDevMenuTouchGestureEnabled: false,
  EXDevMenuKeyCommandsEnabled: false,
  EXDevMenuShowsAtLaunch: false,
  EXDevMenuIsOnboardingFinished: true,
  EXDevMenuShowFloatingActionButton: false,
} as const;

const HIDE_DELAYS_MS = [0, 300, 800];

type DevMenuPreferencesModule = {
  setPreferencesAsync: (settings: typeof DEV_MENU_PREFERENCES) => Promise<void>;
};

type ExpoDevMenuModule = {
  hideMenu: () => void;
};

export type DevMenuPorts = {
  platform: "ios" | "android" | "web";
  setIosDefaults: (values: typeof IOS_DEV_MENU_DEFAULTS) => void;
  setPreferences: (values: typeof DEV_MENU_PREFERENCES) => Promise<void>;
  hideMenu: () => void;
  schedule: (callback: () => void, delayMs: number) => void;
};

export function lockDevMenu(ports: DevMenuPorts): void {
  if (ports.platform === "ios") ports.setIosDefaults(IOS_DEV_MENU_DEFAULTS);
  void ports.setPreferences(DEV_MENU_PREFERENCES).catch(() => undefined);
  const hide = () => {
    try {
      ports.hideMenu();
    } catch {
      // Release builds omit the dev menu module.
    }
  };
  hide();
  for (const delayMs of HIDE_DELAYS_MS) ports.schedule(hide, delayMs);
}

function optionalModule<T>(name: string): T | null {
  try {
    return requireOptionalNativeModule<T>(name);
  } catch {
    return null;
  }
}

export function disableDevMenu(): void {
  if (!__DEV__) return;
  const platform =
    Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web"
      ? Platform.OS
      : "web";
  lockDevMenu({
    platform,
    setIosDefaults: (values) => {
      Settings.set(values);
    },
    setPreferences: async (values) => {
      const preferences = optionalModule<DevMenuPreferencesModule>("DevMenuPreferences");
      await preferences?.setPreferencesAsync(values);
    },
    hideMenu: () => {
      optionalModule<ExpoDevMenuModule>("ExpoDevMenu")?.hideMenu();
    },
    schedule: (callback, delayMs) => {
      setTimeout(callback, delayMs);
    },
  });
}
