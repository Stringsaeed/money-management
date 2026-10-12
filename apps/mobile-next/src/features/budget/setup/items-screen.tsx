import { router } from "expo-router";
import { useState } from "react";

import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { track } from "@/features/analytics";
import { ActionBar } from "@/ui/trove";

import { ItemGroup } from "./item-group";
import { itemEmoji } from "./setup-emoji";
import { isItemTicked, resolveItemKey } from "./setup-items";
import { setupHref } from "./setup-routes";
import { SetupRestart } from "./setup-restart";
import { SetupStatus } from "./setup-status";
import { SetupStepScreen } from "./setup-step-screen";
import { GROUP_ORDER } from "./setup-types";
import { StepTitle } from "./step-title";
import { useSetupModel } from "./use-setup-model";

/** S3: what the money is for, as tick chips in three groups. Each ticked one becomes an envelope. */
export function ItemsScreen() {
  const { target, needsPayday, draft, setup, facts, categories, items, ticked } = useSetupModel();
  const [adding, setAdding] = useState<V2EnvelopeGroup | null>(null);

  if (needsPayday) return <SetupRestart step="items" target={target} />;
  if (facts.isError && !facts.data) {
    return (
      <SetupStatus
        step="items"
        error={{ title: "Couldn't load your suggestions", onRetry: () => void facts.retry() }}
      />
    );
  }
  if (!facts.data) return <SetupStatus step="items" loading="Finding what you spend on…" />;

  const add = (name: string, group: V2EnvelopeGroup) => {
    const { key } = resolveItemKey(name, categories.data);
    const exists = items.some((item) => item.key === key);
    setup.update({
      selection: { ...draft.selection, [key]: true },
      ...(!exists && { custom: [...draft.custom, { name, group }] }),
    });
    setAdding(null);
  };

  return (
    <SetupStepScreen
      step="items"
      footer={
        <ActionBar
          summary={{ label: "ENVELOPES", value: `${ticked.length} ticked` }}
          primary={{
            label: "Next",
            disabled: ticked.length === 0,
            accessibilityHint: ticked.length === 0 ? "Tick at least one to continue" : undefined,
            onPress: () => {
              setup.update({ step: "amounts" });
              track("budget_setup_step_completed", { step: "items" });
              router.push(setupHref("amounts", target));
            },
          }}
        />
      }
    >
      <StepTitle
        title="What's your money for?"
        intro="We ticked what you already pay. Each one becomes an envelope."
      />
      {GROUP_ORDER.map((group) => (
        <ItemGroup
          key={group}
          group={group}
          chips={items
            .filter((item) => item.group === group)
            .map((item) => ({
              key: item.key,
              name: item.name,
              emoji: itemEmoji(item, categories.data),
              ticked: isItemTicked(item, draft.selection),
            }))}
          onToggle={(key, isTicked) =>
            setup.update({ selection: { ...draft.selection, [key]: isTicked } })
          }
          adding={adding === group}
          onAddOpen={() => setAdding(group)}
          onAddClose={() => setAdding(null)}
          onAdd={(name) => add(name, group)}
        />
      ))}
    </SetupStepScreen>
  );
}
