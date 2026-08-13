import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";

import type { UseCategoryFormReturn } from "./form";

interface CategoryFormSheetFooterProps {
  error?: string;
  form: UseCategoryFormReturn;
  onSubmit: VoidFunction;
}

export function CategoryFormSheetFooter({ error, form, onSubmit }: CategoryFormSheetFooterProps) {
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <CreateResourceSheetFooter
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          submitLabel="Create Category"
        />
      )}
    </form.Subscribe>
  );
}
