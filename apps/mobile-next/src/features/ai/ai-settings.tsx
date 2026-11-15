import { SettingsRow, SettingsSection, Switch } from "@/ui/trove";

import { updateAiPreferences } from "./ai-store";
import { useAiPreferences } from "./use-ai-preferences";

/** Settings section: let AI pick a category from a new transaction's note. */
export function AiSettings() {
  const { autoCategorize } = useAiPreferences();

  return (
    <SettingsSection
      footer="AI picks a category from a new transaction's note, like Breadfast → Groceries. Only the note, its currency, and your category names are sent. Never amounts, balances, accounts, or who you are. An unfamiliar name may be looked up on the web. AI runs in an isolated request on our server, can't see the rest of your ledger, and your data is never used to train AI."
      title="Smart features"
    >
      <SettingsRow
        icon="sparkle"
        title="Smart categories"
        trailing={
          <Switch
            accessibilityLabel="Smart categories"
            value={autoCategorize}
            onValueChange={(next) => updateAiPreferences({ autoCategorize: next })}
          />
        }
      />
    </SettingsSection>
  );
}
