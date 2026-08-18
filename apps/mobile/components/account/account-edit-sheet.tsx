import { useState } from "react";

import { AccountFormContent } from "@/components/account/account-form-content";
import { AccountLifecycleActions } from "@/components/account/account-lifecycle-actions";
import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { CreateResourceBottomSheet } from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";
import type { AccountType, AccountWithBalance } from "@/types";

import { useEditAccountForm } from "./form";
import { isCustomAccountIcon } from "./utils";

interface AccountEditSheetProps {
  account: AccountWithBalance;
  onDismiss: VoidFunction;
  onUpdated: VoidFunction;
}

export function AccountEditSheet({ account, onDismiss, onUpdated }: AccountEditSheetProps) {
  const [error, setError] = useState("");
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [hasCustomIcon, setHasCustomIcon] = useState(isCustomAccountIcon(account.icon));
  const form = useEditAccountForm({
    account,
    onError: setError,
    onUpdated,
  });

  function handleTypeChange(nextType: AccountType) {
    form.setFieldValue("type", nextType);
    if (!hasCustomColor) form.setFieldValue("color", ACCOUNT_TYPE_META[nextType].color);
    if (!hasCustomIcon) form.setFieldValue("icon", ACCOUNT_TYPE_META[nextType].emoji);
  }

  function handleColorChange(nextColor: string) {
    setHasCustomColor(true);
    form.setFieldValue("color", nextColor);
  }

  function handleIconChange(nextIcon: string) {
    setHasCustomIcon(true);
    form.setFieldValue("icon", nextIcon);
  }

  return (
    <CreateResourceBottomSheet
      autoPresent
      content={
        <>
          <AccountFormContent
            amountEditable={false}
            currencyExpanded={false}
            form={form}
            lockedBalanceCents={account.balance}
            onColorChange={handleColorChange}
            onCurrencyCollapse={() => undefined}
            onCurrencyExpandToggle={() => undefined}
            onIconChange={handleIconChange}
            onTypeChange={handleTypeChange}
          />
          <AccountLifecycleActions account={account} onCompleted={onUpdated} />
        </>
      }
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <CreateResourceSheetFooter
              error={error}
              isSubmitting={isSubmitting}
              onSubmit={() => {
                setError("");
                form.handleSubmit();
              }}
              submitLabel="Save Changes"
              submittingLabel="Saving…"
            />
          )}
        </form.Subscribe>
      }
      onDismiss={onDismiss}
      title="Edit Account"
    />
  );
}
