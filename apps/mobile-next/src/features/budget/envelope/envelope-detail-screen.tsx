import { router } from "expo-router";
import { StyleSheet } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { EmptyState, Header, layout, Screen, space, Text } from "@/ui/trove";

import { envelopeLines } from "../home/home-model";

import { EnvelopeDetail } from "./envelope-detail";

/** M4 entry: load the budget, then show the envelope or say why it can't be shown. */
export function EnvelopeDetailScreen({ id }: { readonly id: string }) {
  const budget = useBudgetQuery();
  const view = budget.data?.budget ? budget.data : null;
  const line = view ? envelopeLines(view).find((item) => item.envelope.id === id) : null;
  const back = () => router.back();

  if (budget.isError && !line) {
    return (
      <Screen style={styles.screen}>
        <Header variant="compact" title="Envelope" onBack={back} />
        <EmptyState
          title="Couldn't calculate"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void budget.retry()}
          framed={false}
        />
      </Screen>
    );
  }
  if (!budget.data) {
    return (
      <Screen style={styles.screen}>
        <Header variant="compact" title="Envelope" onBack={back} />
        <Text style={styles.status} tone="secondary" variant="bodySm">
          Loading envelope…
        </Text>
      </Screen>
    );
  }
  if (!view || !line) {
    return (
      <Screen style={styles.screen}>
        <Header variant="compact" title="Envelope" onBack={back} />
        <EmptyState
          title="Envelope not found"
          message="It may have been archived."
          framed={false}
        />
      </Screen>
    );
  }
  return <EnvelopeDetail view={view} line={line} />;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: layout.screenGutter },
  status: { paddingVertical: space[5] },
});
