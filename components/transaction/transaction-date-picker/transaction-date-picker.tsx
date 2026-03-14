import { useState } from "react";
import { Button } from "heroui-native/button";
import { Chip } from "heroui-native/chip";
import { BottomSheet, useBottomSheet } from "heroui-native/bottom-sheet";
import DateTimePicker, { DateType, useDefaultClassNames } from "react-native-ui-datepicker";

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

export default function TransactionDatePicker({ date, onChange }: TransactionDatePickerProps) {
  const defaultClassNames = useDefaultClassNames();
  const [selected, setSelected] = useState<DateType>();

  return (
    <BottomSheet>
      <BottomSheet.Trigger asChild>
        <Chip variant="soft" color="default">
          <Chip.Label className="capitalize">📆 {getDisplayDateLabel(date)}</Chip.Label>
        </Chip>
      </BottomSheet.Trigger>
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content backgroundClassName="rounded-[32px]" contentContainerClassName="gap-4">
          <DateTimePicker
            mode="single"
            date={selected}
            onChange={({ date }) => {
              setSelected(date);
            }}
            timePicker
            navigationPosition="around"
            classNames={defaultClassNames}
          />

          <DoneButton
            onPress={() => {
              if (!selected) {
                return;
              }

              // @ts-expect-error
              onChange?.(new Date(selected));
            }}
          />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
