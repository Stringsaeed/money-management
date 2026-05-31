import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { CATEGORY_TYPE_META } from "@/components/category/category-form-options";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";

import type { CategoryFormValues } from "./form";

interface CategoryFormPreviewProps {
  values: CategoryFormValues;
}

export function CategoryFormPreview({ values }: CategoryFormPreviewProps) {
  const meta = CATEGORY_TYPE_META[values.type];
  const displayName = values.name.trim() || "New category";

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      layout={layoutTransition}
      className="rounded-3xl border border-ledger-outline bg-surface-container px-4 py-3.5"
    >
      <View className="flex-row items-center gap-3">
        <Animated.View
          layout={layoutTransition}
          style={{ backgroundColor: `${values.color}20` }}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <Text className="text-base">{values.icon}</Text>
        </Animated.View>
        <View className="min-w-0 flex-1">
          <Animated.View
            key={displayName}
            entering={FadeIn.duration(150)}
            layout={layoutTransition}
          >
            <Text className="font-body-medium text-base text-ink" numberOfLines={1}>
              {displayName}
            </Text>
          </Animated.View>
          <Text className="mt-0.5 font-body-normal text-xs text-ink/40">{meta.label}</Text>
        </View>
        <View style={{ backgroundColor: values.color }} className="h-3 w-3 rounded-full" />
      </View>
    </Animated.View>
  );
}
