import type { CubicBezier, SingleTransition } from "react-native-ease";

const standard: CubicBezier = [0.2, 0, 0, 1];

const timing = (duration: number): SingleTransition => ({
  type: "timing",
  duration,
  easing: standard,
});

/**
 * Motion tokens. With Reduce Motion on, springs and slides become 120 ms crossfades —
 * pass transitions through `troveTransition(reducedMotion, …)`.
 */
export const motion = {
  duration: { fast: 120, base: 200, slow: 320 },
  easing: { standard },
  /** Press feedback, color changes. */
  fast: timing(120),
  /** Toggles, fades, tab switch. */
  base: timing(200),
  /** Screen-level transitions. */
  slow: timing(320),
  /** Bottom sheets, drag release. */
  sheet: { type: "spring", damping: 22, stiffness: 260, mass: 1 } satisfies SingleTransition,
  pressScale: 0.98,
  /** A 24pt icon reaches the 44pt target with this hitSlop. */
  hitSlop: 10,
} as const;

const REDUCED: SingleTransition = { type: "timing", duration: 120, easing: "linear" };

/** Swaps any transition for the reduced-motion crossfade when the user asks for less motion. */
export function troveTransition(
  reducedMotion: boolean,
  transition: SingleTransition,
): SingleTransition {
  return reducedMotion ? REDUCED : transition;
}
