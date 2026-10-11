import { useSyncExternalStore } from "react";

import { getAnalyticsSharing, subscribeAnalyticsSharing } from "./analytics-store";

export const useAnalyticsSharing = () =>
  useSyncExternalStore(subscribeAnalyticsSharing, getAnalyticsSharing);
