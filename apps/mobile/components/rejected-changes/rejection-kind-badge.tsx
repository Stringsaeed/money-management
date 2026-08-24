import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import type { RejectionKind } from "@/lib/sync/rejection";
import { cn } from "@/lib/utils";

const KIND_PRESENTATION: Record<RejectionKind, { emoji: string; label: string }> = {
  stale_version: { emoji: "⚠️", label: "Out of date" },
  invalid_intent: { emoji: "🚫", label: "Invalid values" },
  preview_required: { emoji: "👀", label: "Needs review" },
  missing_entity: { emoji: "🔍", label: "Missing record" },
  forbidden: { emoji: "🔒", label: "Not allowed" },
  conflict: { emoji: "⚡", label: "Conflict" },
};

interface RejectionKindBadgeProps {
  kind: RejectionKind;
}

/** Small colored chip naming the rejection type at a glance. */
export function RejectionKindBadge({ kind }: RejectionKindBadgeProps) {
  const presentation = KIND_PRESENTATION[kind] ?? KIND_PRESENTATION.conflict;
  return (
    <Badge variant="outline" className="border-ledger-outline bg-surface-container">
      <Text className="text-xs">{presentation.emoji}</Text>
      <Text className={cn("font-body-medium text-xs text-ink")}>{presentation.label}</Text>
    </Badge>
  );
}
