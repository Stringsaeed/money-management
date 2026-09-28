import type { V2Category } from "@trove/api/v2/contracts";

import type { CategoryInput } from "@/data/ledger-client";
import { useLedgerMutationsWithSound } from "@/features/sound";

import { useEditorSubmit } from "../editor/use-editor-submit";

export function useCategoryEditorActions(category: V2Category | undefined, onDone?: () => void) {
  const mutations = useLedgerMutationsWithSound();
  const { busy, error, run } = useEditorSubmit(onDone);

  const save = (input: CategoryInput) =>
    run(
      () =>
        category
          ? mutations.updateCategory(category.id, input, category.version)
          : mutations.createCategory(input),
      "Couldn't save this category. Check your connection and try again.",
    );

  return { busy, error, save };
}
