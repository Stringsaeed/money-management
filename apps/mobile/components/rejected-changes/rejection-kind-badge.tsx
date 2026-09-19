import { StyleSheet } from "react-native";

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { colors, typography } from "@/lib/design-tokens";
import type { RejectionKind } from "@/modules/powersync/rejection";

const KIND_PRESENTATION = {
  stale_version: { emoji: "⚠️", label: "Out of date" },
  invalid_intent: { emoji: "🚫", label: "Invalid values" },
  preview_required: { emoji: "👀", label: "Needs review" },
  missing_entity: { emoji: "🔍", label: "Missing record" },
  forbidden: { emoji: "🔒", label: "Not allowed" },
  conflict: { emoji: "⚡", label: "Conflict" },
} satisfies Record<RejectionKind, { emoji: string; label: string }>;

interface RejectionKindBadgeProps {
  kind: RejectionKind;
}

/** Small colored chip naming the rejection type at a glance. */
export function RejectionKindBadge({ kind }: RejectionKindBadgeProps) {
  const presentation = KIND_PRESENTATION[kind] ?? KIND_PRESENTATION.conflict;
  return (
    <Badge variant="outline" style={styles.badge}>
      <Text style={styles.emoji}>{presentation.emoji}</Text>
      <Text style={styles.label}>{presentation.label}</Text>
    </Badge>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
  },
  emoji: {
    fontSize: typography.textXs,
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
  },
});
