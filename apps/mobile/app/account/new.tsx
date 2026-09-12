import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { AccountFormContent } from "@/components/account/account-form-content";
import { AccountFormSheetFooter } from "@/components/account/account-form-sheet-footer";
import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { useAccountForm } from "@/components/account/form";
import type { AccountType } from "@/types";

export default function NewAccountScreen() {
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [hasCustomIcon, setHasCustomIcon] = useState(false);

  const form = useAccountForm({ onCreated: () => router.back() });

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
    <KeyboardAvoidingView
      className="flex-1 bg-background safe-top safe-bottom"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="gap-4 px-5 py-4" keyboardShouldPersistTaps="handled">
        <AccountFormContent
          form={form}
          onColorChange={handleColorChange}
          onIconChange={handleIconChange}
          onTypeChange={handleTypeChange}
        />
      </ScrollView>
      <AccountFormSheetFooter form={form} onSubmit={() => form.handleSubmit()} />
    </KeyboardAvoidingView>
  );
}
