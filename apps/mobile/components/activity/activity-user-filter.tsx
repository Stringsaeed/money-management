import { Children, cloneElement, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Pressable, View } from "react-native";
import { CheckIcon } from "phosphor-react-native";
import type { PressableProps } from "react-native";

import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

import type { ActivityUserOption } from "./types";

interface ActivityUserFilterProps {
  readonly members: readonly ActivityUserOption[];
  /** Selected user id, or null for "everyone". */
  readonly value: string | null;
  readonly onChange: (userId: string | null) => void;
  children?: ReactNode;
}

/**
 * Member dropdown for the activity timeline (#95). Follows the standard
 * picker pattern: self-contained sheet state, `children` as trigger, sheet
 * dismissed after selection.
 */
export function ActivityUserFilter({
  members,
  value,
  onChange,
  children,
}: ActivityUserFilterProps) {
  const [open, setOpen] = useState(false);

  const options: readonly (ActivityUserOption | null)[] = [null, ...members];

  const handleOpen = () => setOpen(true);

  const renderTrigger = () => {
    if (children) {
      const child = Children.only(children);
      return cloneElement(child as ReactElement<PressableProps>, { onPress: handleOpen });
    }
    return (
      <Pressable onPress={handleOpen} className="active:opacity-70">
        <View className="flex-row items-center gap-1.5 rounded-xl px-3 py-1.5 bg-surface-container">
          <Text className="text-sm">👤</Text>
          <Text className="font-body-medium text-sm text-ink">
            {members.find((m) => m.userId === value)?.userName ?? "Everyone"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={open} onDismiss={() => setOpen(false)}>
        <View className="pb-safe w-full px-5 pt-5 gap-1">
          <Text className="font-heading-medium italic text-lg text-ink mb-2">Filter by member</Text>
          {options.map((option, i) => {
            const selected = (option?.userId ?? null) === value;
            return (
              <View key={option?.userId ?? "all"}>
                {i > 0 && <View className="h-px bg-ledger-outline" />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={option?.userName ?? "Everyone"}
                  onPress={() => {
                    setOpen(false);
                    onChange(option?.userId ?? null);
                  }}
                  className={cn(
                    "flex-row items-center justify-between px-2 py-3 active:bg-surface-dim rounded-xl",
                    selected && "bg-surface-dim",
                  )}
                >
                  <Text className="font-body-medium text-base text-ink">
                    {option ? `👤 ${option.userName}` : "🌍 Everyone"}
                  </Text>
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
