import { useState } from "react";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { useCreateHousehold } from "@/hooks/use-households";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <View className="gap-3 px-4 py-4">
      <Text className="font-body-normal text-xs text-ink/40">
        Start a shared space — family accounts, budgets, and reports in one place.
      </Text>
      <Input placeholder="Household name (e.g. The Saeeds)" value={name} onChangeText={setName} />
      <Button onPress={handleCreate} disabled={disabled} testID="create-household">
        <Text>{createHousehold.isPending ? "Creating…" : "🏠 Create household"}</Text>
      </Button>
      {createHousehold.isError ? (
        <Text className="text-destructive text-xs">
          Could not create the household. Check your connection and try again.
        </Text>
      ) : null}
    </View>
  );
}
