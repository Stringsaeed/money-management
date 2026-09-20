import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { CheckIcon } from "phosphor-react-native";
import { addMonths } from "date-fns";
import { useNativeVariable } from "react-native-css";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

import { CountStepper } from "./count-stepper";

type EndType = "never" | "on_date" | "after_count";

interface EndsControlProps {
  startDate: Date;
  endDate: Date | null;
  endCount: number | null;
  onChange: (patch: { endDate: Date | null; endCount: number | null }) => void;
  children: React.ReactNode;
}

const OPTIONS: { type: EndType; label: string }[] = [
  { type: "never", label: "Never" },
  { type: "on_date", label: "On date" },
  { type: "after_count", label: "After N times" },
];

function endTypeOf(endDate: Date | null, endCount: number | null): EndType {
  if (endCount != null) return "after_count";
  if (endDate != null) return "on_date";
  return "never";
}

export function EndsControl({
  startDate,
  endDate,
  endCount,
  onChange,
  children,
}: EndsControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<EndType>("never");
  const [dateValue, setDateValue] = useState<Date>(endDate ?? addMonths(startDate, 12));
  const [countValue, setCountValue] = useState<number>(endCount ?? 12);
  // @ts-expect-error: useNativeVariable is not typed correctly
  const colorInk = useNativeVariable("--color-ink");

  const open = () => {
    setMode(endTypeOf(endDate, endCount));
    setDateValue(endDate ?? addMonths(startDate, 12));
    setCountValue(endCount ?? 12);
    setIsOpen(true);
  };

  // SAFETY: Picker pattern expects a single pressable child element
  const trigger = React.cloneElement(
    React.Children.only(children) as React.ReactElement<PressableProps>,
    { onPress: open },
  );

  const selectRow = (type: EndType) => {
    if (type === "never") {
      onChange({ endDate: null, endCount: null });
      setIsOpen(false);
      return;
    }
    setMode(type);
  };

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDateValue(date);
  };

  return (
    <>
      {trigger}
      <ModalBottomSheet open={isOpen} onDismiss={() => setIsOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Ends</Text>

          <View style={styles.optionsContainer}>
            {OPTIONS.map((option) => {
              const isSelected = mode === option.type;
              return (
                <Pressable
                  key={option.type}
                  onPress={() => selectRow(option.type)}
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
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Icon as={CheckIcon} size={18} style={styles.checkIcon} weight="bold" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {mode === "on_date" ? (
            <View style={styles.editorContainer}>
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="inline"
                minimumDate={startDate}
                onChange={handleDateChange}
                accentColor={colorInk}
                style={styles.datePicker}
              />
              <Button
                size="xl"
                style={styles.doneButton}
                onPress={() => {
                  onChange({ endDate: dateValue, endCount: null });
                  setIsOpen(false);
                }}
              >
                <Text>Done</Text>
              </Button>
            </View>
          ) : null}

          {mode === "after_count" ? (
            <View style={styles.editorContainer}>
              <View style={styles.countRow}>
                <Text style={styles.countLabel}>Occurrences</Text>
                <CountStepper value={countValue} min={1} max={99} onChange={setCountValue} />
              </View>
              <Button
                size="xl"
                style={styles.doneButton}
                onPress={() => {
                  onChange({ endDate: null, endCount: countValue });
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
  datePicker: {
    width: "100%",
    alignSelf: "center",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  doneButton: {
    marginHorizontal: spacing[8],
  },
  bottomSpacer: {
    height: spacing[2],
  },
});
