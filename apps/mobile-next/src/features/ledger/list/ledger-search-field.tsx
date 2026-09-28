import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Icon } from "@/ui/icon";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";

interface LedgerSearchFieldProps {
  readonly value: string;
  readonly onSubmit: (value: string) => void;
  readonly placeholder?: string;
}

/**
 * Search typed locally and sent on submit, so the server is queried once per search rather
 * than on every keystroke. Clearing applies immediately.
 */
export function LedgerSearchField({
  value,
  onSubmit,
  placeholder = "Search notes",
}: LedgerSearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const [applied, setApplied] = useState(value);
  // Follow external changes, e.g. the search chip being removed.
  if (value !== applied) {
    setApplied(value);
    setDraft(value);
  }
  return (
    <View style={styles.field}>
      <Icon name="magnifying-glass" size={18} color={colors.mutedForeground} />
      <TextInput
        accessibilityLabel="Search transactions"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setDraft}
        onSubmitEditing={() => onSubmit(draft.trim())}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="search"
        style={styles.input}
        value={draft}
      />
      {draft ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
          onPress={() => {
            setDraft("");
            onSubmit("");
          }}
        >
          <Icon name="x" size={16} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.full,
    flex: 1,
    flexDirection: "row",
    gap: spacing[2],
    height: spacing[11],
    paddingHorizontal: spacing[4],
  },
  input: {
    color: colors.foreground,
    flex: 1,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    height: "100%",
  },
});
