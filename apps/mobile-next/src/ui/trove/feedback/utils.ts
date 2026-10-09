import type { SingleTransition } from "react-native-ease";

import { motion } from "../tokens";

export const TOAST_VISIBLE_MS = 4000;
export const TOAST_VISIBLE_WITH_ACTION_MS = 6000;

/** Toasts with an action stay longer so there is time to reach "Undo". */
export function toastDuration(hasAction: boolean): number {
  return hasAction ? TOAST_VISIBLE_WITH_ACTION_MS : TOAST_VISIBLE_MS;
}

/** Dragged farther than this (pt) or flicked faster than the velocity (pt/ms) → dismiss. */
const SWIPE_DISTANCE = 40;
const SWIPE_VELOCITY = 0.6;

export function shouldDismissOnSwipe(dy: number, vy: number): boolean {
  return dy > SWIPE_DISTANCE || (dy > 0 && vy > SWIPE_VELOCITY);
}

/** Skeleton pulse: 1 → 0.5 and back, 600 ms each way = 1.2 s per loop. */
export const SHIMMER_LOW_OPACITY = 0.5;
export const SHIMMER_TRANSITION = {
  type: "timing",
  duration: 600,
  easing: motion.easing.standard,
  loop: "reverse",
} as const satisfies SingleTransition;
