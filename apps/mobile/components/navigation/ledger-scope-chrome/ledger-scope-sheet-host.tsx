import { CheckIcon } from "phosphor-react-native";
import { Pressable, Text, useColorScheme, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { colors } from "@/lib/design-tokens";
import { useLedgerScope } from "@/modules/access";

import { closeLedgerScopeSheet, useLedgerScopeSheetOpen } from "./ledger-scope-sheet-store";
import { darkStyles, styles } from "./styles";

/**
 * Renders the ledger-scope picker sheet inside BottomSheetProvider.
 * Native-stack headers sit outside provider context, so the sheet must not
 * mount from headerLeft (Portal would throw).
 */
export function LedgerScopeSheetHost() {
  const open = useLedgerScopeSheetOpen();
  const scope = useLedgerScope();
  const isDark = useColorScheme() === "dark";

  const handleSelect = async (householdId: string | null) => {
    if (!scope.setActiveHousehold) return;
    closeLedgerScopeSheet();
    await scope.setActiveHousehold(householdId);
  };

  return (
    <ModalBottomSheet open={open} onDismiss={closeLedgerScopeSheet}>
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
  );
}
