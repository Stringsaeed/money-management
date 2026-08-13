import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";

import type { UseAccountFormReturn } from "./form";

interface AccountFormSheetFooterProps {
  error?: string;
  form: UseAccountFormReturn;
  onSubmit: VoidFunction;
}

export function AccountFormSheetFooter({ error, form, onSubmit }: AccountFormSheetFooterProps) {
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <CreateResourceSheetFooter
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          submitLabel="Create Account"
        />
      )}
    </form.Subscribe>
  );
}
