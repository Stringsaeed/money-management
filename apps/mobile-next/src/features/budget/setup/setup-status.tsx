import { StyleSheet } from "react-native";

import { EmptyState, layout, Screen, Text } from "@/ui/trove";

import { SetupHeader } from "./setup-header";

interface SetupStatusProps {
  readonly loading?: string;
  readonly error?: { readonly title: string; readonly onRetry: () => void };
}

/** Full-screen loading or retry state for a setup step that is waiting on the server. */
export function SetupStatus({ loading, error }: SetupStatusProps) {
  return (
    <Screen>
      <SetupHeader />
      {error ? (
        <EmptyState
          title={error.title}
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={error.onRetry}
          framed={false}
        />
      ) : (
        <Text style={styles.loading} tone="secondary" variant="bodySm">
          {loading}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { padding: layout.screenGutter },
});
