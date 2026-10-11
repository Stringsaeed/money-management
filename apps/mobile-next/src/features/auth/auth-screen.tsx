import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Banner, Button, Card, layout, Screen, space, Text } from "@/ui/trove";

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
        <Text variant="titleLg">Your money, clearly.</Text>
        <Text style={styles.copy} tone="secondary" variant="bodyMd">
          Sign in to keep your ledger with your account, or start privately as a guest.
        </Text>
      </View>
      <Card style={styles.card}>
        <Button
          fullWidth
          label="Sign in with WorkOS"
          loading={busy || session.status === "loading"}
          onPress={() => void run(session.signIn)}
          size="lg"
        />
        <Button
          fullWidth
          label="Continue as guest"
          loading={busy || session.status === "loading"}
          onPress={() => void run(session.continueAsGuest)}
          size="lg"
          variant="secondary"
        />
        {session.error ? <Banner message={session.error} tone="negative" /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "space-between",
    padding: layout.screenGutter,
    paddingBottom: space[3],
  },
  header: { gap: space[3], paddingTop: space[10] },
  copy: { maxWidth: 320 },
  card: { gap: space[3] },
});
