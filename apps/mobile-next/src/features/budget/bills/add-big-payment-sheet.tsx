import { Sheet, showToast } from "@/ui/trove";

import type { ActiveBudgetView } from "../home/home-model";

import { AddBigPaymentForm } from "./add-big-payment-form";

interface AddBigPaymentSheetProps {
  readonly open: boolean;
  /** Changes on every open so the form starts empty each time. */
  readonly session: number;
  readonly view: ActiveBudgetView;
  readonly onDismiss: () => void;
  /** The envelope was created; the sheet closes itself afterwards. */
  readonly onAdded?: () => void;
}

/** B2 as a sheet, so it can open from Bills & big payments or anywhere that has the budget. */
export function AddBigPaymentSheet({
  open,
  session,
  view,
  onDismiss,
  onAdded,
}: AddBigPaymentSheetProps) {
  return (
    <Sheet open={open} onDismiss={onDismiss} snapPoints={["full"]}>
      <AddBigPaymentForm
        key={session}
        view={view}
        onAdded={(name) => {
          showToast({ message: `${name} added to your plan` });
          onAdded?.();
          onDismiss();
        }}
        onCancel={onDismiss}
      />
    </Sheet>
  );
}
