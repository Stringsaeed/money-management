import { useState } from "react";

import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { CategoriesPanel } from "./categories-panel";
import { GroupPanel } from "./group-panel";
import { HistoryPanel } from "./history-panel";
import { MenuPanel, type EnvelopePanel } from "./menu-panel";
import { PlanPanel } from "./plan-panel";

interface EnvelopePanelsProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly onClose: () => void;
}

/** The ••• sheet's content: the menu, or the panel it opened. */
export function EnvelopePanels({ view, line, onClose }: EnvelopePanelsProps) {
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
