import React, { useState } from "react";
import type { PressableProps } from "react-native";

import { AccountFormContent } from "@/components/account/account-form-content";
import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { CreateResourceBottomSheet } from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";
import type { AccountType } from "@/types";

import { useAccountForm } from "./form";

interface AccountFormBottomSheetProps {
  autoPresent?: boolean;
  children?: React.ReactElement<PressableProps>;
  onCreated?: VoidFunction;
}

export function AccountFormBottomSheet({
  autoPresent = false,
  children,
  onCreated,
}: AccountFormBottomSheetProps) {
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [currencyExpanded, setCurrencyExpanded] = useState(false);

  const form = useAccountForm({
    onCreated: () => {
      form.reset();
      setHasCustomColor(false);
      setCurrencyExpanded(false);
      onCreated?.();
    },
  });

  function handleTypeChange(nextType: AccountType) {
    form.setFieldValue("type", nextType);
    if (!hasCustomColor) form.setFieldValue("color", ACCOUNT_TYPE_META[nextType].color);
  }

  function handleColorChange(nextColor: string) {
    setHasCustomColor(true);
    form.setFieldValue("color", nextColor);
  }

  return (
    <CreateResourceBottomSheet
      autoPresent={autoPresent}
      content={
        <AccountFormContent
          currencyExpanded={currencyExpanded}
          form={form}
          onColorChange={handleColorChange}
          onCurrencyCollapse={() => setCurrencyExpanded(false)}
          onCurrencyExpandToggle={() => setCurrencyExpanded((expanded) => !expanded)}
          onTypeChange={handleTypeChange}
        />
      }
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <CreateResourceSheetFooter
              isSubmitting={isSubmitting}
              onSubmit={() => form.handleSubmit()}
              submitLabel="Create Account"
            />
          )}
        </form.Subscribe>
      }
      title="Add Account"
    >
      {children}
    </CreateResourceBottomSheet>
  );
}
