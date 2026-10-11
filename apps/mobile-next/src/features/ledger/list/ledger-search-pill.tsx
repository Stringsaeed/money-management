import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { colors, fonts, Icon, motion, radius } from "@/ui/trove";

import { useSearchDraft } from "./use-search-draft";

interface LedgerSearchPillProps {
  readonly value: string;
  readonly onSubmit: (value: string) => void;
}

/** The board's 48pt ringed pill; the ring is a border here, so the sides give up its point. */
const PAD_START = 15;
const PAD_END_CLEAR = 7;
const CLEAR_SIZE = 32;

/**
 * Ledger's search pill: notes are matched on the server when the search is submitted. While it
 * holds text a 32pt clear disc sits at its end.
 */
export function LedgerSearchPill({ value, onSubmit }: LedgerSearchPillProps) {
  const search = useSearchDraft(value, onSubmit);
  const filled = search.draft.length > 0;
  return (
    <View style={[styles.pill, filled ? styles.pillFilled : null]}>
      <Icon color={colors.text.secondary} name="search" size={20} />
      <TextInput
        accessibilityLabel="Search transactions"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        onChangeText={search.change}
        onSubmitEditing={search.submit}
        placeholder="Search notes"
        placeholderTextColor={colors.text.secondary}
        returnKeyType="search"
        selectionColor={colors.accent.fill}
        style={styles.input}
        value={search.draft}
      />
      {filled ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          hitSlop={motion.hitSlop}
          onPress={() => search.change("")}
          style={styles.clear}
        >
          <Icon name="close" size={14} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 48,
    paddingHorizontal: PAD_START,
  },
  pillFilled: { paddingRight: PAD_END_CLEAR },
  input: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 17,
    height: "100%",
    minWidth: 0,
    paddingVertical: 0,
  },
  clear: {
    alignItems: "center",
    backgroundColor: colors.border.default,
    borderRadius: radius.full,
    height: CLEAR_SIZE,
    justifyContent: "center",
    width: CLEAR_SIZE,
  },
});
