import { Pressable, StyleSheet, View } from "react-native";

import type { V2TransactionKind } from "@trove/api/v2/contracts";

import { Text } from "@/ui/text";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";

import { KIND_LABELS } from "./ledger-filters";

interface KindSegmentsProps {
  readonly kinds: readonly V2TransactionKind[];
  readonly onChange: (kinds: V2TransactionKind[]) => void;
}

const SEGMENTS: readonly { readonly id: "all" | V2TransactionKind; readonly label: string }[] = [
  { id: "all", label: "All" },
  { id: "expense", label: KIND_LABELS.expense },
  { id: "income", label: KIND_LABELS.income },
  { id: "transfer", label: KIND_LABELS.transfer },
];

/** One-tap kind switch; a multi-kind selection from the sheet highlights none. */
export function KindSegments({ kinds, onChange }: KindSegmentsProps) {
  const selected = kinds.length === 0 ? "all" : kinds.length === 1 ? kinds[0] : null;
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {SEGMENTS.map((segment) => {
        const active = segment.id === selected;
        return (
          <Pressable
            key={segment.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(segment.id === "all" ? [] : [segment.id])}
            style={[styles.segment, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.full,
    flexDirection: "row",
    padding: 3,
  },
  segment: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii.full,
    flex: 1,
    height: spacing[8],
    justifyContent: "center",
  },
  active: { backgroundColor: colors.card, boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)" },
  label: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  activeLabel: { color: colors.foreground },
});
