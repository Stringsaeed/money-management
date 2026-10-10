import { useEffect, useRef, useState } from "react";

/** How long delete is held before the entry clears. */
export const HOLD_TO_CLEAR_MS = 600;

interface HoldToClearOptions {
  /** Off when there is nothing to clear: presses behave as plain taps. */
  enabled: boolean;
  onClear: () => void;
}

/**
 * Press-and-hold timing for the delete key. `progress` runs 0 to 1 over HOLD_TO_CLEAR_MS while
 * the key is held, then `onClear` fires once. The release that follows a fired hold must not
 * also delete a digit, so `consumeFired` tells the key's own press handler to skip it.
 */
export function useHoldToClear({ enabled, onClear }: HoldToClearOptions) {
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);
  const fired = useRef(false);

  const cancel = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    timer.current = null;
    frame.current = null;
  };

  useEffect(() => cancel, []);

  const start = () => {
    fired.current = false;
    if (!enabled) return;
    const startedAt = Date.now();
    const tick = () => {
      setProgress(Math.min(1, (Date.now() - startedAt) / HOLD_TO_CLEAR_MS));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    timer.current = setTimeout(() => {
      cancel();
      fired.current = true;
      setProgress(0);
      onClear();
    }, HOLD_TO_CLEAR_MS);
  };

  const release = () => {
    cancel();
    setProgress(0);
  };

  /** True once, right after a hold cleared the entry; the caller then ignores the release tap. */
  const consumeFired = () => {
    const wasFired = fired.current;
    fired.current = false;
    return wasFired;
  };

  return { progress, start, release, consumeFired };
}
