import { StyleSheet, View } from "react-native";

import type { CategoryInput } from "@/data/ledger-client";
import { layout, SegmentedControl, space, type SegmentOption } from "@/ui/trove";

type CategoryKind = CategoryInput["kind"];

const OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
] as const satisfies readonly SegmentOption<CategoryKind>[];

interface CategoryKindToggleProps {
  readonly kind: CategoryKind;
  readonly onChange: (kind: CategoryKind) => void;
}

/** Expense / income switch for the category editor. */
export function CategoryKindToggle({ kind, onChange }: CategoryKindToggleProps) {
  return (
    <View style={styles.wrapper}>
      <SegmentedControl
        accessibilityLabel="Category kind"
        options={OPTIONS}
        value={kind}
        onChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: layout.screenGutter, paddingTop: space[1] },
});
