import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button, Screen, Surface, Text } from "@/ui";
import { colors } from "@/ui/design-tokens";

import type { AuthActionResult } from "./auth-types";
import { useSession } from "./use-session";

export function AuthScreen() {
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<AuthActionResult>): Promise<void> => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text variant="headline">Your money, clearly.</Text>
        <Text variant="body" style={styles.copy}>
          Sign in to keep your ledger with your account, or start privately as a guest.
        </Text>
      </View>
      <Surface variant="raised" style={styles.card}>
        <Button
          title="Sign in with WorkOS"
          loading={busy || session.status === "loading"}
          onPress={() => void run(session.signIn)}
        />
        <Button
          title="Continue as guest"
          variant="secondary"
          loading={busy || session.status === "loading"}
          onPress={() => void run(session.continueAsGuest)}
        />
        {session.error ? <Text style={styles.error}>{session.error}</Text> : null}
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "space-between", padding: 24 },
  header: { gap: 12, paddingTop: 40 },
  copy: { color: colors.mutedForeground, maxWidth: 320 },
  card: { gap: 12, marginBottom: 12 },
  error: { color: colors.destructive },
});
