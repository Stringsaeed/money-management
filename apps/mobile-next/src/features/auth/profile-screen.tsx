import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Button, Screen, Surface, Text } from "@/ui";
import { colors } from "@/ui/design-tokens";
import { useLedgerScope } from "@/navigation/ledger-scope-context";

import { useSession } from "./use-session";
import { profileIdentity } from "./profile-utils";

export function ProfileScreen() {
  const session = useSession();
  const { scope, selectScope } = useLedgerScope();
  const [busy, setBusy] = useState(false);
  const { isGuest, user, description } = profileIdentity(session.status, session.principal);
  const signOut = () => {
    const endSession = () => {
      setBusy(true);
      void session
        .signOut()
        .catch(() =>
          Alert.alert(
            "Could not finish signing out",
            "Reopen the app to check your session and try again.",
          ),
        )
        .finally(() => setBusy(false));
    };
    if (!isGuest) {
      endSession();
      return;
    }
    Alert.alert(
      "End this guest session?",
      "You will lose access to this guest ledger. Save it to an account first if you want to keep it.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End session", style: "destructive", onPress: endSession },
      ],
    );
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text variant="headline">Profile</Text>
        <Text variant="body" style={styles.copy}>
          {description}
        </Text>
      </View>
      <Surface variant="raised" style={styles.card}>
        {isGuest ? (
          <Button
            title="Save guest ledger to account"
            loading={busy}
            onPress={() => {
              setBusy(true);
              void session.saveGuestToAccount().finally(() => setBusy(false));
            }}
          />
        ) : null}
        {user ? (
          <Button title="Household" variant="secondary" onPress={() => router.push("/household")} />
        ) : null}
        {scope.kind === "household" ? (
          <Button
            title="Use personal ledger"
            variant="secondary"
            onPress={() => selectScope({ kind: "personal" })}
          />
        ) : null}
        <Button
          title={isGuest ? "End guest session" : "Sign out"}
          variant="ghost"
          onPress={signOut}
          disabled={busy}
        />
        {session.error ? <Text style={styles.error}>{session.error}</Text> : null}
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "space-between", padding: 24 },
  header: { gap: 12, paddingTop: 24 },
  copy: { color: colors.mutedForeground },
  card: { gap: 12, marginBottom: 12 },
  error: { color: colors.destructive },
});
