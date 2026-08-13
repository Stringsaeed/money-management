import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import { Text } from "@/components/ui/text";
import type { AccountPickerProps } from "./types";

export default function AccountPicker({
  accounts,
  selectedId,
  onChange,
  children,
}: AccountPickerProps) {
  const [sheetIndex, setSheetIndex] = useState(0);

  const onOpen = () => {
    setSheetIndex(1);
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
      <ModalBottomSheet
        index={sheetIndex}
        onIndexChange={setSheetIndex}
        scrimColor="rgba(0, 0, 0, 0.5)"
        surface={<View className="absolute inset-0 rounded-t-3xl bg-background" />}
      >
        <View className="pb-safe px-5 pt-5 gap-4">
          <Text className="font-heading-normal text-xl italic text-ink">Account</Text>

          <View className="gap-2">
            {accounts.map((acc) => {
              const isSelected = acc.id === selectedId;
              return (
                <Pressable
                  key={acc.id}
                  onPress={() => {
                    onChange(acc.id);
                    setSheetIndex(0);
                  }}
                  className={cn(
                    "flex-row items-center gap-3 px-4 py-3.5 rounded-xl",
                    isSelected ? "bg-ink" : "bg-surface-container",
                  )}
                >
                  <Text className="text-lg">🏦</Text>
                  <View className="flex-1">
                    <Text
                      className={cn(
                        "font-body-medium text-[15px]",
                        isSelected ? "text-surface" : "text-ink",
                      )}
                    >
                      {acc.name}
                    </Text>
                    <Text
                      className={cn(
                        "font-body-normal text-xs",
                        isSelected ? "text-surface/60" : "text-ink/40",
                      )}
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
        </View>
      </ModalBottomSheet>
    </>
  );
}
