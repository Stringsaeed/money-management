import type { CategoryInput } from "@/data/ledger-client";
import { Breadcrumb, type BreadcrumbSegmentSpec } from "@/ui/trove";

type CategoryKind = CategoryInput["kind"];

const KINDS = [
  { kind: "expense", emoji: "💸", label: "Expense" },
  { kind: "income", emoji: "💰", label: "Income" },
] as const satisfies readonly { kind: CategoryKind; emoji: string; label: string }[];

interface CategoryKindToggleProps {
  readonly kind: CategoryKind;
  readonly onChange: (kind: CategoryKind) => void;
}

/** Expense / income switch for the category editor. */
export function CategoryKindToggle({ kind, onChange }: CategoryKindToggleProps) {
  const segments: readonly BreadcrumbSegmentSpec[] = KINDS.map((option) => ({
    key: option.kind,
    emoji: option.emoji,
    label: option.label,
    state: option.kind === kind ? "active" : "set",
    onPress: () => onChange(option.kind),
  }));

  return <Breadcrumb accessibilityLabel="Category kind" segments={segments} variant="toggle" />;
}
