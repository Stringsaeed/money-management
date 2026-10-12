import { useEffect, useState } from "react";
import { usePanGesture } from "react-native-gesture-handler";
// oxlint-disable-next-line no-restricted-imports -- Ease animates to declared targets; it cannot track a UI-thread pan frame by frame or keep the clipped icon reveal in lockstep with the selector.
import { Easing, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { motion } from "../tokens";
import { DRAG_ACTIVATION, DRAG_FAIL_Y, DRAG_OVERSHOOT, PILL_PADDING, TAB_GAP } from "./constants";
import { nearestTab, rubberBand } from "./selector-math";
import { tabCrossHaptic } from "./tab-haptic";
import { indicatorOffset } from "./utils";

/** Tab switches and drag release: the bar's motion.sheet spring. */
const SNAP_SPRING = {
  damping: motion.sheet.damping,
  stiffness: motion.sheet.stiffness,
  mass: motion.sheet.mass,
};
/** Critically damped and stiff: the selector catches up to the finger without lag or wobble. */
const FOLLOW_SPRING = { damping: 60, stiffness: 900, mass: 1 };
/** Reduce Motion: slides become 120 ms linear moves and fades, as in `troveTransition`. */
const REDUCED = { duration: motion.duration.fast, easing: Easing.linear };
const FADE = { duration: motion.duration.fast };
/** `destination` while no tab is active and the selector is hidden. */
const HIDDEN = -1;

export interface TabSelectorOptions {
  /** -1 when no tab is active; the selector hides. */
  activeIndex: number;
  tabCount: number;
  tabWidth: number;
  reducedMotion: boolean;
  /** A drag was released over another tab. */
  onSelect: (index: number) => void;
}

/**
 * Drives the tab selector on the UI thread. It springs to the active tab and can be dragged
 * from anywhere on the pill: it follows the finger, rubber-bands past the ends, ticks a haptic
 * per tab crossed and, on release, snaps to the nearest tab and reports it once.
 */
export function useTabSelector({
  activeIndex,
  tabCount,
  tabWidth,
  reducedMotion,
  onSelect,
}: TabSelectorOptions) {
  const step = tabWidth + TAB_GAP;
  const maxOffset = step * Math.max(0, tabCount - 1);
  const offset = useSharedValue(indicatorOffset(activeIndex, tabWidth));
  const opacity = useSharedValue(activeIndex < 0 ? 0 : 1);
  /** Where the selector rests or is heading, so prop updates can tell a move from a no-op. */
  const destination = useSharedValue(
    activeIndex < 0 ? HIDDEN : indicatorOffset(activeIndex, tabWidth),
  );
  const dragging = useSharedValue(false);
  const hovered = useSharedValue(activeIndex);
  // Bumped on each release, so the selector settles on the parent's answer even when the
  // parent keeps the same tab (e.g. a prevented tabPress).
  const [releases, setReleases] = useState(0);

  useEffect(() => {
    if (dragging.get()) return;
    if (activeIndex < 0) {
      destination.set(HIDDEN);
      opacity.set(withTiming(0, FADE));
      return;
    }
    const target = indicatorOffset(activeIndex, tabWidth);
    const from = destination.get();
    destination.set(target);
    if (from === HIDDEN || (reducedMotion && from !== target)) {
      offset.set(target);
      opacity.set(0);
      opacity.set(withTiming(1, FADE));
      return;
    }
    if (!reducedMotion) offset.set(withSpring(target, SNAP_SPRING));
  }, [activeIndex, tabWidth, reducedMotion, releases, destination, dragging, offset, opacity]);

  const release = (index: number) => {
    setReleases((count) => count + 1);
    if (index !== activeIndex) onSelect(index);
  };

  const follow = (x: number) => {
    "worklet";
    const raw = x - tabWidth / 2;
    const target = rubberBand(raw, maxOffset, DRAG_OVERSHOOT);
    offset.set(reducedMotion ? target : withSpring(target, FOLLOW_SPRING));
    const index = nearestTab(raw, step, tabCount);
    if (index !== hovered.get()) {
      hovered.set(index);
      scheduleOnRN(tabCrossHaptic);
    }
  };

  const gesture = usePanGesture({
    enabled: tabCount > 1 && activeIndex >= 0,
    activeOffsetX: [-DRAG_ACTIVATION, DRAG_ACTIVATION],
    failOffsetY: [-DRAG_FAIL_Y, DRAG_FAIL_Y],
    // The pill's padding is part of the grab area.
    hitSlop: PILL_PADDING,
    onActivate: (event) => {
      "worklet";
      dragging.set(true);
      hovered.set(nearestTab(destination.get(), step, tabCount));
      follow(event.x);
    },
    onUpdate: (event) => {
      "worklet";
      follow(event.x);
    },
    onDeactivate: (event) => {
      "worklet";
      dragging.set(false);
      const index = event.canceled
        ? nearestTab(destination.get(), step, tabCount)
        : nearestTab(event.x - tabWidth / 2, step, tabCount);
      const target = index * step;
      destination.set(target);
      offset.set(
        reducedMotion
          ? withTiming(target, REDUCED)
          : withSpring(target, { ...SNAP_SPRING, velocity: event.velocityX }),
      );
      scheduleOnRN(release, event.canceled ? activeIndex : index);
    },
  });

  return { gesture, offset, opacity };
}
