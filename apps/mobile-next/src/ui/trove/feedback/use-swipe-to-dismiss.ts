import { useEffect, useRef, useState } from "react";
import { PanResponder } from "react-native";

import { shouldDismissOnSwipe } from "./utils";

/** Distance a released toast travels while leaving the screen. */
const EXIT_DISTANCE = 160;

/**
 * Swipe-down-to-dismiss for a toast. `offset` follows the finger; on release the toast either
 * snaps back or `leaving` flips to true — the view animates out and then calls `onDismiss`
 * (via `finishLeaving`).
 */
export function useSwipeToDismiss(onDismiss: () => void) {
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  const [panResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_event, gesture) => setOffset(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_event, gesture) => {
        if (shouldDismissOnSwipe(gesture.dy, gesture.vy)) setLeaving(true);
        else setOffset(0);
      },
      onPanResponderTerminate: () => setOffset(0),
    }),
  );

  return {
    panHandlers: panResponder.panHandlers,
    dragging: offset > 0 && !leaving,
    leaving,
    translateY: leaving ? EXIT_DISTANCE : offset,
    finishLeaving: () => dismissRef.current(),
  };
}
