import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import {
  ListIcon,
  PlusIcon,
  TrendDownIcon,
  TrendUpIcon,
  ArchiveIcon,
  type Icon as PhosphorIcon,
} from "phosphor-react-native";

import { CategoryFormBottomSheet } from "@/components/category/category-form-sheet";
import { CategoryEditSheet } from "@/components/category/category-edit-sheet";
import { SeedPacketsGraphic } from "@/components/graphics/seed-packets";
import { Card } from "@/components/settings/card";
import { CategoryRow } from "@/components/settings/category-row";
import { Divider } from "@/components/settings/divider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAllCategories } from "@/hooks/use-categories";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "income" | "expense" | "archived";

interface FilterOption {
  value: CategoryFilter;
  label: string;
  icon: PhosphorIcon;
}

const FILTERS: FilterOption[] = [
  { value: "all", label: "All", icon: ListIcon },
  { value: "income", label: "Income", icon: TrendUpIcon },
  { value: "expense", label: "Expenses", icon: TrendDownIcon },
  { value: "archived", label: "Archived", icon: ArchiveIcon },
];

export default function CategoriesScreen() {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories = [] } = useAllCategories();

  const filtered = useMemo(() => {
    switch (filter) {
      case "income":
        return categories.filter((c) => c.type === "income");
      case "expense":
        return categories.filter((c) => c.type === "expense");
      case "archived":
        return categories.filter((c) => c.lifecycle === "archived");
      case "all":
      default:
        return categories;
    }
  }, [categories, filter]);

  const fabInitialType = filter === "income" ? "income" : "expense";

  return (
    <View className="flex-1 bg-surface safe-bottom">
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
                aria-pressed={active}
                key={option.value}
                onPress={() => setFilter(option.value)}
                role="button"
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
            <SeedPacketsGraphic />
            <Text className="font-heading-normal italic text-lg text-ink">No categories yet</Text>
            <Text className="font-body-normal text-sm text-ink/50 text-center">
              Tap the + button to add your first category.
            </Text>
          </View>
        ) : (
          <Card animated>
            {filtered.map((cat, i) => (
              <Animated.View
                key={cat.id}
                entering={FadeIn}
                exiting={FadeOut}
                layout={LinearTransition}
              >
                {i > 0 && <Divider />}
                <CategoryRow category={cat} onPress={() => setEditingCategory(cat)} />
              </Animated.View>
            ))}
          </Card>
        )}
      </ScrollView>

      <CategoryFormBottomSheet initialType={fabInitialType}>
        <Button size="fab">
          <Icon as={PlusIcon} size={24} />
        </Button>
      </CategoryFormBottomSheet>
      {editingCategory ? (
        <CategoryEditSheet
          category={editingCategory}
          onDismiss={() => setEditingCategory(null)}
          onUpdated={() => setEditingCategory(null)}
        />
      ) : null}
    </View>
  );
}
