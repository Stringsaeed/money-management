import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  ListIcon,
  PlusIcon,
  TrendDownIcon,
  TrendUpIcon,
  type Icon as PhosphorIcon,
} from "phosphor-react-native";

import { CategoryFormBottomSheet } from "@/components/category/category-form-sheet";
import { Card } from "@/components/settings/card";
import { CategoryRow } from "@/components/settings/category-row";
import { Divider } from "@/components/settings/divider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useCategories } from "@/hooks/use-categories";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "income" | "expense";

interface FilterOption {
  value: CategoryFilter;
  label: string;
  icon: PhosphorIcon;
}

const FILTERS: FilterOption[] = [
  { value: "all", label: "All", icon: ListIcon },
  { value: "income", label: "Income", icon: TrendUpIcon },
  { value: "expense", label: "Expenses", icon: TrendDownIcon },
];

export default function CategoriesScreen() {
  const colorScheme = useColorScheme();
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const { data: categories = [] } = useCategories();

  const filtered = useMemo(() => {
    switch (filter) {
      case "income":
        return categories.filter((c) => c.type === "income");
      case "expense":
        return categories.filter((c) => c.type === "expense");
      case "all":
      default:
        return categories;
    }
  }, [categories, filter]);

  const fabInitialType = filter === "income" ? "income" : "expense";

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-safe-offset-32"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 pt-4 pb-2 gap-2"
        >
          {FILTERS.map((option) => {
            const active = filter === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setFilter(option.value)}
                className={cn(
                  "flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border",
                  active ? "bg-ink border-ink" : "bg-surface-container border-ledger-outline",
                )}
              >
                <Icon
                  as={option.icon}
                  size={14}
                  className={active ? "text-surface" : "text-ink/60"}
                />
                <Text
                  className={cn("font-body-medium text-sm", active ? "text-surface" : "text-ink")}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filtered.length === 0 ? (
          <View className="items-center py-16 px-8 gap-2">
            <Text className="text-3xl">🏷️</Text>
            <Text className="font-heading-normal italic text-lg text-ink">No categories yet</Text>
            <Text className="font-body-normal text-sm text-ink/50 text-center">
              Tap the + button to add your first category.
            </Text>
          </View>
        ) : (
          <Card animated>
            {filtered.map((cat, i) => (
              <Animated.View key={cat.id} entering={FadeIn} exiting={FadeOut}>
                {i > 0 && <Divider />}
                <CategoryRow category={cat} />
              </Animated.View>
            ))}
          </Card>
        )}
      </ScrollView>

      <CategoryFormBottomSheet initialType={fabInitialType}>
        <Pressable
          style={{
            position: "absolute",
            bottom: 32,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 8px ${colorScheme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)"}`,
          }}
          className="bg-brand"
        >
          <Icon as={PlusIcon} size={24} className="text-white" />
        </Pressable>
      </CategoryFormBottomSheet>
    </View>
  );
}
