type QuickAddHandler = () => void;

const handlers = new Set<QuickAddHandler>();

/**
 * Lets the tab bar's Add open Quick add on Budget home (board: "Add opens Quick add").
 * Budget home listens while it can add spending; with no listener the caller falls back.
 */
export function listenForQuickAdd(handler: QuickAddHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/** Opens Quick add on the listening Budget home. False when nothing is listening. */
export function requestQuickAdd(): boolean {
  const latest = [...handlers].pop();
  if (!latest) return false;
  latest();
  return true;
}
