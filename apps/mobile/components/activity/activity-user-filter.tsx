import { Children, cloneElement, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";
import type { PressableProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { colors, radii, rawColorValues, spacing, typography } from "@/lib/design-tokens";

import type { ActivityUserOption } from "./types";

interface ActivityUserFilterProps {
  readonly members: readonly ActivityUserOption[];
  /** Selected user id, or null for "everyone". */
  readonly value: string | null;
  readonly onChange: (userId: string | null) => void;
  children?: ReactNode;
}

/**
 * Member dropdown for the activity timeline (#95). Follows the standard
 * picker pattern: self-contained sheet state, `children` as trigger, sheet
 * dismissed after selection.
 */
export function ActivityUserFilter({
  members,
  value,
  onChange,
  children,
}: ActivityUserFilterProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const inkHex = colorScheme === "dark" ? rawColorValues.dark.ink : rawColorValues.light.ink;

  const options: readonly (ActivityUserOption | null)[] = [null, ...members];

  const handleOpen = () => setOpen(true);

  const renderTrigger = () => {
    if (children) {
      const child = Children.only(children);
      // SAFETY: Picker pattern expects a single pressable child element
      return cloneElement(child as ReactElement<PressableProps>, { onPress: handleOpen });
    }
    return (
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [pressed && styles.triggerPressed]}
      >
        <View style={styles.triggerChip}>
          <Text style={styles.triggerEmoji}>👤</Text>
          <Text style={styles.triggerLabel}>
            {members.find((m) => m.userId === value)?.userName ?? "Everyone"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={open} onDismiss={() => setOpen(false)}>
        <View style={[styles.sheetBody, { paddingBottom: insets.bottom }]}>
          <Text style={styles.sheetTitle}>Filter by member</Text>
          {options.map((option, i) => {
            const selected = (option?.userId ?? null) === value;
            return (
              <View key={option?.userId ?? "all"}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={option?.userName ?? "Everyone"}
                  onPress={() => {
                    setOpen(false);
                    onChange(option?.userId ?? null);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={styles.optionLabel}>
                    {option ? `👤 ${option.userName}` : "🌍 Everyone"}
                  </Text>
                  {selected ? <Icon as={CheckIcon} size={18} style={{ color: inkHex }} /> : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </ModalBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  triggerPressed: {
    opacity: 0.7,
  },
  triggerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    backgroundColor: colors.surfaceContainer,
  },
  triggerEmoji: {
    fontSize: typography.textSm,
  },
  triggerLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  sheetBody: {
    width: "100%",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    gap: spacing[1],
  },
  sheetTitle: {
    fontFamily: typography.fontHeadingMedium,
    fontStyle: "italic",
    fontSize: typography.textLg,
    color: colors.ink,
    marginBottom: spacing[2],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.ledgerOutline,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radii.xl,
  },
  optionSelected: {
    backgroundColor: colors.surfaceDim,
  },
  optionPressed: {
    backgroundColor: colors.surfaceDim,
  },
  optionLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
});
