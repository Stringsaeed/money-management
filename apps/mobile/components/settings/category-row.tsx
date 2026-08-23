import { CaretRightIcon } from "phosphor-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

import type { CategoryRowProps } from "./types";

export function CategoryRow({ category, onPress }: CategoryRowProps) {
  return (
    <Pressable
      aria-label={category.lifecycle === "archived" ? `${category.name}, Archived` : category.name}
      role="button"
      onPress={onPress}
      className="flex-row items-center px-4 py-3 gap-3 active:bg-surface-dim"
    >
      <View style={{ backgroundColor: category.color }} className="w-2.5 h-2.5 rounded-full" />
      <Text className="flex-1 font-body-medium text-base text-ink">{category.name}</Text>
      {category.lifecycle === "archived" ? (
        <Text className="font-body-medium text-xs text-ink/40">Archived</Text>
      ) : null}
      <Icon as={CaretRightIcon} className="text-ink/20" size={14} />
    </Pressable>
  );
}
