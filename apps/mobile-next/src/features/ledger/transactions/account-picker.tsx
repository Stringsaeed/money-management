import { useState } from "react";
import { Pressable, StyleSheet, Text as NativeText, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { Icon } from "@/ui/icon";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";

import { BreadcrumbSegment } from "./breadcrumb-segment";
import { afterSheetCloses } from "./transaction-create-actions";

interface AccountPickerProps {
  readonly title: string;
  readonly placeholder: string;
  readonly emoji: string;
  readonly accounts: readonly V2Account[];
  readonly selectedId: string | null;
  readonly onChange: (id: string) => void;
  readonly emptyMessage: string;
  readonly onCreateAccount?: () => void;
}

export function AccountPicker({
  title,
  placeholder,
  emoji,
  accounts,
  selectedId,
  onChange,
  emptyMessage,
  onCreateAccount,
}: AccountPickerProps) {
  const [open, setOpen] = useState(false);
  const createAccount = onCreateAccount
    ? () => {
        setOpen(false);
        afterSheetCloses(onCreateAccount);
      }
    : undefined;
  const selected = accounts.find((item) => item.id === selectedId);

  return (
    <>
      <BreadcrumbSegment
        accessibilityLabel={`${title}: ${selected?.name ?? "not selected"}`}
        emoji={emoji}
        label={selected?.name ?? placeholder}
        active={Boolean(selected)}
        onPress={() => setOpen(true)}
      />
      <Sheet open={open} onDismiss={() => setOpen(false)}>
        <Text variant="title">
          {emoji} {title}
        </Text>
        {accounts.length === 0 ? (
          <EmptyState
            icon={<NativeText style={styles.emptyEmoji}>🏦</NativeText>}
            title="No accounts to pick"
            message={emptyMessage}
            action={createAccount ? { label: "Add account", onPress: createAccount } : undefined}
          />
        ) : null}
        <View style={styles.options}>
          {accounts.map((account) => {
            const isSelected = account.id === selectedId;
            return (
              <Pressable
                key={account.id}
                accessibilityRole="button"
                accessibilityLabel={account.name}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onChange(account.id);
                  setOpen(false);
                }}
                style={[styles.row, isSelected && styles.rowSelected]}
              >
                <NativeText style={styles.emoji}>🏦</NativeText>
                <View style={styles.text}>
                  <Text style={[styles.name, isSelected && styles.selectedText]}>
                    {account.name}
                  </Text>
                  <Text variant="caption" style={isSelected && styles.selectedSubtext}>
                    {account.currency}
                  </Text>
                </View>
                {isSelected ? (
                  <Icon name="check" size={18} weight="bold" color={colors.primaryForeground} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing[2] },
  emptyEmoji: { fontSize: typography.text2xl },
  row: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.xl,
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  rowSelected: { backgroundColor: colors.primary },
  emoji: { fontSize: typography.textLg },
  text: { flex: 1 },
  name: { fontFamily: typography.fontBodySemibold, fontSize: typography.textLg },
  selectedText: { color: colors.primaryForeground },
  selectedSubtext: { color: colors.primaryForeground, opacity: 0.7 },
});
