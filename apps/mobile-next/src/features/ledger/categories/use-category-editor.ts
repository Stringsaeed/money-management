import { useState } from "react";

import type { V2Category } from "@trove/api/v2/contracts";

import type { CategoryInput } from "@/data/ledger-client";
import { playCue } from "@/features/sound";

import { errorHaptic, pickHaptic } from "../accounts/editor-haptics";
import {
  categoryDraftError,
  categoryInputFromDraft,
  initialCategoryDraft,
  type CategoryDraft,
} from "./category-draft";

interface UseCategoryEditorOptions {
  readonly category?: V2Category;
  readonly onSubmit: (input: CategoryInput) => Promise<void>;
}

export function useCategoryEditor({ category, onSubmit }: UseCategoryEditorOptions) {
  const [draft, setDraft] = useState(() => initialCategoryDraft(category));
  const [validationError, setValidationError] = useState<string>();

  const update = (patch: Partial<CategoryDraft>) => {
    setValidationError(undefined);
    setDraft((current) => ({ ...current, ...patch }));
  };

  /** Colour and emoji picks give a tactile tick. */
  const pick = (patch: Partial<CategoryDraft>) => {
    pickHaptic();
    playCue("key");
    update(patch);
  };

  const submit = async () => {
    const error = categoryDraftError(draft);
    if (error) {
      errorHaptic();
      playCue("error");
      setValidationError(error);
      return;
    }
    setValidationError(undefined);
    await onSubmit(categoryInputFromDraft(draft));
  };

  return {
    draft,
    validationError,
    setName: (name: string) => update({ name }),
    selectKind: (kind: CategoryInput["kind"]) => {
      if (kind === draft.kind) return;
      pickHaptic();
      playCue("toggle");
      update({ kind });
    },
    selectColor: (color: string) => pick({ color }),
    selectIcon: (icon: string) => pick({ icon }),
    submit,
  };
}
