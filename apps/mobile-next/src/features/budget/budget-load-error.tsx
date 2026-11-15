import { SafeToSpendError } from "@/ui/trove";

interface BudgetLoadErrorProps {
  /** Numbers were loaded before and a refresh failed: they may be out of date, so hide them. */
  readonly stale: boolean;
  readonly onRetry: () => void;
}

/** The budget could not be loaded or refreshed. Never shows a 0 or an old number as current. */
export function BudgetLoadError({ stale, onRetry }: BudgetLoadErrorProps) {
  return stale ? (
    <SafeToSpendError
      message="Everything you logged is saved. We won't show a number until it's right."
      onRetry={onRetry}
      title="Couldn't calculate right now"
    />
  ) : (
    <SafeToSpendError
      label="BUDGET"
      message="Check your connection and try again."
      onRetry={onRetry}
      retryLabel="Try again"
      title="Couldn't load your budget"
    />
  );
}
