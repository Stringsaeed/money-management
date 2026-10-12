import { router } from "expo-router";

import { useAccountsQuery, useCategoriesQuery, useLedgerData } from "@/data/ledger-queries";
import { Sheet } from "@/ui/trove";

import { afterSheetCloses } from "../../ledger/transactions/transaction-create-actions";
import type { ActiveBudgetView } from "../home/home-model";
import { PAYDAY_ROUTES } from "../payday/payday-flow";

import { QuickAddForm } from "./quick-add-form";
import type { SavedSpend } from "./use-save-spend";
import { useQuickAddMemory } from "./use-quick-add-memory";

interface QuickAddSheetProps {
  readonly open: boolean;
  /** Changes on every open so the form starts empty each time. */
  readonly session: number;
  readonly view: ActiveBudgetView;
  /** Pre-selected envelope, e.g. from a long-press on its row. */
  readonly preselectedEnvelopeId: string | null;
  readonly onDismiss: () => void;
  /** "Save & cover it" saved the spending and the envelope is over: open the Cover flow. */
  readonly onCover?: (saved: SavedSpend) => void;
}

/** M2: log spending against an envelope from the Budget tab. */
export function QuickAddSheet({
  open,
  session,
  view,
  preselectedEnvelopeId,
  onDismiss,
  onCover,
}: QuickAddSheetProps) {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const { scope } = useLedgerData();
  const { memory, remember } = useQuickAddMemory();
  /** Closes the sheet first: a route pushed under a presented native sheet stays hidden behind it. */
  const leaveThen = (navigate: () => void) => {
    onDismiss();
    afterSheetCloses(navigate);
  };

  return (
    <Sheet open={open} onDismiss={onDismiss} snapPoints={["full"]}>
      <QuickAddForm
        key={session}
        view={view}
        accounts={accounts.data}
        categories={categories.data}
        memory={memory}
        remember={remember}
        preselectedEnvelopeId={preselectedEnvelopeId}
        stamp={scope.kind === "household" ? "🏠 Household budget" : "👤 Personal budget"}
        onSaved={(saved) => {
          onDismiss();
          if (saved.cover) onCover?.(saved);
        }}
        onAddCard={() => leaveThen(() => router.push("/accounts/new"))}
        onClose={onDismiss}
        onGotPaid={() => leaveThen(() => router.push(PAYDAY_ROUTES.gotPaid))}
      />
    </Sheet>
  );
}
