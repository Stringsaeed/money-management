import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet } from "react-native";

import { useEraseLocalData } from "@/components/settings/use-erase-local-data";
import { Text } from "@/components/ui/text";
import { ONBOARDING_ENABLED } from "@/constants/onboarding";
import { colors, spacing, typography } from "@/lib/design-tokens";

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
              router.replace(ONBOARDING_ENABLED ? "/onboarding" : "/");
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
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
    >
      <Text style={styles.title}>{erasing ? "Erasing…" : "Erase local data from this device"}</Text>
      <Text style={styles.subtitle}>
        {unavailable
          ? erase.reason
          : "Permanently delete accounts, categories, and transactions on this device"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    alignItems: "center",
  },
  containerPressed: {
    opacity: 0.7,
  },
  title: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.destructive,
  },
  subtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
    marginTop: spacing[0.5],
  },
});
