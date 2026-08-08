import { TrashIcon } from "phosphor-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface AccountDeleteActionProps {
  accountName: string;
  onPress: () => void;
}

export function AccountDeleteAction({ accountName, onPress }: AccountDeleteActionProps) {
  return (
    <Pressable
      accessibilityLabel={`Delete ${accountName}`}
      accessibilityRole="button"
      className="w-24 items-center justify-center gap-1 bg-destructive active:opacity-80"
      onPress={onPress}
    >
      <Icon as={TrashIcon} className="text-white" size={20} weight="bold" />
      <Text className="font-body-semibold text-xs text-white">Delete</Text>
    </Pressable>
  );
}
