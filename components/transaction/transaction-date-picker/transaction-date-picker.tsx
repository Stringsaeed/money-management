import { useState } from "react";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Button } from "heroui-native/button";
import { Chip } from "heroui-native/chip";
import { BottomSheet, useBottomSheet } from "heroui-native/bottom-sheet";

import { getDisplayDateLabel } from "../utils";

import { TransactionDatePickerProps } from "./types";

function DoneButton({ onPress }: { onPress?: VoidFunction }) {
  const { onOpenChange } = useBottomSheet();

  return (
    <Button
      onPress={() => {
        onPress?.();
        onOpenChange(false);
      }}
      variant="primary"
    >
      <Button.Label>Done</Button.Label>
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
  const [selected, setSelected] = useState<Date>(date);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setSelected(selectedDate);
    }
  };

  return (
    <BottomSheet>
      <BottomSheet.Trigger asChild={!children}>
        {children ?? (
          <Chip variant="soft" color="default">
            <Chip.Label className="capitalize">📆 {getDisplayDateLabel(date)}</Chip.Label>
          </Chip>
        )}
      </BottomSheet.Trigger>
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          backgroundClassName="rounded-[32px]"
          contentContainerClassName="gap-4 items-center"
        >
          <DateTimePicker
            value={selected}
            mode="datetime"
            display="inline"
            onChange={handleChange}
            accentColor="black"
          />

          <DoneButton
            onPress={() => {
              onChange?.(selected);
            }}
          />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
