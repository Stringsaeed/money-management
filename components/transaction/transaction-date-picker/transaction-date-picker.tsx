import React, { useRef, useState } from "react";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { PressableScale } from "pressto";
import { Pressable, PressableProps, useColorScheme, View } from "react-native";
import { getDisplayDateLabel } from "../utils";

import { TransactionDatePickerProps } from "./types";
import { Text } from "@/components/ui/text";

interface ExtendedDatePickerProps extends TransactionDatePickerProps {
  children?: React.ReactNode;
}

export default function TransactionDatePicker({
  date,
  onChange,
  children,
}: ExtendedDatePickerProps) {
  const ref = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<Date>(date);
  const colorScheme = useColorScheme();

  const sheetBg = { backgroundColor: colorScheme === "dark" ? "#141312" : "#F9F8F6" };
  const sheetHandle = { backgroundColor: colorScheme === "dark" ? "#282624" : "#EBE8E3" };
  const accentColor = colorScheme === "dark" ? "#E8E6E3" : "#1C1B1A";

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setSelected(selectedDate);
    }
  };

  const onOpen = () => {
    console.log("On Open");

    ref.current?.present();
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
      <BottomSheetModal
        enableDynamicSizing
        ref={ref}
        backgroundStyle={sheetBg}
        handleIndicatorStyle={sheetHandle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
      >
        <BottomSheetView className="flex-1 pb-safe w-full px-5 gap-4">
          <DateTimePicker
            value={selected}
            mode="datetime"
            display="inline"
            onChange={handleChange}
            accentColor={accentColor}
            style={{ width: "100%", alignSelf: "center" }}
          />

          <Pressable
            onPress={() => {
              ref.current?.dismiss();
              onChange?.(selected);
            }}
            className="mx-8 py-3 bg-ink items-center active:opacity-80"
            style={{ borderCurve: "continuous" }}
          >
            <Text className="font-body-semibold text-[13px] text-surface uppercase tracking-wide">
              Done
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
