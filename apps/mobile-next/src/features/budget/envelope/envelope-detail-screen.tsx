import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useBudgetQuery } from "@/data/ledger-queries";
import { layout, Screen, space } from "@/ui/trove";

import { envelopeLines } from "../home/home-model";

import { EnvelopeDetail } from "./envelope-detail";
import { EnvelopeFallback } from "./envelope-fallback";
import { EnvelopeHeader } from "./envelope-header";

const back = () => router.back();

/** M4 entry: load the budget, then show the envelope or say why it can't be shown. */
export function EnvelopeDetailScreen({ id }: { readonly id: string }) {
  const budget = useBudgetQuery();
  const view = budget.data?.budget ? budget.data : null;
  const line = view ? envelopeLines(view).find((item) => item.envelope.id === id) : null;

  if (view && line && !budget.isError) return <EnvelopeDetail view={view} line={line} />;

  return (
    <Screen edges={["top", "bottom"]} style={styles.screen}>
      <EnvelopeHeader title={line?.envelope.name ?? "Envelope"} onBack={back} />
      <View style={styles.body}>
        <EnvelopeFallback
          failed={budget.isError}
          loaded={budget.data !== undefined}
          stale={budget.data !== undefined}
          onRetry={() => void budget.retry()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 9 },
  body: { paddingHorizontal: layout.screenGutter, paddingVertical: space[5] },
});
