import React, { useRef } from "react";
import type { PressableProps } from "react-native";
import { Pressable, useColorScheme, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import type { AccountPickerProps } from "./types";

export default function AccountPicker({
  accounts,
  selectedId,
  onChange,
  children,
}: AccountPickerProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const sheetBg = { backgroundColor: colorScheme === "dark" ? "#141312" : "#F9F8F6" };
  const sheetHandle = { backgroundColor: colorScheme === "dark" ? "#282624" : "#EBE8E3" };

  const onOpen = () => {
    ref.current?.present();
  };

  const renderTrigger = () => {
    if (children) {
      const child = React.Children.only(children);
      return React.cloneElement(child as React.ReactElement<PressableProps>, {
        onPress: onOpen,
      });
    }
    return null;
  };

  return (
    <>
      {renderTrigger()}
      <BottomSheetModal
        enableDynamicSizing
        ref={ref}
        backgroundStyle={sheetBg}
        topInset={insets.top}
        handleIndicatorStyle={sheetHandle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
      >
        <BottomSheetView className="pb-safe px-5 gap-4">
          <Text className="font-heading-normal text-xl italic text-ink">Account</Text>

          <View className="gap-2">
            {accounts.map((acc) => {
              const isSelected = acc.id === selectedId;
              return (
                <Pressable
                  key={acc.id}
                  onPress={() => {
                    onChange(acc.id);
                    ref.current?.dismiss();
                  }}
                  className={`flex-row items-center gap-3 px-4 py-3.5 rounded-xl ${
                    isSelected ? "bg-ink" : "bg-surface-container"
                  }`}
                >
                  <Text className="text-lg">🏦</Text>
                  <View className="flex-1">
                    <Text
                      className={`font-body-medium text-[15px] ${isSelected ? "text-surface" : "text-ink"}`}
                    >
                      {acc.name}
                    </Text>
                    <Text
                      className={`font-body-normal text-xs ${isSelected ? "text-surface/60" : "text-ink/40"}`}
                    >
                      {acc.currency}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Icon as={CheckIcon} size={18} className="text-surface" weight="bold" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View className="h-4" />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
