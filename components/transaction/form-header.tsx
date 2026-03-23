import { Pressable, View } from "react-native";
import { ArrowLeftIcon, CheckIcon, TrashIcon } from "phosphor-react-native";

import { Text } from "@/components/ui/text";
import { DESTRUCTIVE, INK } from "./constants";

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
        <ArrowLeftIcon size={20} color={INK} weight="bold" />
      </Pressable>

      <Text className="font-heading-normal text-[18px] italic text-ink">{title}</Text>

      <View className="flex-row items-center gap-2">
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            className="h-10 w-10 items-center justify-center rounded-full bg-terracotta/10 active:bg-terracotta/20"
          >
            <TrashIcon size={18} color={DESTRUCTIVE} weight="bold" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onSubmit}
          disabled={saving}
          className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-80"
          style={{ opacity: saving ? 0.5 : 1 }}
        >
          <CheckIcon size={20} color="#F9F8F6" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}
