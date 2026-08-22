import React, { useState } from "react";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";
import { PressableScale } from "pressto";
import type { PressableProps } from "react-native";
import { View } from "react-native";
import { useNativeVariable } from "react-native-css";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { TransactionDatePickerProps } from "./types";
import { getDisplayDateLabel } from "../utils";
interface ExtendedDatePickerProps extends TransactionDatePickerProps {
  children?: React.ReactNode;
}

export default function TransactionDatePicker({
  date,
  onChange,
  children,
}: ExtendedDatePickerProps) {
  const [sheetIndex, setSheetIndex] = useState(0);
  const [selected, setSelected] = useState<Date>(date);
  // @ts-expect-error: useNativeVariable is not typed correctly
  const colorInk = useNativeVariable("--color-ink");

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setSelected(selectedDate);
    }
  };

  const onOpen = () => {
    setSheetIndex(1);
  };

  const renderTrigger = () => {
    if (children) {
      const child = React.Children.only(children);

      return React.cloneElement(child as React.ReactElement<PressableProps>, {
        onPress: onOpen,
      });
    }

    return (
      <PressableScale onPress={onOpen}>
        <View
          className="flex-row items-center gap-1.5 rounded-xl px-3 py-1.5 bg-surface-container"
          style={{ borderCurve: "continuous" }}
        >
          <Text className="text-[15px]">📆</Text>
          <Text className="font-body-medium text-sm text-ink capitalize">
            {getDisplayDateLabel(date)}
          </Text>
        </View>
      </PressableScale>
    );
  };

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet
        index={sheetIndex}
        onIndexChange={setSheetIndex}
        scrimColor="rgba(0, 0, 0, 0.5)"
        surface={<View className="absolute inset-0 rounded-t-3xl bg-background" />}
      >
        <View className="pb-safe w-full px-5 pt-5 gap-4">
          <DateTimePicker
            value={selected}
            mode="datetime"
            display="inline"
            onChange={handleChange}
            accentColor={colorInk}
            style={{ width: "100%", alignSelf: "center" }}
          />

          <Button
            size="xl"
            className="mx-8"
            onPress={() => {
              setSheetIndex(0);
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
