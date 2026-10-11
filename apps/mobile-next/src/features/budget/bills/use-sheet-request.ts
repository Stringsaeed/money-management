import { useState } from "react";

interface SheetRequestState<T> {
  readonly open: boolean;
  /** Changes on every open so the sheet's form starts fresh each time. */
  readonly session: number;
  /** Kept after closing so the sheet can animate out with its content. */
  readonly value: T | null;
}

/** Open/close state for one sheet, plus what it was opened for. */
export function useSheetRequest<T>() {
  const [state, setState] = useState<SheetRequestState<T>>({
    open: false,
    session: 0,
    value: null,
  });
  return {
    ...state,
    show: (value: T) =>
      setState((current) => ({ open: true, session: current.session + 1, value })),
    close: () => setState((current) => ({ ...current, open: false })),
  };
}
