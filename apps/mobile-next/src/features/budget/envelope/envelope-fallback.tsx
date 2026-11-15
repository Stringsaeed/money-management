import { EmptyState, Text } from "@/ui/trove";

import { BudgetLoadError } from "../budget-load-error";

interface EnvelopeFallbackProps {
  readonly failed: boolean;
  /** Something was loaded before the failure. */
  readonly stale: boolean;
  readonly loaded: boolean;
  readonly onRetry: () => void;
}

/** In place of the envelope: the budget failed to load, is loading, or has no such envelope. */
export function EnvelopeFallback({ failed, stale, loaded, onRetry }: EnvelopeFallbackProps) {
  if (failed) return <BudgetLoadError stale={stale} onRetry={onRetry} />;
  if (!loaded)
    return (
      <Text tone="secondary" variant="bodySm">
        Loading envelope…
      </Text>
    );
  return (
    <EmptyState title="Envelope not found" message="It may have been archived." framed={false} />
  );
}
