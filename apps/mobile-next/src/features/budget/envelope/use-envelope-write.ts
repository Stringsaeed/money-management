import { useState } from "react";

import { writeErrorMessage } from "./envelope-model";

/** Runs one envelope write: tracks busy, keeps the failure copy, and says whether it went through. */
export function useEnvelopeWrite(errorMessage: (cause: unknown) => string = writeErrorMessage) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const run = async <T>(write: () => Promise<T>): Promise<boolean> => {
    if (busy) return false;
    setError(undefined);
    setBusy(true);
    try {
      await write();
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, clearError: () => setError(undefined), run };
}
