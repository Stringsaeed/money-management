import { Pressable, View } from "react-native";
import { ArrowLeftIcon, CheckIcon, TrashIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface FormHeaderProps {
  onBack: () => void;
  onDelete?: () => void;
  onSubmit: () => void;
  saving: boolean;
  title: string;
}

export function FormHeader({ onBack, onDelete, onSubmit, saving, title }: FormHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-safe pb-3">
      <Pressable
        onPress={onBack}
        className="h-10 w-10 items-center justify-center rounded-full bg-surface-container active:bg-surface-dim"
      >
        <Icon as={ArrowLeftIcon} size={20} className="text-ink" weight="bold" />
      </Pressable>

      <Text className="font-heading-normal text-lg italic text-ink">{title}</Text>

      <View className="flex-row items-center gap-2">
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            className="h-10 w-10 items-center justify-center rounded-full bg-terracotta/10 active:bg-terracotta/20"
          >
            <Icon as={TrashIcon} size={18} className="text-destructive" weight="bold" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onSubmit}
          disabled={saving}
          className={cn(
            "h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-80",
            saving && "opacity-50",
          )}
        >
          <Icon as={CheckIcon} size={20} className="text-surface" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}
