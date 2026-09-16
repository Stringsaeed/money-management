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
import {
  ACTIVITY_RANGE_PRESETS,
  activityRangeLabel,
  type ActivityRangeKey,
} from "@/utils/activity";

interface ActivityDateRangeFilterProps {
  readonly value: ActivityRangeKey;
  readonly onChange: (key: ActivityRangeKey) => void;
  children?: ReactNode;
}

/**
 * Date-range dropdown for the activity timeline (#95): preset windows
 * (all time / last 7 / 30 / 90 days) resolved to inclusive UTC bounds by
 * `resolveActivityRange`. Standard picker pattern — self-contained sheet
 * state, `children` as trigger.
 */
export function ActivityDateRangeFilter({
  value,
  onChange,
  children,
}: ActivityDateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const inkHex = colorScheme === "dark" ? rawColorValues.dark.ink : rawColorValues.light.ink;

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
          <Text style={styles.triggerEmoji}>📆</Text>
          <Text style={styles.triggerLabel}>{activityRangeLabel(value)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={open} onDismiss={() => setOpen(false)}>
        <View style={[styles.sheetBody, { paddingBottom: insets.bottom }]}>
          <Text style={styles.sheetTitle}>Date range</Text>
          {ACTIVITY_RANGE_PRESETS.map((preset, i) => {
            const selected = preset.key === value;
            return (
              <View key={preset.key}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={preset.label}
                  onPress={() => {
                    setOpen(false);
                    onChange(preset.key);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={styles.optionLabel}>📅 {preset.label}</Text>
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
