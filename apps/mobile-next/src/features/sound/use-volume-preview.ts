import { useEffect, useRef } from "react";

import { playCue } from "./sound-cues";

const PREVIEW_DELAY_MS = 180;

/** Plays one preview cue after the volume slider settles instead of on every drag tick. */
export function useVolumePreview() {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => playCue("preview"), PREVIEW_DELAY_MS);
  };
}
