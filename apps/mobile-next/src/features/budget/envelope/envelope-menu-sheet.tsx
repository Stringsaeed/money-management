import { useState } from "react";

import { Sheet } from "@/ui/sheet";

import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { CategoriesPanel } from "./categories-panel";
import { GroupPanel } from "./group-panel";
import { HistoryPanel } from "./history-panel";
import { MenuPanel, type EnvelopePanel } from "./menu-panel";
import { PlanPanel } from "./plan-panel";

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
    <Sheet open={open} onDismiss={onDismiss} snapPoints={["full"]}>
      <Panels key={session} view={view} line={line} onClose={onDismiss} />
    </Sheet>
  );
}

interface PanelsProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly onClose: () => void;
}

function Panels({ view, line, onClose }: PanelsProps) {
  const [panel, setPanel] = useState<EnvelopePanel>("menu");
  const back = () => setPanel("menu");
  switch (panel) {
    case "plan":
      return <PlanPanel view={view} line={line} onBack={back} onDone={onClose} />;
    case "group":
      return <GroupPanel line={line} onBack={back} onDone={onClose} />;
    case "categories":
      return <CategoriesPanel view={view} line={line} onBack={back} onDone={onClose} />;
    case "history":
      return <HistoryPanel view={view} line={line} onBack={back} />;
    default:
      return <MenuPanel line={line} onOpen={setPanel} onClose={onClose} />;
  }
}
