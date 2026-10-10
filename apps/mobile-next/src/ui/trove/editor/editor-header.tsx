import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, layout, space } from "../tokens";
import { HeaderDisc } from "./header-disc";

export interface EditorHeaderProps {
  /** "New entry" or "Edit entry". */
  title: string;
  onClose: () => void;
  onSave: () => void;
  /** Invalid entries: the save disc turns neutral with text.disabled and ignores presses. */
  saveDisabled?: boolean;
  /** Edit state: shows the trash disc. Omit while creating. */
  onDelete?: () => void;
  closeLabel?: string;
  saveLabel?: string;
  deleteLabel?: string;
}

/**
 * Editor top bar: a large title on the left, then the optional trash disc, the close disc
 * and the save disc. New has close and save, Edit adds trash, Invalid disables save.
 */
export function EditorHeader({
  title,
  onClose,
  onSave,
  saveDisabled = false,
  onDelete,
  closeLabel = "Close",
  saveLabel = "Save",
  deleteLabel = "Delete entry",
}: EditorHeaderProps) {
  return (
    <View style={styles.bar}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={styles.title}
        variant="titleLg"
      >
        {title}
      </Text>
      {onDelete ? (
        <HeaderDisc
          accessibilityLabel={deleteLabel}
          icon="trash"
          onPress={onDelete}
          testID="editor-header-delete"
          tone="negative"
        />
      ) : null}
      <HeaderDisc
        accessibilityLabel={closeLabel}
        icon="close"
        onPress={onClose}
        testID="editor-header-close"
        tone="neutral"
      />
      <HeaderDisc
        accessibilityLabel={saveLabel}
        disabled={saveDisabled}
        icon="check"
        onPress={onSave}
        testID="editor-header-save"
        tone="accent"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[2],
    minHeight: layout.minTouchTarget,
  },
  title: {
    flex: 1,
  },
});
