import React, { useRef, useState } from "react";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheet,
} from "@gorhom/bottom-sheet";
import { getDisplayDateLabel } from "../utils";

import { TransactionDatePickerProps } from "./types";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { PressableScale } from "pressto";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function DoneButton({ onPress }: { onPress?: VoidFunction }) {
  const { close } = useBottomSheet();

  return (
    <Button
      onPress={() => {
        onPress?.();
        close();
      }}
    >
      <Text>Done</Text>
    </Button>
  );
}

interface ExtendedDatePickerProps extends TransactionDatePickerProps {
  children?: React.ReactNode;
}

export default function TransactionDatePicker({
  date,
  onChange,
  children,
}: ExtendedDatePickerProps) {
  const { bottom } = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<Date>(date);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setSelected(selectedDate);
    }
  };

  const onOpen = () => {
    ref.current?.present();
  };

  const renderTrigger = () => {
    if (children) {
      const child = React.Children.only(children);
      console.log({ child });

      return React.cloneElement(child, {
        onPress: onOpen,
      });
    }

    return (
      <PressableScale onPress={onOpen}>
        <Badge variant="secondary">
          <Text className="capitalize">📆 {getDisplayDateLabel(date)}</Text>
        </Badge>
      </PressableScale>
    );
  };

  return (
    <>
      {renderTrigger()}
      <BottomSheetModal
        enableDynamicSizing
        ref={ref}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        footerComponent={(props) => (
          <BottomSheetFooter {...props} bottomInset={bottom}>
            <DoneButton
              onPress={() => {
                onChange?.(selected);
              }}
            />
          </BottomSheetFooter>
        )}
      >
        <BottomSheetView className="flex-1 items-center justify-center">
          <DateTimePicker
            value={selected}
            mode="datetime"
            display="inline"
            onChange={handleChange}
            accentColor="black"
          />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
