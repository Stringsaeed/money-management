import { EmptyState, Text } from "@/ui/trove";

import { SetupStepScreen } from "./setup-step-screen";
import type { SetupStep } from "./setup-types";

interface SetupStatusProps {
  readonly step: SetupStep;
  readonly loading?: string;
  readonly error?: { readonly title: string; readonly onRetry: () => void };
}

/** Full-screen loading or retry state for a setup step that is waiting on the server. */
export function SetupStatus({ step, loading, error }: SetupStatusProps) {
  return (
    <SetupStepScreen step={step}>
      {error ? (
        <EmptyState
          title={error.title}
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={error.onRetry}
          framed={false}
        />
      ) : (
        <Text accessibilityLiveRegion="polite" tone="secondary" variant="bodySm">
          {loading}
        </Text>
      )}
    </SetupStepScreen>
  );
}
