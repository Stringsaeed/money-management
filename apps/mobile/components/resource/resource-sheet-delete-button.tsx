import { TrashIcon } from "phosphor-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon";

interface ResourceSheetDeleteButtonProps {
  label: string;
  onPress: VoidFunction;
}

export function ResourceSheetDeleteButton({ label, onPress }: ResourceSheetDeleteButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-full active:bg-destructive/10"
      hitSlop={8}
      onPress={onPress}
    >
      <Icon as={TrashIcon} className="text-destructive" size={20} />
    </Pressable>
  );
}
