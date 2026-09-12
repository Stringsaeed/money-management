import { useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, Pressable, TextInput, View } from "react-native";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";

import { recoverAccountCurrencyListScroll } from "@/components/account/account-currency-list-scroll";
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

/**
 * Currency picker for account forms. Uses SM ModalBottomSheet (not @expo/ui
 * BottomSheet/Host). Device certs #258–#262 showed Create Account submit at
 * ~(201,802) hittable=true while coord taps still missed — residual Expo UI
 * Host overlays can eat UIKit hits. Keep zero Expo UI Hosts on /account/new.
 */
export function AccountCurrencyPicker({
  value,
  onChange,
  compact = false,
}: AccountCurrencyPickerProps) {
  const [isPresented, setIsPresented] = useState(false);
  const [query, setQuery] = useState("");
  const listRef = useRef<FlatList<AccountCurrencyOption>>(null);
  const selected = toAccountCurrencyOption(value);
  const results = filterAccountCurrencyOptions(CURRENCY_OPTIONS, query);

  const open = () => {
    setQuery("");
    setIsPresented(true);
  };

  const dismiss = () => {
    Keyboard.dismiss();
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

      {isPresented ? (
        <ModalBottomSheet
          index={1}
          onIndexChange={(nextIndex) => {
            if (nextIndex <= 0) dismiss();
          }}
          scrimColor="rgba(0, 0, 0, 0.5)"
          surface={<View className="absolute inset-0 rounded-t-3xl bg-background" />}
        >
          <View className="gap-3 pb-safe px-5 pt-5" testID="account-currency-sheet">
            <View className="flex-row items-center justify-between">
              <Text className="font-heading-normal text-xl italic text-ink">Currency</Text>
              <Pressable
                accessibilityLabel="Dismiss sheet"
                accessibilityRole="button"
                className="rounded-lg px-2 py-1 active:bg-surface-dim"
                onPress={dismiss}
              >
                <Text className="font-body-medium text-sm text-ink/50">Close</Text>
              </Pressable>
            </View>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-xl border border-ledger-outline bg-surface-container px-4 py-3 font-body-normal text-base text-ink"
              onChangeText={setQuery}
              placeholder="Search by code or name"
              placeholderTextColor="#9a9896"
              returnKeyType="search"
              testID="account-currency-search"
              value={query}
            />
            <View className="h-96">
              <FlatList
                ListEmptyComponent={
                  <View className="items-center px-4 py-10">
                    <Text className="font-body-medium text-base text-ink/50">
                      {`No currencies match "${query.trim()}". 🔍`}
                    </Text>
                  </View>
                }
                contentContainerClassName="gap-2 pb-4 pt-1"
                data={results}
                initialNumToRender={CURRENCY_OPTIONS.length}
                keyExtractor={(item) => item.code}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                onScrollToIndexFailed={(info) =>
                  recoverAccountCurrencyListScroll(listRef.current, info)
                }
                ref={listRef}
                renderItem={({ item }) => (
                  <AccountCurrencyOptionRow
                    item={item}
                    onSelect={select}
                    selected={item.code === value}
                  />
                )}
              />
            </View>
          </View>
        </ModalBottomSheet>
      ) : null}
    </>
  );
}
