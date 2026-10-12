import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AiSettings } from "@/features/ai";
import { AnalyticsSettings } from "@/features/analytics";
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

export interface ProfileScreenProps {
  onBack: () => void;
}

/** Settings, pushed from the ledger sheet. */
export function ProfileScreen({ onBack }: ProfileScreenProps) {
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
      <Header onBack={onBack} title="Settings" variant="compact" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text tone="secondary" variant="bodyMd">
          {description}
        </Text>
        <SoundSettings />
        <AiSettings />
        <AnalyticsSettings />
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
  screen: { paddingHorizontal: layout.screenGutter },
  content: { gap: space[6], paddingBottom: space[8], paddingTop: space[3] },
  actions: { gap: space[4] },
});
