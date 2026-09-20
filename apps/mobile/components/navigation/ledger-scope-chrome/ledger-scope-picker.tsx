import { CheckIcon } from "phosphor-react-native";
import { Children, cloneElement, isValidElement, useState } from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { colors } from "@/lib/design-tokens";

import { styles, darkStyles } from "./styles";
import type { LedgerScopePickerProps } from "./types";

export function LedgerScopePicker({ scope, children }: LedgerScopePickerProps) {
  const [open, setOpen] = useState(false);
  const isDark = useColorScheme() === "dark";

  const handleOpen = () => {
    if (!scope.canSwitch || !scope.setActiveHousehold) return;
    setOpen(true);
  };

  const handleSelect = async (householdId: string | null) => {
    if (!scope.setActiveHousehold) return;
    setOpen(false);
    await scope.setActiveHousehold(householdId);
  };

  const child = Children.only(children);
  if (!isValidElement(child)) return children;

  // SAFETY: isValidElement guard above ensures child is a valid React element.
  // We assert the onPress prop shape to inject our handler via cloneElement.
  const trigger = cloneElement(child as React.ReactElement<{ onPress?: () => void }>, {
    onPress: handleOpen,
  });

  return (
    <>
      {trigger}
      <ModalBottomSheet open={open} onDismiss={() => setOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetHeader}>📒 Select Ledger</Text>
          <Animated.View layout={LinearTransition}>
            <Pressable
              style={[
                styles.optionRow,
                scope.kind === "personal" && styles.optionRowActive,
                scope.kind === "personal" && isDark && darkStyles.optionRowActive,
              ]}
              onPress={() => handleSelect(null)}
            >
              <Text style={styles.optionEmoji}>👤</Text>
              <Text style={styles.optionText} numberOfLines={1}>
                Personal
              </Text>
              <CheckIcon
                size={18}
                color={String(colors.sage)}
                style={[styles.checkmark, scope.kind === "personal" && styles.checkmarkActive]}
              />
            </Pressable>
            {scope.availableHouseholds.map((hh) => {
              const isActive = scope.kind === "household" && scope.householdId === hh.householdId;
              return (
                <Animated.View
                  key={hh.householdId}
                  entering={FadeIn}
                  exiting={FadeOut}
                  layout={LinearTransition}
                >
                  <Pressable
                    style={[
                      styles.optionRow,
                      isActive && styles.optionRowActive,
                      isActive && isDark && darkStyles.optionRowActive,
                    ]}
                    onPress={() => handleSelect(hh.householdId)}
                  >
                    <Text style={styles.optionEmoji}>🏠</Text>
                    <Text style={styles.optionText} numberOfLines={1}>
                      {hh.name ?? "Household"}
                    </Text>
                    <CheckIcon
                      size={18}
                      color={String(colors.sage)}
                      style={[styles.checkmark, isActive && styles.checkmarkActive]}
                    />
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        </View>
      </ModalBottomSheet>
    </>
  );
}
