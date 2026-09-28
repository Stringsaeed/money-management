import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { AccountType } from "@/data/ledger-client";
import { spacing } from "@/ui/design-tokens";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";

import { OptionTile } from "../editor/option-tile";
import { BreadcrumbSegment } from "../transactions/breadcrumb-segment";
import { ACCOUNT_TYPE_OPTIONS, accountTypeOption } from "./account-display";

interface AccountTypePickerProps {
  readonly type: AccountType;
  readonly onChange: (type: AccountType) => void;
}

export function AccountTypePicker({ type, onChange }: AccountTypePickerProps) {
  const [open, setOpen] = useState(false);
  const current = accountTypeOption(type);

  return (
    <>
      <BreadcrumbSegment
        accessibilityLabel={`Account type: ${current.label}`}
        emoji={current.emoji}
        label={current.label}
        onPress={() => setOpen(true)}
      />
      <Sheet open={open} onDismiss={() => setOpen(false)}>
        <Text variant="title">🗂️ Account type</Text>
        <View style={styles.grid}>
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <OptionTile
              key={option.type}
              emoji={option.emoji}
              label={option.label}
              selected={option.type === type}
              onPress={() => {
                onChange(option.type);
                setOpen(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
});
