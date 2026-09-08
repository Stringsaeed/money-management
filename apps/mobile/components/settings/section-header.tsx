import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  readonly title: string;
  readonly variant?: "page" | "card";
}

export function SectionHeader({ title, variant = "page" }: SectionHeaderProps) {
  return (
    <View
      testID="section-header"
      className={cn(
        "flex-row items-center border-b border-ledger-outline",
        variant === "card" ? "px-4 pt-4 pb-3" : "pt-8 pb-3 mx-5",
      )}
    >
      <Text className="font-heading-normal text-xl italic text-ink">{title}</Text>
    </View>
  );
}
