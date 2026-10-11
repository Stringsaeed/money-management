import type { IconName } from "../icon";
import { resolveToastAction, toastDuration, type ToastAction } from "./utils";

export interface ToastOptions {
  message: string;
  /** Decorative emoji in a 40pt tile before the message; replaces the icon. */
  emoji?: string;
  /** Leading icon; defaults to a check mark. Ignored when `emoji` is set. */
  icon?: IconName;
  /** Fragment of `message` to set bold, e.g. "Groceries" in "Filed under Groceries". */
  emphasis?: string;
  /** Trailing action such as "Undo" or "Change". */
  action?: ToastAction;
  /** Legacy form of `action`: both fields are needed. */
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastEntry extends ToastOptions {
  readonly id: number;
}

let current: ToastEntry | null = null;
let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const commit = (next: ToastEntry | null) => {
  current = next;
  for (const listener of listeners) listener();
};

export const getToast = () => current;

export const subscribeToast = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function hideToast() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = undefined;
  commit(null);
}

/**
 * Shows one non-blocking message for 4 s (6 s with an action). A newer toast replaces the
 * current one. Mirrors the legacy `showToast` API.
 */
export function showToast(options: ToastOptions) {
  if (hideTimer) clearTimeout(hideTimer);
  commit({ ...options, id: nextId++ });
  hideTimer = setTimeout(hideToast, toastDuration(resolveToastAction(options) !== undefined));
}
