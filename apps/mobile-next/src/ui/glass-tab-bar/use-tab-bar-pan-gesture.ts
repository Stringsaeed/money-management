import { useEffect } from "react";
import { usePanGesture } from "react-native-gesture-handler";
// oxlint-disable-next-line no-restricted-imports -- UI-thread pan gesture needs Reanimated worklets; Ease has no equivalent API.
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { PILL_PADDING } from "./constants";

interface UseTabBarPanGestureParams {
  focusedIndex: number;
  tabCount: number;
  tabWidth?: number;
  onSelect: (index: number) => void;
}

export const useTabBarPanGesture = ({
  focusedIndex,
  tabCount,
  tabWidth = 50,
  onSelect,
}: UseTabBarPanGestureParams) => {
  const maxOffset = Math.max(0, (tabCount - 1) * tabWidth);

  const offset = useSharedValue(focusedIndex * tabWidth);
  const isDragging = useSharedValue(false);
  const didActivate = useSharedValue(false);

  const offsetFromTouch = (x: number) => {
    "worklet";
    const next = x - PILL_PADDING - tabWidth / 2;
    return Math.min(Math.max(next, 0), maxOffset);
  };

  useEffect(() => {
    if (isDragging.value) return;

    offset.value = withTiming(focusedIndex * tabWidth, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [focusedIndex, offset, isDragging, tabWidth]);

  const panGesture = usePanGesture({
    activeOffsetX: [-8, 8],
    onBegin: (event) => {
      didActivate.value = false;
      isDragging.value = true;
      offset.value = offsetFromTouch(event.x);
    },
    onActivate: (event) => {
      didActivate.value = true;
      isDragging.value = true;
      offset.value = offsetFromTouch(event.x);
    },
    onUpdate: (event) => {
      offset.value = offsetFromTouch(event.x);
    },
    onDeactivate: () => {
      const index = Math.min(Math.max(Math.round(offset.value / tabWidth), 0), tabCount - 1);
      offset.value = withTiming(index * tabWidth, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      scheduleOnRN(onSelect, index);
    },
    onFinalize: () => {
      if (!didActivate.value) {
        const index = Math.min(Math.max(Math.round(offset.value / tabWidth), 0), tabCount - 1);
        offset.value = withTiming(index * tabWidth, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        });
      }
      isDragging.value = false;
    },
  });

  const capsuleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return { panGesture, capsuleStyle };
};
