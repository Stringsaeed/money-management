import { ScrollView, StyleSheet, View } from "react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import type { CategoryInput } from "@/data/ledger-client";
import {
  CategoryPreview,
  EditorHeader,
  EmojiGrid,
  findSwatch,
  layout,
  NoteField,
  space,
  SwatchPicker,
  Text,
} from "@/ui/trove";

import { CATEGORY_EMOJIS } from "./category-palette";
import { CategoryKindToggle } from "./category-kind-toggle";
import { useCategoryEditor } from "./use-category-editor";

interface CategoryEditorFormProps {
  readonly category?: V2Category;
  readonly busy?: boolean;
  readonly error?: string;
  readonly onCancel?: () => void;
  readonly onSubmit: (input: CategoryInput) => Promise<void>;
}

const KIND_LABEL = { expense: "Expense", income: "Income" } as const satisfies Record<
  CategoryInput["kind"],
  string
>;

export function CategoryEditorForm({
  category,
  busy = false,
  error,
  onCancel,
  onSubmit,
}: CategoryEditorFormProps) {
  const form = useCategoryEditor({ category, onSubmit });
  const message = error ?? form.validationError;
  const { color, icon, kind, name } = form.draft;
  const swatchName = findSwatch(color)?.name ?? "Custom colour";

  return (
    <View style={styles.container}>
      <EditorHeader
        title={category ? "Edit category" : "New category"}
        saveDisabled={busy}
        onClose={() => onCancel?.()}
        onSave={() => void form.submit()}
      />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CategoryKindToggle kind={kind} onChange={form.selectKind} />
        <View style={styles.preview}>
          <CategoryPreview
            color={color}
            emoji={icon}
            name={name.trim() || "Category name"}
            stamp={`${KIND_LABEL[kind]} · ${swatchName}`}
          />
        </View>
        <NoteField
          autoCapitalize="words"
          emoji="✏️"
          maxLength={120}
          onChangeText={form.setName}
          placeholder="Category name"
          testID="category-name-field"
          value={name}
        />
        {message ? (
          <Text accessibilityRole="alert" tone="negative">
            {message}
          </Text>
        ) : null}
        <SwatchPicker accessibilityLabel="Colour" onChange={form.selectColor} value={color} />
        <EmojiGrid
          accessibilityLabel="Emoji"
          color={color}
          onChange={form.selectIcon}
          options={CATEGORY_EMOJIS[kind]}
          value={icon}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: layout.screenGutter, paddingTop: space[2] },
  content: { gap: space[4], paddingBottom: space[6], paddingTop: space[3] },
  preview: { alignItems: "center" },
});
