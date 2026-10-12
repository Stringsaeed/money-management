import { Sheet } from "@/ui/trove";

import type { ActiveBudgetView } from "../home/home-model";

import { CoverForm } from "./cover-form";
import { MoveForm } from "./move-form";
import type { useCoverMoveRequest } from "./use-cover-move-request";

interface CoverMoveSheetProps {
  readonly controller: ReturnType<typeof useCoverMoveRequest>;
  readonly view: ActiveBudgetView;
  /** Called after a cover has been saved, before the sheet closes. */
  readonly onCovered?: (targetId: string) => void;
}

/** O2/B1/C1 Cover from… and O3 Move money, in one sheet that shows whichever was asked for. */
export function CoverMoveSheet({ controller, view, onCovered }: CoverMoveSheetProps) {
  const { state, close } = controller;
  const { request } = state;
  return (
    <Sheet open={state.open} onDismiss={close} snapPoints={["full"]}>
      {request?.kind === "cover" || request?.kind === "cover-past" ? (
        <CoverForm
          key={state.session}
          view={view}
          request={request}
          onCovered={onCovered}
          onDone={close}
        />
      ) : request?.kind === "move" ? (
        <MoveForm
          key={state.session}
          view={view}
          fromId={request.fromId}
          toId={request.toId}
          onDone={close}
        />
      ) : null}
    </Sheet>
  );
}
