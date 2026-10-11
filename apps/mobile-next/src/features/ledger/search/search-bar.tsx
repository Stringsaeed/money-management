import { Pressable, StyleSheet, Text as NativeText, TextInput, View } from "react-native";

import { colors, fonts, Icon, layout, motion, radius } from "@/ui/trove";

interface SearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onCancel: () => void;
}

/** The board's 48pt pill sits inside a 2pt focus ring; the ring is a border here. */
const RING = 2;
const PAD_START = 16 - RING;
const PAD_END = 8 - RING;
const CLEAR_SIZE = 32;

/** Focused search pill with its clear disc, and Cancel to leave search. */
export function SearchBar({ value, onChange, onCancel }: SearchBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <Icon color={colors.text.secondary} name="search" size={20} />
        <TextInput
          accessibilityLabel="Search the ledger"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          clearButtonMode="never"
          onChangeText={onChange}
          placeholder="Search notes"
          placeholderTextColor={colors.text.secondary}
          returnKeyType="search"
          selectionColor={colors.accent.fill}
          // The typed query is bold; the placeholder stays regular.
          style={[styles.input, value ? styles.inputFilled : null]}
          value={value}
        />
        {value ? (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            hitSlop={motion.hitSlop}
            onPress={() => onChange("")}
            style={styles.clear}
          >
            <Icon name="close" size={14} strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        hitSlop={motion.hitSlop}
        onPress={onCancel}
        style={styles.cancel}
      >
        <NativeText style={styles.cancelLabel}>Cancel</NativeText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: 10 },
  pill: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderColor: colors.accent.fill,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: RING,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    height: 48,
    paddingLeft: PAD_START,
    paddingRight: PAD_END,
  },
  input: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 17,
    height: "100%",
    minWidth: 0,
    paddingVertical: 0,
  },
  inputFilled: { fontFamily: fonts.bold },
  clear: {
    alignItems: "center",
    backgroundColor: colors.border.default,
    borderRadius: radius.full,
    height: CLEAR_SIZE,
    justifyContent: "center",
    width: CLEAR_SIZE,
  },
  cancel: { height: layout.minTouchTarget, justifyContent: "center", paddingHorizontal: 4 },
  cancelLabel: {
    color: colors.accent.text,
    fontFamily: fonts.extrabold,
    fontSize: 16,
    lineHeight: 22,
  },
});
