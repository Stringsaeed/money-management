import { useState } from "react";
import { TextInput, View } from "react-native";

import { NativeHost, NativePrimaryButton } from "@/components/native-ui";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import { useCreateHousehold } from "@/hooks/use-households";
import { generateId } from "@/utils/id";

/** Names and creates a new shared household; the creator becomes its admin. */
export function CreateHouseholdForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState("");
  const [requestId, setRequestId] = useState(generateId);
  const createHousehold = useCreateHousehold();
  const trimmed = name.trim();
  const disabled = !trimmed || createHousehold.isPending;

  async function handleCreate() {
    if (!trimmed) return;
    try {
      await createHousehold.mutateAsync({ name: trimmed, requestId });
      setName("");
      setRequestId(generateId());
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
      <NativeHost>
        <NativePrimaryButton
          label={createHousehold.isPending ? "Creating…" : "🏠 Create household"}
          onPress={handleCreate}
          disabled={disabled}
          testID="create-household"
        />
      </NativeHost>
      {createHousehold.isError ? (
        <Text className="text-destructive text-xs">
          Could not create the household. Check your connection and try again.
        </Text>
      ) : null}
    </View>
  );
}
