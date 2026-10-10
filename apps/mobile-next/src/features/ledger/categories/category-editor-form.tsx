import { StyleSheet, View } from "react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import type { CategoryInput } from "@/data/ledger-client";
import { layout, space, Text } from "@/ui/trove";

import { EditorHeader } from "../editor/editor-header";
import { CategoryKindToggle } from "./category-kind-toggle";
import { CategoryPreview } from "./category-preview";
import { CategoryStylePad } from "./category-style-pad";
import { useCategoryEditor } from "./use-category-editor";

interface CategoryEditorFormProps {
  readonly category?: V2Category;
  readonly busy?: boolean;
  readonly error?: string;
  readonly onCancel?: () => void;
  readonly onSubmit: (input: CategoryInput) => Promise<void>;
}

export function CategoryEditorForm({
  category,
  busy = false,
  error,
  onCancel,
  onSubmit,
}: CategoryEditorFormProps) {
  const form = useCategoryEditor({ category, onSubmit });
  const message = error ?? form.validationError;

  return (
    <View style={styles.container}>
      {/* The pad is taller than the system keyboard, so the name field above it stays
          visible without keyboard avoidance. */}
      <View style={styles.body}>
        <EditorHeader
          title={category ? "Edit category" : "New category"}
          busy={busy}
          onCancel={onCancel}
          onSave={() => void form.submit()}
        />
        <CategoryKindToggle kind={form.draft.kind} onChange={form.selectKind} />
        <View style={styles.preview}>
          <CategoryPreview
            name={form.draft.name}
            color={form.draft.color}
            icon={form.draft.icon}
            onNameChange={form.setName}
          />
          {message ? (
            <Text accessibilityRole="alert" tone="negative" style={styles.error}>
              {message}
            </Text>
          ) : null}
        </View>
      </View>
      <CategoryStylePad
        kind={form.draft.kind}
        color={form.draft.color}
        icon={form.draft.icon}
        onColorChange={form.selectColor}
        onIconChange={form.selectIcon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  preview: {
    flex: 1,
    gap: space[2],
    justifyContent: "center",
  },
  error: {
    paddingHorizontal: layout.screenGutter,
    textAlign: "center",
  },
});
