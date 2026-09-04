import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable } from "react-native";

import { useEraseLocalData } from "@/components/settings/use-erase-local-data";
import { Text } from "@/components/ui/text";

export function EraseLocalDataControl() {
  const erase = useEraseLocalData();
  const [erasing, setErasing] = useState(false);
  const unavailable = erase.kind === "unavailable";

  function handleEraseAll() {
    if (erase.kind !== "available") return;
    const run = erase.run;
    Alert.alert(
      "Erase All Data",
      "This will permanently delete all accounts, categories, transactions, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase Everything",
          style: "destructive",
          onPress: async () => {
            setErasing(true);
            try {
              await run();
              router.replace("/onboarding");
            } catch {
              Alert.alert("Error", "Failed to erase data — please try again.");
            } finally {
              setErasing(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Pressable
      onPress={handleEraseAll}
      disabled={erasing || unavailable}
      className="px-4 py-3.5 items-center active:bg-destructive/10"
    >
      <Text className="font-body-semibold text-base text-destructive">
        {erasing ? "Erasing…" : "Erase local data from this device"}
      </Text>
      <Text className="font-body-normal text-xs text-ink/40 mt-0.5">
        {unavailable
          ? erase.reason
          : "Permanently delete accounts, categories, and transactions on this device"}
      </Text>
    </Pressable>
  );
}
