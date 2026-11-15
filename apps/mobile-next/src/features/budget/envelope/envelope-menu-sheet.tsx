import { Sheet } from "@/ui/trove";

import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { EnvelopePanels } from "./envelope-panels";

interface EnvelopeMenuSheetProps {
  readonly open: boolean;
  /** Changes on every open so the sheet starts on the menu. */
  readonly session: number;
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly onDismiss: () => void;
}

/** The ••• sheet: one sheet whose content swaps between the menu and its panels. */
export function EnvelopeMenuSheet({
  open,
  session,
  view,
  line,
  onDismiss,
}: EnvelopeMenuSheetProps) {
  return (
    <Sheet surface="canvas" open={open} onDismiss={onDismiss} snapPoints={["full"]}>
      <EnvelopePanels key={session} view={view} line={line} onClose={onDismiss} />
    </Sheet>
  );
}
