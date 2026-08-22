import { use } from "react";

import { AppUpdateContext } from "@/components/updates/app-update-context";

export function useAppUpdate() {
  const context = use(AppUpdateContext);

  if (!context) {
    throw new Error("useAppUpdate must be used inside AppUpdateProvider.");
  }

  return context;
}
