export interface Toast {
  readonly id: number;
  readonly emoji: string;
  readonly message: string;
}

const VISIBLE_MS = 3200;

let current: Toast | null = null;
let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const commit = (next: Toast | null) => {
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
  commit(null);
}

/** Shows one short, non-blocking message; a newer toast replaces the current one. */
export function showToast(toast: Omit<Toast, "id">) {
  if (hideTimer) clearTimeout(hideTimer);
  commit({ ...toast, id: nextId++ });
  hideTimer = setTimeout(hideToast, VISIBLE_MS);
}
