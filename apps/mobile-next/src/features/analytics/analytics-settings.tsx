import { SettingsRow, SettingsSection, Switch } from "@/ui/trove";

import { setAnalyticsSharing } from "./analytics-store";
import { useAnalyticsSharing } from "./use-analytics-sharing";

/** Settings section: opt in or out of anonymous usage analytics. */
export function AnalyticsSettings() {
  const sharing = useAnalyticsSharing();

  return (
    <SettingsSection
      footer="Helps us improve budgeting. Never includes amounts, payees, notes, or account names."
      title="Analytics"
    >
      <SettingsRow
        icon="chart-bar"
        title="Share anonymous usage"
        trailing={
          <Switch
            accessibilityLabel="Share anonymous usage"
            value={sharing}
            onValueChange={setAnalyticsSharing}
          />
        }
      />
    </SettingsSection>
  );
}
