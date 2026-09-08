import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  readonly title: string;
  /**
   * "page" (default) is for a section header sitting directly on the screen
   * background — it carries its own top margin and outer horizontal margin.
   * "card" is for a header composed inside a `Card`, which already provides its
   * own outer margin and spacing from the previous card, so it drops the
   * duplicated `pt-8`/`mx-5` and aligns horizontally with the card's content.
   */
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
