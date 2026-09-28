import { useSyncExternalStore } from "react";

import { getAiPreferences, subscribeAiPreferences } from "./ai-store";

export const useAiPreferences = () =>
  useSyncExternalStore(subscribeAiPreferences, getAiPreferences);
