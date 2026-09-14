import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { CheckIcon } from "phosphor-react-native";
import { addMonths } from "date-fns";
import { useNativeVariable } from "react-native-css";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

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

/** Ends field: a bottom sheet of Never / On date / After N times with inline editors. */
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
        <View className="pb-safe px-5 pt-5 gap-4">
          <Text className="font-heading-normal text-xl italic text-ink">Ends</Text>

          <View className="gap-2">
            {OPTIONS.map((option) => {
              const isSelected = mode === option.type;
              return (
                <Pressable
                  key={option.type}
                  onPress={() => selectRow(option.type)}
                  className={cn(
                    "flex-row items-center px-4 py-3.5 rounded-xl",
                    isSelected ? "bg-ink" : "bg-surface-container",
                  )}
                >
                  <Text
                    className={cn(
                      "flex-1 font-body-medium text-[15px]",
                      isSelected ? "text-surface" : "text-ink",
                    )}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Icon as={CheckIcon} size={18} className="text-surface" weight="bold" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {mode === "on_date" ? (
            <View className="gap-4 pt-1">
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="inline"
                minimumDate={startDate}
                onChange={handleDateChange}
                accentColor={colorInk}
                style={{ width: "100%", alignSelf: "center" }}
              />
              <Button
                size="xl"
                className="mx-8"
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
            <View className="gap-4 pt-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-body-medium text-[15px] text-ink">Occurrences</Text>
                <CountStepper value={countValue} min={1} max={99} onChange={setCountValue} />
              </View>
              <Button
                size="xl"
                className="mx-8"
                onPress={() => {
                  onChange({ endDate: null, endCount: countValue });
                  setIsOpen(false);
                }}
              >
                <Text>Done</Text>
              </Button>
            </View>
          ) : null}

          <View className="h-2" />
        </View>
      </ModalBottomSheet>
    </>
  );
}
