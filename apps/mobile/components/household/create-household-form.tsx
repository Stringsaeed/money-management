import { useState } from "react";
import { TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import { useCreateHousehold } from "@/hooks/use-households";

/** Names and creates a new shared household; the creator becomes its owner. */
export function CreateHouseholdForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState("");
  const createHousehold = useCreateHousehold();

  async function handleCreate() {
    const trimmed = name.trim();
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
      <TextInput
        placeholder="Household name (e.g. The Saeeds)"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#9a9896"
        className="border border-input rounded-[10px] p-3.5 text-base leading-5 text-foreground"
        style={inputTextStyle}
      />
      <Button onPress={handleCreate} disabled={!name.trim() || createHousehold.isPending}>
        <Text className="font-body-semibold text-white">
          {createHousehold.isPending ? "Creating…" : "🏠 Create household"}
        </Text>
      </Button>
      {createHousehold.isError ? (
        <Text className="text-destructive text-xs">
          Could not create the household. Check your connection and try again.
        </Text>
      ) : null}
    </View>
  );
}
