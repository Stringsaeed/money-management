import { router } from "expo-router";
import { StyleSheet } from "react-native";

import { Button } from "@/ui/button";
import { colors } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

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
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button
        title={error ? "Retry" : "Start budget"}
        loading={pending}
        disabled={blocked}
        onPress={onStart}
      />
      <Button
        title="Edit amounts"
        variant="ghost"
        disabled={pending}
        onPress={() => router.back()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.terracotta },
});
