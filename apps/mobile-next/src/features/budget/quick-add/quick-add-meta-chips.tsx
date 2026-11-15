import { StyleSheet, View } from "react-native";

import type { V2Account, V2Category } from "@trove/api/v2/contracts";

import { space } from "@/ui/trove";

import { MetaChip } from "./meta-chip";
import { quickAddMetaCopy } from "./quick-add-meta-copy";
import type { QuickAddPanel } from "./quick-add-panel";

interface QuickAddMetaChipsProps {
  readonly account: V2Account | null;
  readonly date: string;
  readonly category: V2Category | null;
  readonly categoryCount: number;
  readonly note: string;
  readonly panel: QuickAddPanel | null;
  readonly onToggle: (panel: QuickAddPanel) => void;
}

/** Paid with · date · (category) · note: everything optional, one tap away. */
export function QuickAddMetaChips({ panel, onToggle, ...input }: QuickAddMetaChipsProps) {
  const copy = quickAddMetaCopy(input);
  return (
    <View style={styles.row}>
      <MetaChip
        {...copy.account}
        active={panel === "account"}
        onPress={() => onToggle("account")}
      />
      <MetaChip {...copy.date} active={panel === "date"} onPress={() => onToggle("date")} />
      {copy.category ? (
        <MetaChip
          {...copy.category}
          active={panel === "category"}
          onPress={() => onToggle("category")}
        />
      ) : null}
      <MetaChip {...copy.note} active={panel === "note"} grow onPress={() => onToggle("note")} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space[2] },
});
