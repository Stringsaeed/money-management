import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

import type { AccountPickerProps } from "./types";

export default function AccountPicker({
  accounts,
  selectedId,
  onChange,
  children,
}: AccountPickerProps) {
  const [open, setOpen] = useState(false);
  const selectableAccounts = accounts.filter((account) => account.lifecycle !== "archived");

  const onOpen = () => {
    setOpen(true);
  };

  const renderTrigger = () => {
    if (children) {
      const child = React.Children.only(children);
      // SAFETY: Picker pattern expects a single pressable child element
      return React.cloneElement(child as React.ReactElement<PressableProps>, {
        onPress: onOpen,
      });
    }
    return null;
  };

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={open} onDismiss={() => setOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Account</Text>

          <View style={styles.optionsContainer}>
            {selectableAccounts.map((acc) => {
              const isSelected = acc.id === selectedId;
              return (
                <Pressable
                  key={acc.id}
                  onPress={() => {
                    onChange(acc.id);
                    setOpen(false);
                  }}
                  style={[
                    styles.optionRow,
                    isSelected ? styles.optionRowSelected : styles.optionRowDefault,
                  ]}
                >
                  <Text style={styles.emoji}>🏦</Text>
                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.accountName,
                        isSelected ? styles.textSelected : styles.textDefault,
                      ]}
                    >
                      {acc.name}
                    </Text>
                    <Text
                      style={[
                        styles.accountCurrency,
                        isSelected ? styles.subtextSelected : styles.subtextDefault,
                      ]}
                    >
                      {acc.currency}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Icon as={CheckIcon} size={18} style={styles.checkIcon} weight="bold" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ModalBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    gap: spacing[4],
  },
  sheetTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  optionsContainer: {
    gap: spacing[2],
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    borderRadius: radii.xl,
  },
  optionRowSelected: {
    backgroundColor: colors.ink,
  },
  optionRowDefault: {
    backgroundColor: colors.surfaceContainer,
  },
  emoji: {
    fontSize: typography.textLg,
  },
  textContainer: {
    flex: 1,
  },
  accountName: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 15,
  },
  accountCurrency: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
  textSelected: {
    color: colors.surface,
  },
  textDefault: {
    color: colors.ink,
  },
  subtextSelected: {
    color: colors.surface,
    opacity: 0.6,
  },
  subtextDefault: {
    color: colors.ink,
    opacity: 0.4,
  },
  checkIcon: {
    color: colors.surface,
  },
  bottomSpacer: {
    height: spacing[4],
  },
});
