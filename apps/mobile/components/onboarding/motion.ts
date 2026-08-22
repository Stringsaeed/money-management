import { FadeIn, FadeInDown, LinearTransition } from "react-native-reanimated";

/**
 * One motion vocabulary for the whole onboarding flow.
 *
 * Builders live at module scope on purpose — Reanimated re-creates layout
 * animations on every render otherwise, which costs a worklet build per frame.
 */

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
