import { useState } from "react";

export type CoverMoveRequest =
  /**
   * O2: top up this envelope in the current period. The amount is its overspend, read live from
   * its Left, unless `amountMinor` is given (B1: what a bill is short of its next payment).
   */
  | { readonly kind: "cover"; readonly targetId: string; readonly amountMinor?: number }
  /**
   * C1: last period's overspend already came out of Not planned yet; envelopes pay it back there.
   */
  | { readonly kind: "cover-past"; readonly targetId: string; readonly amountMinor: number }
  /**
   * O3: move money, starting from this envelope (or Not planned yet when `null`), optionally
   * into `toId` (an overspent envelope pulling money in).
   */
  | { readonly kind: "move"; readonly fromId: string | null; readonly toId?: string | null };

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
