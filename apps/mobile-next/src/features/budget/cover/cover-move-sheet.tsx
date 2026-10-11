import { Sheet } from "@/ui/trove";

import type { ActiveBudgetView } from "../home/home-model";

import { CoverForm } from "./cover-form";
import { MoveForm } from "./move-form";
import type { useCoverMoveRequest } from "./use-cover-move-request";

interface CoverMoveSheetProps {
  readonly controller: ReturnType<typeof useCoverMoveRequest>;
  readonly view: ActiveBudgetView;
}

/** O2 Cover from… and O3 Move money, in one sheet that shows whichever was asked for. */
export function CoverMoveSheet({ controller, view }: CoverMoveSheetProps) {
  const { state, close } = controller;
  const { request } = state;
  return (
    <Sheet open={state.open} onDismiss={close} snapPoints={["full"]}>
      {request?.kind === "cover" ? (
        <CoverForm key={state.session} view={view} targetId={request.targetId} onDone={close} />
      ) : request?.kind === "move" ? (
        <MoveForm key={state.session} view={view} fromId={request.fromId} onDone={close} />
      ) : null}
    </Sheet>
  );
}
