import { useState } from "react";

import { useCoverMoveRequest } from "../cover/use-cover-move-request";

interface SheetState {
  readonly open: boolean;
  /** Changes on every open so the sheet starts fresh. */
  readonly session: number;
}

const CLOSED: SheetState = { open: false, session: 0 };

/** Wait for Quick add to finish closing before Cover from… presents over the same screen. */
const SHEET_HANDOFF_MS = 400;

const opened = (current: SheetState): SheetState => ({ open: true, session: current.session + 1 });
const closed = (current: SheetState): SheetState => ({ ...current, open: false });

/** The envelope screen's three sheets: the ••• menu, Quick add, and Cover / Move money. */
export function useEnvelopeSheets() {
  const [menu, setMenu] = useState(CLOSED);
  const [quickAdd, setQuickAdd] = useState(CLOSED);
  const coverMove = useCoverMoveRequest();
  return {
    menu,
    openMenu: () => setMenu(opened),
    closeMenu: () => setMenu(closed),
    quickAdd,
    openQuickAdd: () => setQuickAdd(opened),
    closeQuickAdd: () => setQuickAdd(closed),
    coverMove,
    /** "Save & cover it" in Quick add: open Cover from… once Quick add has gone. */
    coverAfterQuickAdd: (envelopeId: string) =>
      setTimeout(() => coverMove.show({ kind: "cover", targetId: envelopeId }), SHEET_HANDOFF_MS),
  };
}
