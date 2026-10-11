import { StyleSheet } from "react-native";

import { spacing } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

interface SetupStatusProps {
  readonly loading?: string;
  readonly error?: { readonly title: string; readonly onRetry: () => void };
}

/** Full-screen loading or retry state for a setup step that is waiting on the server. */
export function SetupStatus({ loading, error }: SetupStatusProps) {
  return (
    <Screen edges={["bottom"]}>
      {error ? (
        <EmptyState
          title={error.title}
          message="Check your connection and try again."
          onRetry={error.onRetry}
        />
      ) : (
        <Text variant="caption" style={styles.loading}>
          {loading}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { padding: spacing[5] },
});
