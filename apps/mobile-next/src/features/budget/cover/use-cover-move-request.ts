import { useState } from "react";

export type CoverMoveRequest =
  /** O2: cover this envelope's overspend. The amount is read live from its Left. */
  | { readonly kind: "cover"; readonly targetId: string }
  /** O3: move money, starting from this envelope (or Not planned yet when `null`). */
  | { readonly kind: "move"; readonly fromId: string | null };

interface CoverMoveState {
  readonly open: boolean;
  /** Changes on every open so the form starts fresh each time. */
  readonly session: number;
  /** Kept after closing so the sheet can animate out with its content. */
  readonly request: CoverMoveRequest | null;
}

/** Which Cover or Move sheet is showing, for a screen that can open either. */
export function useCoverMoveRequest() {
  const [state, setState] = useState<CoverMoveState>({ open: false, session: 0, request: null });
  return {
    state,
    show: (request: CoverMoveRequest) =>
      setState((current) => ({ open: true, session: current.session + 1, request })),
    close: () => setState((current) => ({ ...current, open: false })),
  };
}
