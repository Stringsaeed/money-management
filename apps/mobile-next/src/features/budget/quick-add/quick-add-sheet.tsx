import { router } from "expo-router";

import { useAccountsQuery, useCategoriesQuery } from "@/data/ledger-queries";
import { Sheet } from "@/ui/trove";

import { afterSheetCloses } from "../../ledger/transactions/transaction-create-actions";
import type { ActiveBudgetView } from "../home/home-model";

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
  const { memory, remember } = useQuickAddMemory();

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
        onSaved={(saved) => {
          onDismiss();
          if (saved.cover) onCover?.(saved);
        }}
        onAddCard={() => {
          onDismiss();
          afterSheetCloses(() => router.push("/accounts/new"));
        }}
      />
    </Sheet>
  );
}
