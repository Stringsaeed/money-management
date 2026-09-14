import { Children, cloneElement, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Pressable, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";
import type { PressableProps } from "react-native";

import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_RANGE_PRESETS,
  activityRangeLabel,
  type ActivityRangeKey,
} from "@/utils/activity";

interface ActivityDateRangeFilterProps {
  readonly value: ActivityRangeKey;
  readonly onChange: (key: ActivityRangeKey) => void;
  children?: ReactNode;
}

/**
 * Date-range dropdown for the activity timeline (#95): preset windows
 * (all time / last 7 / 30 / 90 days) resolved to inclusive UTC bounds by
 * `resolveActivityRange`. Standard picker pattern — self-contained sheet
 * state, `children` as trigger.
 */
export function ActivityDateRangeFilter({
  value,
  onChange,
  children,
}: ActivityDateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);

  const renderTrigger = () => {
    if (children) {
      const child = Children.only(children);
      return cloneElement(child as ReactElement<PressableProps>, { onPress: handleOpen });
    }
    return (
      <Pressable onPress={handleOpen} className="active:opacity-70">
        <View className="flex-row items-center gap-1.5 rounded-xl px-3 py-1.5 bg-surface-container">
          <Text className="text-sm">📆</Text>
          <Text className="font-body-medium text-sm text-ink">{activityRangeLabel(value)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={open} onDismiss={() => setOpen(false)}>
        <View className="pb-safe w-full px-5 pt-5 gap-1">
          <Text className="font-heading-medium italic text-lg text-ink mb-2">Date range</Text>
          {ACTIVITY_RANGE_PRESETS.map((preset, i) => {
            const selected = preset.key === value;
            return (
              <View key={preset.key}>
                {i > 0 && <View className="h-px bg-ledger-outline" />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={preset.label}
                  onPress={() => {
                    setOpen(false);
                    onChange(preset.key);
                  }}
                  className={cn(
                    "flex-row items-center justify-between px-2 py-3 active:bg-surface-dim rounded-xl",
                    selected && "bg-surface-dim",
                  )}
                >
                  <Text className="font-body-medium text-base text-ink">📅 {preset.label}</Text>
                  {selected ? <Icon as={CheckIcon} size={18} className="text-ink" /> : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </ModalBottomSheet>
    </>
  );
}
