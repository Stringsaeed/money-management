import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { ScrollView, View } from "react-native";

import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { AccountFormContent } from "@/components/account/account-form-content";
import type { AccountType } from "@/types";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";
import { Text } from "../ui/text";
import { AccountFormSheetFooter } from "./account-form-sheet-footer";
import { useAccountForm } from "./form";

interface AccountFormBottomSheetProps {
  autoPresent?: boolean;
  children?: React.ReactElement<PressableProps>;
  onCreated?: VoidFunction;
}

export function AccountFormBottomSheet({
  autoPresent = false,
  children,
}: AccountFormBottomSheetProps) {
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [currencyExpanded, setCurrencyExpanded] = useState(false);
  const [index, setIndex] = useState(autoPresent ? 1 : 0);

  const form = useAccountForm();

  function handleTypeChange(nextType: AccountType) {
    form.setFieldValue("type", nextType);

    if (!hasCustomColor) {
      form.setFieldValue("color", ACCOUNT_TYPE_META[nextType].color);
    }
  }

  function handleColorChange(nextColor: string) {
    setHasCustomColor(true);
    form.setFieldValue("color", nextColor);
  }

  function renderTrigger() {
    if (!children) {
      return null;
    }

    const child = React.Children.only(children);
    return React.cloneElement(child as React.ReactElement<PressableProps>, {
      onPress: (event) => {
        setIndex(1);
        child.props.onPress?.(event);
      },
    });
  }

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet scrimColor="rgba(0, 0, 0, 0.5)" index={index} onIndexChange={setIndex}>
        <View className="bg-background rounded-3xl mb-safe mx-4">
          <View className="w-full px-5 py-5">
            <Text className="font-heading-normal text-center text-xl italic text-ink">
              Add Account
            </Text>
          </View>
          <ScrollView contentContainerClassName="gap-4 px-5 py-4">
            <AccountFormContent
              currencyExpanded={currencyExpanded}
              form={form}
              onColorChange={handleColorChange}
              onCurrencyCollapse={() => setCurrencyExpanded(false)}
              onCurrencyExpandToggle={() => setCurrencyExpanded((expanded) => !expanded)}
              onTypeChange={handleTypeChange}
            />
          </ScrollView>
          <AccountFormSheetFooter form={form} onSubmit={() => form.handleSubmit()} />
        </View>
      </ModalBottomSheet>
    </>
  );
}
