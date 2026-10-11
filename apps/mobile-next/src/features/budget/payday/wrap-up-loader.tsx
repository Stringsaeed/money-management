import { router } from "expo-router";
import { StyleSheet } from "react-native";

import { EmptyState, layout, Screen, space, Text } from "@/ui/trove";

import type { ActiveBudgetView } from "../home/home-model";
import { SetupHeader } from "../setup/setup-header";

import { nextPaydayStep, paydayFlowFacts } from "./payday-flow";
import { useWrapUp } from "./use-wrap-up";
import { WrapUpContent } from "./wrap-up-content";

/** Loads the period that just ended; it can be skipped when it can't be read. */
export function WrapUpLoader({ view }: { readonly view: ActiveBudgetView }) {
  const wrapUp = useWrapUp(view);
  if (wrapUp.status === "ready") return <WrapUpContent view={view} wrapUp={wrapUp} />;
  return (
    <Screen>
      <SetupHeader title="Month wrap-up" />
      {wrapUp.status === "loading" ? (
        <Text style={styles.status} tone="secondary" variant="bodySm">
          Loading last month…
        </Text>
      ) : (
        <EmptyState
          title="Couldn't load last month"
          message="Nothing is lost. You can skip the wrap-up and plan your new month."
          actionLabel="Skip"
          onAction={() => router.replace(nextPaydayStep("wrapUp", paydayFlowFacts(view)))}
          framed={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { padding: layout.screenGutter, paddingTop: space[5] },
});
