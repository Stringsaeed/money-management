import { BottomSheet, RNHostView, Text as ExpoText, TextInput, useNativeState } from "@expo/ui";
import { useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, Pressable, View } from "react-native";
import { useNativeVariable } from "react-native-css/native";

import { AccountCurrencyOptionRow } from "@/components/account/account-currency-option-row";
import {
  filterAccountCurrencyOptions,
  listAccountCurrencyOptions,
  type AccountCurrencyOption,
  toAccountCurrencyOption,
} from "@/components/account/account-currency-utils";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface AccountCurrencyPickerProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

const CURRENCY_OPTIONS = listAccountCurrencyOptions();
const ROW_HEIGHT = 56;

export function AccountCurrencyPicker({
  value,
  onChange,
  compact = false,
}: AccountCurrencyPickerProps) {
  const [isPresented, setIsPresented] = useState(false);
  const [query, setQuery] = useState("");
  const searchState = useNativeState("");
  const listRef = useRef<FlatList<AccountCurrencyOption>>(null);
  const bgSurface = useNativeVariable("--color-surface");
  const selected = toAccountCurrencyOption(value);
  const results = filterAccountCurrencyOptions(CURRENCY_OPTIONS, query);

  const open = () => {
    searchState.value = "";
    setQuery("");
    setIsPresented(true);
  };

  const dismiss = () => {
    Keyboard.dismiss();
    searchState.value = "";
    setQuery("");
    setIsPresented(false);
  };

  const select = (code: string) => {
    onChange(code);
    dismiss();
  };

  useEffect(() => {
    if (!isPresented || query.trim()) return;
    const index = CURRENCY_OPTIONS.findIndex((option) => option.code === value);
    if (index < 0) return;
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.2 });
    });
    return () => cancelAnimationFrame(frame);
  }, [isPresented, query, value]);

  return (
    <>
      <Pressable
        accessibilityLabel={`Selected currency ${selected.code}, ${selected.name}`}
        accessibilityRole="button"
        className={cn(
          "rounded-2xl border border-ledger-outline bg-surface active:bg-surface-dim",
          compact
            ? "min-w-[72px] items-center justify-center px-3 py-3"
            : "flex-row items-center gap-3 px-4 py-3.5",
        )}
        onPress={open}
        testID="account-currency-trigger"
      >
        {compact ? (
          <Text className="font-body-semibold text-base text-ink">{selected.code}</Text>
        ) : (
          <>
            {selected.symbol ? (
              <View className="min-w-12 items-center justify-center rounded-xl bg-surface-container px-2 py-1.5">
                <Text className="font-body-semibold text-sm text-ink">{selected.symbol}</Text>
              </View>
            ) : null}
            <View className="min-w-0 flex-1">
              <Text className="font-body-semibold text-base text-ink">{selected.code}</Text>
              <Text className="font-body-normal text-sm text-ink/50">{selected.name}</Text>
            </View>
            <Text className="font-body-medium text-sm text-ink/40">Change</Text>
          </>
        )}
      </Pressable>

      <BottomSheet
        containerColor={bgSurface}
        contentPadding={{ top: 16, bottom: 8, left: 16, right: 16 }}
        isPresented={isPresented}
        onDismiss={dismiss}
        snapPoints={["half", "full"]}
        testID="account-currency-sheet"
      >
        <ExpoText>Currency</ExpoText>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search by code or name"
          returnKeyType="search"
          testID="account-currency-search"
          value={searchState}
        />
        <RNHostView style={{ height: 360, width: "100%" }}>
          <FlatList
            ListEmptyComponent={
              <View className="items-center px-4 py-10">
                <Text className="font-body-medium text-base text-ink/50">
                  No currencies match "{query.trim()}". 🔍
                </Text>
              </View>
            }
            contentContainerClassName="pb-safe gap-2 pt-3"
            data={results}
            getItemLayout={(_data, index) => ({
              length: ROW_HEIGHT,
              offset: ROW_HEIGHT * index,
              index,
            })}
            keyExtractor={(item) => item.code}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScrollToIndexFailed={() => undefined}
            ref={listRef}
            renderItem={({ item }) => (
              <AccountCurrencyOptionRow
                item={item}
                onSelect={select}
                selected={item.code === value}
              />
            )}
          />
        </RNHostView>
      </BottomSheet>
    </>
  );
}
