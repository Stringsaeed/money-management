import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useLedgerScope } from "@/navigation/ledger-scope-context";
import { Banner, Button, SettingsRow, SettingsSection, space } from "@/ui/trove";

import { useSessionActions } from "./use-session-actions";

/** Account: who is signed in, the household, and leaving the session. */
export function AccountSection() {
  const { user, isGuest, description, busy, error, signOut, saveGuest } = useSessionActions();
  const { scope, selectScope } = useLedgerScope();

  return (
    <View style={styles.root}>
      {isGuest ? (
        <Button fullWidth label="Save guest ledger to account" loading={busy} onPress={saveGuest} />
      ) : null}
      <SettingsSection footer={description} title="Account">
        {user ? (
          <SettingsRow
            chevron
            icon="scope-household"
            onPress={() => router.push("/household")}
            title="Household"
          />
        ) : null}
        {scope.kind === "household" ? (
          <SettingsRow
            icon="scope-personal"
            onPress={() => selectScope({ kind: "personal" })}
            title="Use personal ledger"
          />
        ) : null}
        <SettingsRow
          destructive
          icon="sign-out"
          onPress={busy ? undefined : signOut}
          title={isGuest ? "End guest session" : "Sign out"}
        />
      </SettingsSection>
      {error ? <Banner message={error} tone="negative" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({ root: { gap: space[4] } });
