import { Pressable } from "react-native";

import { Text } from "@/components/ui/text";

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function ChartTabButton({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-2.5 items-center ${active ? "bg-ink" : "bg-surface-container"}`}
    >
      <Text
        className={`font-body-semibold text-[11px] uppercase tracking-[0.1em] ${active ? "text-surface" : "text-ink/40"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
