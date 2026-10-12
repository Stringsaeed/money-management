import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Banner, CtaStack, space } from "@/ui/trove";

interface ReviewActionsProps {
  readonly pending: boolean;
  readonly error: string | null;
  readonly blocked: boolean;
  readonly onStart: () => void;
}

/** Start budget (Retry after a failure) and Edit amounts. Edit waits while a request is in flight. */
export function ReviewActions({ pending, error, blocked, onStart }: ReviewActionsProps) {
  return (
    <View style={styles.actions}>
      {error ? <Banner message={error} tone="negative" /> : null}
      <CtaStack
        primary={{
          label: error ? "Retry" : "Start budget",
          loading: pending,
          disabled: blocked,
          onPress: onStart,
        }}
        link={{
          label: "Edit amounts",
          onPress: () => {
            if (!pending) router.back();
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: space[3], marginTop: space[1] },
});
