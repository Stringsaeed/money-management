import { useState } from "react";

const errorMessage = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback;

/** Busy/error bookkeeping for an editor's save and delete, closing the editor on success. */
export function useEditorSubmit(onDone?: () => void) {
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const run = async <T>(action: () => Promise<T>, fallback: string) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      onDone?.();
    } catch (cause) {
      setError(errorMessage(cause, fallback));
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, run };
}
