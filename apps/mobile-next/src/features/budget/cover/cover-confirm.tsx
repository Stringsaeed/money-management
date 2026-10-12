import { FlowButton } from "@/ui/trove";

import { codeAmount } from "../envelope/envelope-figures";

interface CoverConfirmProps {
  /** Some source has money to give. */
  readonly hasSources: boolean;
  readonly coveredMinor: number;
  readonly currency: string;
  readonly busy: boolean;
  readonly onMove: () => void;
  readonly onDone: () => void;
}

/** The sheet's 54pt call to action: Move AED 175, or Not now when nothing can give. */
export function CoverConfirm({
  hasSources,
  coveredMinor,
  currency,
  busy,
  onMove,
  onDone,
}: CoverConfirmProps) {
  if (!hasSources) return <FlowButton label="Not now" size="cta" tone="outline" onPress={onDone} />;
  return (
    <FlowButton
      disabled={coveredMinor === 0}
      label={coveredMinor > 0 ? `Move ${codeAmount(coveredMinor, currency)}` : "Move"}
      loading={busy}
      size="cta"
      onPress={onMove}
    />
  );
}
