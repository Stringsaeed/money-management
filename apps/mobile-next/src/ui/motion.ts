import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

import type { SingleTransition } from "react-native-ease";

export const PRESS_TRANSITION: SingleTransition = {
  type: "timing",
  duration: 120,
  easing: "easeOut",
};

export const STATE_TRANSITION: SingleTransition = {
  type: "timing",
  duration: 180,
  easing: "easeOut",
};

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}

export function motionTransition(
  reducedMotion: boolean,
  transition: SingleTransition,
): SingleTransition {
  return reducedMotion ? { type: "none" } : transition;
}
