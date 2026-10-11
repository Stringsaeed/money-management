import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AiSettings } from "@/features/ai";
import { SoundSettings } from "@/features/sound";
import { useLedgerScope } from "@/navigation/ledger-scope-context";
import {
  Banner,
  Button,
  Header,
  layout,
  ListGroup,
  ListRow,
  Screen,
  space,
  Text,
} from "@/ui/trove";

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
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Header title="Profile" />
          <Text tone="secondary" variant="bodyMd">
            {description}
          </Text>
        </View>
        <SoundSettings />
        <AiSettings />
        <View style={styles.actions}>
          {isGuest ? (
            <Button
              fullWidth
              label="Save guest ledger to account"
              loading={busy}
              onPress={() => {
                setBusy(true);
                void session.saveGuestToAccount().finally(() => setBusy(false));
              }}
            />
          ) : null}
          <ListGroup dividerInset={layout.cardPadding}>
            {user ? (
              <ListRow chevron onPress={() => router.push("/household")} title="Household" />
            ) : null}
            {scope.kind === "household" ? (
              <ListRow
                onPress={() => selectScope({ kind: "personal" })}
                title="Use personal ledger"
              />
            ) : null}
            <ListRow
              destructive
              onPress={busy ? undefined : signOut}
              title={isGuest ? "End guest session" : "Sign out"}
            />
          </ListGroup>
          {session.error ? <Banner message={session.error} tone="negative" /> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: space[6],
    paddingBottom: space[16] + space[8],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[3],
  },
  header: { gap: space[2] },
  actions: { gap: space[4] },
});
