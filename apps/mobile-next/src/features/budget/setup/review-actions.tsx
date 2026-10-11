import { router } from "expo-router";

import { Banner, Button } from "@/ui/trove";

interface ReviewActionsProps {
  readonly pending: boolean;
  readonly error: string | null;
  readonly blocked: boolean;
  readonly onStart: () => void;
}

/** Start budget (Retry after a failure) and Edit amounts. Disabled while a request is in flight. */
export function ReviewActions({ pending, error, blocked, onStart }: ReviewActionsProps) {
  return (
    <>
      {error ? <Banner message={error} tone="negative" /> : null}
      <Button
        fullWidth
        label={error ? "Retry" : "Start budget"}
        loading={pending}
        disabled={blocked}
        onPress={onStart}
      />
      <Button
        fullWidth
        label="Edit amounts"
        variant="tertiary"
        disabled={pending}
        onPress={() => router.back()}
      />
    </>
  );
}
