import React from "react";
import { Pressable, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { SHEET_BG, SHEET_HANDLE } from "./constants";

interface AccountSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  accounts: { id: string; name: string; currency: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AccountSheet({ sheetRef, accounts, selectedId, onSelect }: AccountSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal
      enableDynamicSizing
      ref={sheetRef}
      backgroundStyle={SHEET_BG}
      topInset={insets.top}
      handleIndicatorStyle={SHEET_HANDLE}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
    >
      <BottomSheetView className="pb-safe px-5 gap-4">
        <Text className="font-heading-normal text-[20px] italic text-ink">Account</Text>

        <View className="gap-2">
          {accounts.map((acc) => {
            const isSelected = acc.id === selectedId;
            return (
              <Pressable
                key={acc.id}
                onPress={() => {
                  onSelect(acc.id);
                  sheetRef.current?.dismiss();
                }}
                className={`flex-row items-center gap-3 px-4 py-3.5 rounded-xl ${
                  isSelected ? "bg-ink" : "bg-surface-container"
                }`}
              >
                <Text className="text-[18px]">🏦</Text>
                <View className="flex-1">
                  <Text
                    className={`font-body-medium text-[15px] ${isSelected ? "text-surface" : "text-ink"}`}
                  >
                    {acc.name}
                  </Text>
                  <Text
                    className={`font-body-normal text-[12px] ${isSelected ? "text-surface/60" : "text-ink/40"}`}
                  >
                    {acc.currency}
                  </Text>
                </View>
                {isSelected ? <CheckIcon size={18} color="#F9F8F6" weight="bold" /> : null}
              </Pressable>
            );
          })}
        </View>

        <View className="h-4" />
      </BottomSheetView>
    </BottomSheetModal>
  );
}
