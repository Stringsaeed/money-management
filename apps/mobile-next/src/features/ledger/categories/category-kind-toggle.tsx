import type { CategoryInput } from "@/data/ledger-client";

import { BreadcrumbSegment } from "../transactions/breadcrumb-segment";

interface CategoryKindToggleProps {
  readonly kind: CategoryInput["kind"];
  readonly onChange: (kind: CategoryInput["kind"]) => void;
}

/** Expense / income switch drawn as breadcrumb segments so it sits in the editor's pill bar. */
export function CategoryKindToggle({ kind, onChange }: CategoryKindToggleProps) {
  return (
    <>
      <BreadcrumbSegment
        accessibilityLabel="Expense category"
        emoji="💸"
        label="Expense"
        selected={kind === "expense"}
        onPress={() => onChange("expense")}
      />
      <BreadcrumbSegment
        accessibilityLabel="Income category"
        emoji="💰"
        label="Income"
        selected={kind === "income"}
        onPress={() => onChange("income")}
      />
    </>
  );
}
