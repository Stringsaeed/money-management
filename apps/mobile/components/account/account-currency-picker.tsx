import { useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { recoverAccountCurrencyListScroll } from "@/components/account/account-currency-list-scroll";
import { AccountCurrencyOptionRow } from "@/components/account/account-currency-option-row";
import {
  filterAccountCurrencyOptions,
  listAccountCurrencyOptions,
  type AccountCurrencyOption,
  toAccountCurrencyOption,
} from "@/components/account/account-currency-utils";
import { Input } from "@/components/ui/input";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

interface AccountCurrencyPickerProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

const CURRENCY_OPTIONS = listAccountCurrencyOptions();

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
  const insets = useSafeAreaInsets();

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
        style={({ pressed }) => [
          styles.trigger,
          compact ? styles.triggerCompact : styles.triggerFull,
          pressed && styles.triggerPressed,
        ]}
        onPress={open}
        testID="account-currency-trigger"
      >
        {compact ? (
          <Text style={styles.compactCode}>{selected.code}</Text>
        ) : (
          <>
            {selected.symbol ? (
              <View style={styles.symbolBadge}>
                <Text style={styles.symbolText}>{selected.symbol}</Text>
              </View>
            ) : null}
            <View style={styles.labelContainer}>
              <Text style={styles.codeText}>{selected.code}</Text>
              <Text style={styles.nameText}>{selected.name}</Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </>
        )}
      </Pressable>

      <ModalBottomSheet open={isPresented} onDismiss={dismiss} testID="account-currency-sheet">
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Currency</Text>
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search by code or name"
            returnKeyType="search"
            testID="account-currency-search"
            value={query}
          />
          <FlatList
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{`No currencies match "${query.trim()}". 🔍`}</Text>
              </View>
            }
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom }]}
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
      </ModalBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
  },
  triggerCompact: {
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  triggerFull: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  triggerPressed: {
    backgroundColor: colors.surfaceDim,
  },
  compactCode: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  symbolBadge: {
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1.5],
  },
  symbolText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  labelContainer: {
    minWidth: 0,
    flex: 1,
  },
  codeText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  nameText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
  changeText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.4,
  },
  sheetContent: {
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    paddingTop: spacing[4],
  },
  sheetTitle: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  list: {
    height: 384,
    width: "100%",
  },
  listContent: {
    gap: spacing[2],
    paddingTop: spacing[3],
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[10],
  },
  emptyText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
    opacity: 0.5,
  },
});
