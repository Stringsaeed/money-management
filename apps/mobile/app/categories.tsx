import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { colors, radii, rawColorValues, spacing, typography } from "@/lib/design-tokens";
import type { Category } from "@/types";

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
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const palette = colorScheme === "dark" ? rawColorValues.dark : rawColorValues.light;

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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing[32] },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((option) => {
            const active = filter === option.value;
            return (
              <Pressable
                aria-pressed={active}
                key={option.value}
                onPress={() => setFilter(option.value)}
                role="button"
                style={[
                  styles.filterChip,
                  active ? styles.filterChipActive : styles.filterChipIdle,
                ]}
              >
                <Icon
                  as={option.icon}
                  size={14}
                  style={{
                    color: active ? palette.surface : palette.ink,
                    opacity: active ? 1 : 0.6,
                  }}
                />
                <Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SeedPacketsGraphic />
            <Text style={styles.emptyTitle}>No categories yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to add your first category.</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  filtersContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipIdle: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.ledgerOutline,
  },
  filterLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  filterLabelActive: {
    color: colors.surface,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[8],
    gap: spacing[2],
  },
  emptyTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontStyle: "italic",
    fontSize: typography.textLg,
    color: colors.ink,
  },
  emptySubtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
    textAlign: "center",
  },
});
