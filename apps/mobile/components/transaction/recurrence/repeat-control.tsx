import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
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

/** Repeats field: a bottom sheet of presets plus a "Custom…" every-N editor. */
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
        <View className="pb-safe px-5 pt-5 gap-4">
          <Text className="font-heading-normal text-xl italic text-ink">Repeats</Text>

          <View className="gap-2">
            {REPEAT_PRESETS.map((preset) => {
              const isSelected = !showCustom && selectedKey === preset.key;
              return (
                <Pressable
                  key={preset.key}
                  onPress={() => selectPreset(preset.frequency, preset.intervalCount)}
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
                    {preset.label}
                  </Text>
                  {isSelected ? (
                    <Icon as={CheckIcon} size={18} className="text-surface" weight="bold" />
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
              className={cn(
                "flex-row items-center px-4 py-3.5 rounded-xl",
                showCustom ? "bg-ink" : "bg-surface-container",
              )}
            >
              <Text
                className={cn(
                  "flex-1 font-body-medium text-[15px]",
                  showCustom ? "text-surface" : "text-ink",
                )}
              >
                Custom…
              </Text>
              {showCustom ? (
                <Icon as={CheckIcon} size={18} className="text-surface" weight="bold" />
              ) : null}
            </Pressable>
          </View>

          {showCustom ? (
            <View className="gap-4 pt-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-body-medium text-[15px] text-ink">Every</Text>
                <CountStepper value={count} min={1} max={99} onChange={setCount} />
              </View>
              <View className="flex-row gap-2">
                {UNIT_OPTIONS.map((option) => {
                  const isSelected = unit === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setUnit(option)}
                      className={cn(
                        "flex-1 items-center py-2.5 rounded-xl",
                        isSelected ? "bg-ink" : "bg-surface-container",
                      )}
                    >
                      <Text
                        className={cn(
                          "font-body-medium text-[13px]",
                          isSelected ? "text-surface" : "text-ink",
                        )}
                      >
                        {capitalize(FREQUENCY_LABELS[option])}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Button
                size="xl"
                className="mx-8"
                onPress={() => {
                  onChange(unit, count);
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
