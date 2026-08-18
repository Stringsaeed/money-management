import { CreateResourceBottomSheet } from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";
import type { EnvelopeCategoryOption, EnvelopeSummary } from "@/modules/budgeting/budgeting";

import { EnvelopeFormContent } from "./envelope-form-content";
import { useEnvelopeForm } from "./form";

interface EnvelopeFormSheetProps {
  currency: string;
  envelope?: EnvelopeSummary;
  maximumSortOrder: number;
  onDismiss: VoidFunction;
  onSaved: VoidFunction;
  options: readonly EnvelopeCategoryOption[];
}

export function EnvelopeFormSheet({
  currency,
  envelope,
  maximumSortOrder,
  onDismiss,
  onSaved,
  options,
}: EnvelopeFormSheetProps) {
  const { error, form } = useEnvelopeForm({
    currency,
    envelope,
    maximumSortOrder,
    onSaved,
  });
  return (
    <CreateResourceBottomSheet
      autoPresent
      content={
        <EnvelopeFormContent
          currency={currency}
          envelopeId={envelope?.id}
          form={form}
          maximumSortOrder={maximumSortOrder}
          options={options}
        />
      }
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <CreateResourceSheetFooter
              error={error}
              isSubmitting={isSubmitting}
              onSubmit={() => form.handleSubmit()}
              submitLabel={envelope ? "Save Envelope" : "Create Envelope"}
              submittingLabel="Saving…"
            />
          )}
        </form.Subscribe>
      }
      onDismiss={onDismiss}
      title={envelope ? "Edit Envelope" : "New Envelope"}
    />
  );
}
