import { formOptions, useForm } from "@tanstack/react-form";
import { useState } from "react";

import { useCreateBudgetEnvelope, useUpdateBudgetEnvelope } from "@/hooks/use-budget-workspaces";
import type { EnvelopeCategoryOption, EnvelopeSummary } from "@/modules/budgeting/budgeting";
import { nowIso, today } from "@/utils/date";
import { generateId } from "@/utils/id";

export interface EnvelopeFormValues {
  name: string;
  icon: string;
  color: string;
  categoryIds: string[];
  confirmedRestoredCategoryIds: string[];
  positiveRollover: boolean;
  sortOrder: number;
}

interface UseEnvelopeFormArgs {
  currency: string;
  envelope?: EnvelopeSummary;
  maximumSortOrder: number;
  onSaved: VoidFunction;
  options: readonly EnvelopeCategoryOption[];
}

const envelopeFormOptions = formOptions({
  defaultValues: {
    name: "",
    icon: "💰",
    color: "#8B9D83",
    categoryIds: [],
    confirmedRestoredCategoryIds: [],
    positiveRollover: true,
    sortOrder: 0,
  } as EnvelopeFormValues,
});

export function useEnvelopeForm({
  currency,
  envelope,
  maximumSortOrder,
  onSaved,
  options,
}: UseEnvelopeFormArgs) {
  const createEnvelope = useCreateBudgetEnvelope();
  const updateEnvelope = useUpdateBudgetEnvelope();
  const [error, setError] = useState("");
  const editableCategoryIds = new Set(options.map((option) => option.id));
  const form = useForm({
    ...envelopeFormOptions,
    defaultValues: envelope
      ? {
          name: envelope.name,
          icon: envelope.icon,
          color: envelope.color,
          categoryIds: [
            ...new Set([
              ...envelope.categoryIds.filter((categoryId) => editableCategoryIds.has(categoryId)),
              ...options
                .filter((option) => option.futureMappedEnvelopeId === envelope.id)
                .map((option) => option.id),
            ]),
          ],
          confirmedRestoredCategoryIds: [],
          positiveRollover: envelope.positiveRollover,
          sortOrder: envelope.sortOrder,
        }
      : { ...envelopeFormOptions.defaultValues, sortOrder: maximumSortOrder },
    onSubmit: async ({ value }) => {
      setError("");
      const instant = nowIso();
      const common = {
        name: value.name.trim(),
        icon: value.icon,
        color: value.color,
        categoryIds: value.categoryIds,
        confirmedRestoredCategoryIds: value.confirmedRestoredCategoryIds,
        positiveRollover: value.positiveRollover,
        sortOrder: value.sortOrder,
        localDate: today(),
        now: instant,
      };
      try {
        if (envelope) {
          await updateEnvelope.mutateAsync({ ...common, envelopeId: envelope.id });
        } else {
          await createEnvelope.mutateAsync({ ...common, id: generateId(), currency });
        }
        onSaved();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : `The Envelope could not be saved: ${String(cause)}`,
        );
      }
    },
  });

  return { error, form };
}

export type UseEnvelopeFormReturn = ReturnType<typeof useEnvelopeForm>["form"];
