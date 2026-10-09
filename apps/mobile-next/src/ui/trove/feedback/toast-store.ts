import type { IconName } from "../icon";
import { toastDuration } from "./utils";

export interface ToastOptions {
  message: string;
  /** Leading icon; defaults to a check mark. */
  icon?: IconName;
  /** Optional trailing action such as "Undo". Both fields are needed. */
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
  hideTimer = setTimeout(hideToast, toastDuration(Boolean(options.actionLabel)));
}
