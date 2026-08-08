import { useEffect, useRef, useState } from "react";
import * as Updates from "expo-updates";

import { AppUpdateContext } from "./app-update-context";
import { isMandatoryUpdateManifest } from "./mandatory-policy";
import type { AppUpdateContextValue, AppUpdateStatus } from "./types";

interface AppUpdateProviderProps {
  children: React.ReactNode;
}

type UpdateOperation = "check" | "install";

function getUpdateError(operation: UpdateOperation, error: unknown) {
  const nextAction =
    operation === "check"
      ? "Check your connection and try again."
      : "Keep the app open, check your connection, and try again.";

  if (error instanceof Error && error.message) {
    return `${nextAction} (${error.message})`;
  }

  return nextAction;
}

export function AppUpdateProvider({ children }: AppUpdateProviderProps) {
  const updates = Updates.useUpdates();
  const isSupported = Updates.isEnabled && process.env.EXPO_OS !== "web";
  const [status, setStatus] = useState<AppUpdateStatus>(isSupported ? "idle" : "disabled");
  const [isMandatory, setIsMandatory] = useState(false);
  const [error, setError] = useState<string>();
  const operationRef = useRef<Promise<void> | null>(null);
  const updatesRef = useRef(updates);
  const checkForUpdateRef = useRef<() => Promise<void>>(async () => undefined);

  updatesRef.current = updates;

  async function restart() {
    setStatus("restarting");
    setError(undefined);
    await Updates.reloadAsync();
  }

  async function installUpdateInternal() {
    try {
      if (updatesRef.current.isUpdatePending) {
        await restart();
        return;
      }

      setStatus("downloading");
      setError(undefined);
      const result = await Updates.fetchUpdateAsync();

      if (!result.isNew && !result.isRollBackToEmbedded) {
        throw new Error("The update could not be downloaded.");
      }

      await restart();
    } catch (caughtError) {
      setStatus("error");
      setError(getUpdateError("install", caughtError));
    }
  }

  async function checkForUpdateInternal() {
    if (!isSupported) {
      setStatus("disabled");
      return;
    }

    setStatus("checking");
    setError(undefined);

    try {
      const result = await Updates.checkForUpdateAsync();

      if (result.isAvailable) {
        const mandatory = isMandatoryUpdateManifest(result.manifest);
        setIsMandatory(mandatory);
        setStatus("available");

        if (mandatory) {
          await installUpdateInternal();
        }

        return;
      }

      if (result.isRollBackToEmbedded) {
        setIsMandatory(false);
        setStatus("available");
        return;
      }

      setIsMandatory(false);
      setStatus("current");
    } catch (caughtError) {
      setStatus("error");
      setError(getUpdateError("check", caughtError));
    }
  }

  function runExclusive(operation: () => Promise<void>) {
    if (operationRef.current) {
      return operationRef.current;
    }

    const promise = operation().finally(() => {
      operationRef.current = null;
    });
    operationRef.current = promise;

    return promise;
  }

  function checkForUpdate() {
    return runExclusive(checkForUpdateInternal);
  }

  function installUpdate() {
    return runExclusive(installUpdateInternal);
  }

  function retryMandatoryUpdate() {
    return runExclusive(installUpdateInternal);
  }

  checkForUpdateRef.current = checkForUpdate;

  useEffect(() => {
    void checkForUpdateRef.current();
  }, []);

  const value: AppUpdateContextValue = {
    status,
    isMandatory,
    progress: status === "downloading" ? updates.downloadProgress : undefined,
    error,
    checkForUpdate,
    installUpdate,
    retryMandatoryUpdate,
  };

  return <AppUpdateContext value={value}>{children}</AppUpdateContext>;
}
