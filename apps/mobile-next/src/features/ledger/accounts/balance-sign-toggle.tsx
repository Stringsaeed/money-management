import { Breadcrumb, type BreadcrumbSegmentSpec } from "@/ui/trove";

interface BalanceSignToggleProps {
  readonly negative: boolean;
  readonly onChange: (negative: boolean) => void;
}

/** Flips an opening balance between money held and money owed (credit cards, loans). */
export function BalanceSignToggle({ negative, onChange }: BalanceSignToggleProps) {
  const segments: readonly BreadcrumbSegmentSpec[] = [
    {
      key: "held",
      emoji: "💰",
      label: "Money held",
      state: negative ? "set" : "active",
      onPress: () => onChange(false),
    },
    {
      key: "owed",
      emoji: "💸",
      label: "Money owed",
      state: negative ? "active" : "set",
      onPress: () => onChange(true),
    },
  ];

  return (
    <Breadcrumb
      accessibilityLabel="Opening balance is money held or money owed"
      segments={segments}
      variant="toggle"
    />
  );
}
