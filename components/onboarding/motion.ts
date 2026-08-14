import { FadeIn, FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";

/**
 * One motion vocabulary for the whole onboarding flow.
 *
 * Builders live at module scope on purpose — Reanimated re-creates layout
 * animations on every render otherwise, which costs a worklet build per frame.
 */

/** Settles quickly with a hint of overshoot. For chrome that tracks progress. */
export const SNAPPY_SPRING = { damping: 18, mass: 0.9, stiffness: 160 } as const;

/** Slower and softer. For large surfaces that should feel weighty. */
export const SETTLED_SPRING = { damping: 20, mass: 1, stiffness: 90 } as const;

/** Content shifting inside a step (fields appearing, errors, expanding pickers). */
export const layoutTransition = LinearTransition.springify().damping(20).stiffness(160);

/** Base delay between staggered siblings, in ms. */
export const STAGGER_MS = 55;

/**
 * Content rises into place. Index-staggered so a step reads top-to-bottom
 * instead of arriving as one block.
 */
export function stepItemEntering(index: number) {
  return FadeInDown.springify()
    .damping(20)
    .stiffness(140)
    .delay(120 + index * STAGGER_MS);
}

/** Steps cross-fade rather than slide — the preview card carries continuity. */
export const stepEntering = FadeIn.duration(260);
export const stepExiting = FadeOut.duration(140);
