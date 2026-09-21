import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useCategoriesQuery, useLedgerMutations } from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Sheet } from "@/ui/sheet";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { spacing, typography } from "@/ui/design-tokens";

import { CategoryForm } from "./category-form";

type CategoryFilter = "all" | "income" | "expense" | "archived";

export function CategoriesScreen() {
  const categories = useCategoriesQuery();
  const mutations = useLedgerMutations();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [editing, setEditing] = useState<string | "new">();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const visible = categories.data.filter((category) => {
    if (filter === "archived") return category.archived;
    if (category.archived) return false;
    return filter === "all" || category.kind === filter;
  });
  const category =
    editing && editing !== "new" ? categories.data.find((item) => item.id === editing) : undefined;

  if (categories.isError)
    return (
      <Screen>
        <EmptyState
          title="Categories unavailable"
          message="Check your connection and try again."
          onRetry={() => void categories.retry()}
        />
      </Screen>
    );

  return (
    <Screen>
      <LegendList
        data={visible}
        keyExtractor={(item) => item.id}
        estimatedItemSize={74}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headline">Categories</Text>
            <Button
              title="Add category"
              onPress={() => {
                setError(undefined);
                setEditing("new");
              }}
            />
            <View style={styles.chips}>
              {(["all", "income", "expense", "archived"] as const).map((item) => (
                <Chip
                  key={item}
                  label={item[0].toUpperCase() + item.slice(1)}
                  selected={filter === item}
                  onPress={() => setFilter(item)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          !categories.isLoading ? (
            <EmptyState
              title="No categories"
              message="Add categories to make entries easier to understand."
              onRetry={() => setEditing("new")}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Surface variant="raised" style={styles.card}>
            <Button
              title={item.name}
              variant="ghost"
              onPress={() => {
                setError(undefined);
                setEditing(item.id);
              }}
            />
            <Text style={[styles.meta, { color: item.color }]}>
              {item.kind} · {item.archived ? "Archived" : "Active"}
            </Text>
            <View style={styles.rowActions}>
              {item.archived ? (
                <Button
                  title="Restore"
                  variant="secondary"
                  onPress={() =>
                    void mutations
                      .restoreCategory(item.id, item.version)
                      .catch((cause) =>
                        setError(
                          cause instanceof Error ? cause.message : "Could not restore category.",
                        ),
                      )
                  }
                />
              ) : (
                <Button
                  title="Archive"
                  variant="ghost"
                  onPress={() =>
                    void mutations
                      .archiveCategory(item.id, item.version)
                      .catch((cause) =>
                        setError(
                          cause instanceof Error ? cause.message : "Could not archive category.",
                        ),
                      )
                  }
                />
              )}
              <Button
                title="Delete"
                variant="destructive"
                onPress={() =>
                  void mutations
                    .deleteCategory(item.id, item.version)
                    .catch((cause) =>
                      setError(
                        cause instanceof Error ? cause.message : "Could not delete category.",
                      ),
                    )
                }
              />
            </View>
          </Surface>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Sheet
        open={Boolean(editing)}
        onDismiss={() => setEditing(undefined)}
        snapPoints={["half", "full"]}
      >
        <CategoryForm
          category={category}
          busy={busy}
          error={error}
          onCancel={() => setEditing(undefined)}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              if (category) await mutations.updateCategory(category.id, input, category.version);
              else await mutations.createCategory(input);
              setEditing(undefined);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Could not save category.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[2],
    paddingBottom: spacing[16],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: { gap: spacing[3], paddingBottom: spacing[2] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  card: { gap: spacing[1], padding: spacing[4] },
  meta: { fontFamily: typography.fontBodyNormal, fontSize: typography.textSm },
  rowActions: { flexDirection: "row", gap: spacing[2] },
  separator: { height: spacing[2] },
});
