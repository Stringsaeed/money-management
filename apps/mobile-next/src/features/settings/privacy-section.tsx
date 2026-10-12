import { SettingsRow, SettingsSection } from "@/ui/trove";

/** Privacy on the board: app lock and hidden balances, not built yet. */
export function PrivacySection() {
  return (
    <SettingsSection title="Privacy">
      <SettingsRow icon="lock" soon title="Lock with Face ID" />
      <SettingsRow icon="eye-off" soon title="Hide balances on open" />
    </SettingsSection>
  );
}
