import { ScrollView, StyleSheet, View } from "react-native";

import { useLedgerScope } from "@/navigation/ledger-scope-context";
import { Banner, EmptyState, Header, layout, Screen, space, Text } from "@/ui/trove";

import { useSession } from "../auth/use-session";
import { HouseholdCreateCard } from "./household-create-card";
import { HouseholdDetails } from "./household-details";
import { HouseholdLoading } from "./household-loading";
import { useHousehold } from "./use-household";

export interface HouseholdScreenProps {
  readonly onBack?: () => void;
}

export function HouseholdScreen({ onBack }: HouseholdScreenProps) {
  const session = useSession();
  const { scope, selectScope } = useLedgerScope();
  const state = useHousehold(session.status === "signed_in");

  if (session.status !== "signed_in") {
    return (
      <Screen style={styles.screen}>
        <Header variant="compact" title="Household" onBack={onBack} />
        <EmptyState
          title="Sign in to share"
          message="Households are available after WorkOS sign-in."
        />
      </Screen>
    );
  }

  if (state.loading) {
    return (
      <Screen style={styles.screen}>
        <Header variant="compact" title="Household" onBack={onBack} />
        <HouseholdLoading />
      </Screen>
    );
  }

  const userId = session.principal?.kind === "user" ? session.principal.userId : null;

  return (
    <Screen style={styles.screen}>
      <Header variant="compact" title="Household" onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text tone="secondary" variant="bodyMd">
            Share one ledger with people you trust.
          </Text>
        </View>

        {state.household ? (
          <HouseholdDetails
            household={state.household}
            onSelectScope={selectScope}
            scope={scope}
            state={state}
            userId={userId}
          />
        ) : (
          <HouseholdCreateCard busy={state.busy} onCreate={state.create} />
        )}

        {state.notice ? <Banner message={state.notice} tone="positive" /> : null}
        {state.error ? <Banner message={state.error} tone="negative" /> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: layout.screenGutter },
  content: { gap: space[4], paddingBottom: space[8], paddingTop: space[3] },
  header: { gap: space[2] },
});
