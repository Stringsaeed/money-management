import { useState } from "react";
import { usePanGesture } from "react-native-gesture-handler";

/** Horizontal travel before a drag becomes a scrub, so vertical scrolling still wins. */
const ACTIVE_OFFSET_X = 4;
const FAIL_OFFSET_Y = 12;

/**
 * Drag-to-scrub for charts. `index` follows the finger and returns to null on release, so
 * the chart snaps back to its resting (current period) state. State-driven: the pan runs
 * on the JS thread, which keeps charts free of Reanimated.
 */
export function useScrub(indexFromX: (x: number) => number) {
  const [index, setIndex] = useState<number | null>(null);

  const gesture = usePanGesture({
    runOnJS: true,
    activeOffsetX: [-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X],
    failOffsetY: [-FAIL_OFFSET_Y, FAIL_OFFSET_Y],
    onActivate: (event) => setIndex(indexFromX(event.x)),
    onUpdate: (event) => setIndex(indexFromX(event.x)),
    onFinalize: () => setIndex(null),
  });

  return { index, gesture };
}
