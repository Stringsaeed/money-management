import React, { useState } from "react";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PressableScale } from "pressto";
import type { PressableProps } from "react-native";
import { StyleSheet, View } from "react-native";
import { useNativeVariable } from "react-native-css";

import { Button } from "@/components/ui/button";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

import { getDisplayDateLabel } from "../utils";
import type { TransactionDatePickerProps } from "./types";

interface ExtendedDatePickerProps extends TransactionDatePickerProps {
  children?: React.ReactNode;
}

export default function TransactionDatePicker({
  date,
  onChange,
  children,
}: ExtendedDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date>(date);
  // @ts-expect-error: useNativeVariable is not typed correctly
  const colorInk = useNativeVariable("--color-ink");

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setSelected(selectedDate);
    }
  };

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

    return (
      <PressableScale onPress={onOpen}>
        <View style={styles.defaultTrigger}>
          <Text style={styles.triggerEmoji}>📆</Text>
          <Text style={styles.triggerLabel}>{getDisplayDateLabel(date)}</Text>
        </View>
      </PressableScale>
    );
  };

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={open} onDismiss={() => setOpen(false)}>
        <View style={styles.sheetContent}>
          <DateTimePicker
            value={selected}
            mode="datetime"
            display="inline"
            onChange={handleChange}
            accentColor={colorInk}
            style={styles.datePicker}
          />

          <Button
            size="xl"
            style={styles.doneButton}
            onPress={() => {
              setOpen(false);
              onChange?.(selected);
            }}
          >
            <Text>Done</Text>
          </Button>
        </View>
      </ModalBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  defaultTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
  },
  triggerEmoji: {
    fontSize: 15,
  },
  triggerLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
    textTransform: "capitalize",
  },
  sheetContent: {
    paddingBottom: spacing[10],
    width: "100%",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    gap: spacing[4],
  },
  datePicker: {
    width: "100%",
    alignSelf: "center",
  },
  doneButton: {
    marginHorizontal: spacing[8],
  },
});
