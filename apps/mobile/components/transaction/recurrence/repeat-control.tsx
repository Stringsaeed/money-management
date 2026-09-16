import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import type { RecurrenceFrequency } from "@/types";

import { CountStepper } from "./count-stepper";
import { FREQUENCY_LABELS, REPEAT_PRESETS, presetKeyFor } from "./presets";

const UNIT_OPTIONS: RecurrenceFrequency[] = ["day", "week", "month", "year"];

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

interface RepeatControlProps {
  frequency: RecurrenceFrequency;
  intervalCount: number;
  onChange: (frequency: RecurrenceFrequency, intervalCount: number) => void;
  children: React.ReactNode;
}

export function RepeatControl({
  frequency,
  intervalCount,
  onChange,
  children,
}: RepeatControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [count, setCount] = useState(intervalCount);
  const [unit, setUnit] = useState<RecurrenceFrequency>(frequency);
  const selectedKey = presetKeyFor(frequency, intervalCount);

  const open = () => {
    setShowCustom(selectedKey === "custom");
    setCount(Math.max(1, intervalCount));
    setUnit(frequency);
    setIsOpen(true);
  };

  // SAFETY: Picker pattern expects a single pressable child element
  const trigger = React.cloneElement(
    React.Children.only(children) as React.ReactElement<PressableProps>,
    { onPress: open },
  );

  const selectPreset = (nextFrequency: RecurrenceFrequency, nextCount: number) => {
    onChange(nextFrequency, nextCount);
    setIsOpen(false);
  };

  return (
    <>
      {trigger}
      <ModalBottomSheet open={isOpen} onDismiss={() => setIsOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Repeats</Text>

          <View style={styles.optionsContainer}>
            {REPEAT_PRESETS.map((preset) => {
              const isSelected = !showCustom && selectedKey === preset.key;
              return (
                <Pressable
                  key={preset.key}
                  onPress={() => selectPreset(preset.frequency, preset.intervalCount)}
                  style={[
                    styles.optionRow,
                    isSelected ? styles.optionRowSelected : styles.optionRowDefault,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected ? styles.optionLabelSelected : styles.optionLabelDefault,
                    ]}
                  >
                    {preset.label}
                  </Text>
                  {isSelected ? (
                    <Icon as={CheckIcon} size={18} style={styles.checkIcon} weight="bold" />
                  ) : null}
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => {
                setCount(Math.max(1, intervalCount));
                setUnit(frequency);
                setShowCustom(true);
              }}
              style={[
                styles.optionRow,
                showCustom ? styles.optionRowSelected : styles.optionRowDefault,
              ]}
            >
              <Text
                style={[
                  styles.optionLabel,
                  showCustom ? styles.optionLabelSelected : styles.optionLabelDefault,
                ]}
              >
                Custom…
              </Text>
              {showCustom ? (
                <Icon as={CheckIcon} size={18} style={styles.checkIcon} weight="bold" />
              ) : null}
            </Pressable>
          </View>

          {showCustom ? (
            <View style={styles.editorContainer}>
              <View style={styles.everyRow}>
                <Text style={styles.everyLabel}>Every</Text>
                <CountStepper value={count} min={1} max={99} onChange={setCount} />
              </View>
              <View style={styles.unitOptionsRow}>
                {UNIT_OPTIONS.map((option) => {
                  const isSelected = unit === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setUnit(option)}
                      style={[
                        styles.unitOption,
                        isSelected ? styles.unitOptionSelected : styles.unitOptionDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitLabel,
                          isSelected ? styles.unitLabelSelected : styles.unitLabelDefault,
                        ]}
                      >
                        {capitalize(FREQUENCY_LABELS[option])}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Button
                size="xl"
                style={styles.doneButton}
                onPress={() => {
                  onChange(unit, count);
                  setIsOpen(false);
                }}
              >
                <Text>Done</Text>
              </Button>
            </View>
          ) : null}

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
  optionLabel: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 15,
  },
  optionLabelSelected: {
    color: colors.surface,
  },
  optionLabelDefault: {
    color: colors.ink,
  },
  checkIcon: {
    color: colors.surface,
  },
  editorContainer: {
    gap: spacing[4],
    paddingTop: spacing[1],
  },
  everyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  everyLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  unitOptionsRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  unitOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[2.5],
    borderRadius: radii.xl,
  },
  unitOptionSelected: {
    backgroundColor: colors.ink,
  },
  unitOptionDefault: {
    backgroundColor: colors.surfaceContainer,
  },
  unitLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  unitLabelSelected: {
    color: colors.surface,
  },
  unitLabelDefault: {
    color: colors.ink,
  },
  doneButton: {
    marginHorizontal: spacing[8],
  },
  bottomSpacer: {
    height: spacing[2],
  },
});
