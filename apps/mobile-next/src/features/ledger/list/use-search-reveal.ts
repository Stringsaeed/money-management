// oxlint-disable-next-line no-restricted-imports -- Hiding the search bar follows the list's scroll offset frame by frame on the UI thread; Ease only animates between declared states and cannot read scroll position.
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

/** Scroll this far down in one direction before the search bar tucks away. */
const HIDE_AFTER = 24;
/** A short pull back up is enough to bring it back. */
const REVEAL_AFTER = 8;
/** Near the top of the list the search bar is always shown. */
const ALWAYS_SHOWN_ABOVE = 16;
const DURATION = 220;

export interface SearchReveal {
  /** Fed by the list on the UI thread. */
  readonly scrollOffset: SharedValue<number>;
  /** 0 while the search bar is shown, 1 once hidden. */
  readonly hidden: SharedValue<number>;
}

/**
 * Safari-style reveal: scrolling down tucks the search bar away, and any small scroll back up
 * brings it back, wherever the list is.
 */
export function useSearchReveal(reducedMotion: boolean): SearchReveal {
  const scrollOffset = useSharedValue(0);
  const hidden = useSharedValue(0);
  const target = useSharedValue(0);
  const travel = useSharedValue(0);

  useAnimatedReaction(
    () => scrollOffset.value,
    (current, previous) => {
      if (previous === null) return;
      const settle = (next: number) => {
        if (target.value === next) return;
        target.value = next;
        hidden.value = reducedMotion ? next : withTiming(next, { duration: DURATION });
      };
      if (current <= ALWAYS_SHOWN_ABOVE) {
        travel.value = 0;
        settle(0);
        return;
      }
      const delta = current - previous;
      if (delta === 0) return;
      // Distance travelled in the current direction; a reversal starts counting afresh.
      travel.value = Math.sign(delta) === Math.sign(travel.value) ? travel.value + delta : delta;
      if (travel.value > HIDE_AFTER) settle(1);
      else if (travel.value < -REVEAL_AFTER) settle(0);
    },
    [reducedMotion],
  );

  return { scrollOffset, hidden };
}
