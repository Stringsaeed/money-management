import { EmptyState } from "@/ui/trove";

interface BudgetLoadErrorProps {
  /** Numbers were loaded before and a refresh failed: they may be out of date, so hide them. */
  readonly stale: boolean;
  readonly onRetry: () => void;
}

/** The budget could not be loaded or refreshed. Never shows a 0 or an old number as current. */
export function BudgetLoadError({ stale, onRetry }: BudgetLoadErrorProps) {
  return stale ? (
    <EmptyState
      title="Couldn't calculate"
      message="Your numbers are hidden until we can load them again."
      actionLabel="Retry"
      onAction={onRetry}
      framed={false}
    />
  ) : (
    <EmptyState
      title="Couldn't load your budget"
      message="Check your connection and try again."
      actionLabel="Try again"
      onAction={onRetry}
      framed={false}
    />
  );
}
