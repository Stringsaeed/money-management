import { useSyncExternalStore } from "react";

import { getSoundPreferences, subscribeSoundPreferences } from "./sound-store";

export const useSoundPreferences = () =>
  useSyncExternalStore(subscribeSoundPreferences, getSoundPreferences);
