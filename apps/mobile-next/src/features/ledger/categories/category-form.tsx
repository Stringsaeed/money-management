/* oxlint-disable complexity -- this form owns the small Category field state and validation surface. */

import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { TextField } from "@/ui/text-field";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";
import type { CategoryInput } from "@/data/ledger-client";

interface CategoryFormProps {
  readonly category?: V2Category;
  readonly busy?: boolean;
  readonly error?: string;
  readonly onCancel?: () => void;
  readonly onSubmit: (input: CategoryInput) => Promise<void>;
}

export function CategoryForm({
  category,
  busy = false,
  error,
  onCancel,
  onSubmit,
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<CategoryInput["kind"]>(category?.kind ?? "expense");
  const [color, setColor] = useState(category?.color ?? "#4a8f69");

  return (
    <View style={styles.content}>
      <Text variant="title">{category ? "Edit Category" : "Add Category"}</Text>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Groceries"
        autoCapitalize="words"
      />
      <View style={styles.group}>
        <Text variant="label">Kind</Text>
        <View style={styles.chips}>
          <Chip label="Expense" selected={kind === "expense"} onPress={() => setKind("expense")} />
          <Chip label="Income" selected={kind === "income"} onPress={() => setKind("income")} />
        </View>
      </View>
      <TextField
        label="Accent color"
        value={color}
        onChangeText={setColor}
        placeholder="#4a8f69"
        autoCapitalize="none"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        {onCancel ? <Button title="Cancel" variant="ghost" onPress={onCancel} /> : null}
        <Button
          title={category ? "Save changes" : "Create category"}
          onPress={() => void onSubmit({ name: name.trim(), kind, color })}
          loading={busy}
          disabled={!name.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing[4], paddingBottom: spacing[8] },
  group: { gap: spacing[2] },
  chips: { flexDirection: "row", gap: spacing[2] },
  actions: { flexDirection: "row", gap: spacing[2], justifyContent: "flex-end" },
  error: { color: colors.destructive },
});
