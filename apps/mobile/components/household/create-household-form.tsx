import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useCreateHousehold } from "@/hooks/use-households";
import { colors, spacing, typography } from "@/lib/design-tokens";

/** Names and creates a new shared household; the creator becomes its admin. */
export function CreateHouseholdForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState("");
  const createHousehold = useCreateHousehold();
  const trimmed = name.trim();
  const disabled = !trimmed || createHousehold.isPending;

  async function handleCreate() {
    if (!trimmed) return;
    try {
      await createHousehold.mutateAsync(trimmed);
      setName("");
      onCreated?.();
    } catch {
      // Error surfaced by the mutation's error state below.
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Start a shared space — family accounts, budgets, and reports in one place.
      </Text>
      <Input placeholder="Household name (e.g. The Saeeds)" value={name} onChangeText={setName} />
      <Button onPress={handleCreate} disabled={disabled} testID="create-household">
        <Text>{createHousehold.isPending ? "Creating…" : "🏠 Create household"}</Text>
      </Button>
      {createHousehold.isError ? (
        <Text style={styles.errorText}>
          Could not create the household. Check your connection and try again.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  description: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  errorText: {
    fontSize: typography.textXs,
    color: colors.destructive,
  },
});
