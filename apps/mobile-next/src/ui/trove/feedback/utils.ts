import type { SingleTransition } from "react-native-ease";

import { motion } from "../tokens";

export const TOAST_VISIBLE_MS = 4000;
export const TOAST_VISIBLE_WITH_ACTION_MS = 6000;

export interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastActionSource {
  action?: ToastAction;
  actionLabel?: string;
  onAction?: () => void;
}

/** Accepts the board's `action={ {label, onPress} }` or the legacy `actionLabel` + `onAction`. */
export function resolveToastAction(source: ToastActionSource): ToastAction | undefined {
  if (source.action) return source.action;
  if (source.actionLabel && source.onAction) {
    return { label: source.actionLabel, onPress: source.onAction };
  }
  return undefined;
}

export interface MessageSegment {
  text: string;
  bold: boolean;
}

/**
 * Splits a message so the first occurrence of `emphasis` can be set bold:
 * ("Filed under Groceries", "Groceries") -> ["Filed under ", "Groceries"(bold)].
 * An absent or unmatched fragment leaves the message whole.
 */
export function splitEmphasis(message: string, emphasis?: string): MessageSegment[] {
  const at = emphasis ? message.indexOf(emphasis) : -1;
  if (!emphasis || at < 0) return [{ text: message, bold: false }];
  const end = at + emphasis.length;
  return [
    { text: message.slice(0, at), bold: false },
    { text: emphasis, bold: true },
    { text: message.slice(end), bold: false },
  ].filter((segment) => segment.text !== "");
}

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
