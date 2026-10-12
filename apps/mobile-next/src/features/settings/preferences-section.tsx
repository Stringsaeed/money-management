import { SettingsRow, SettingsSection } from "@/ui/trove";

/** Preferences on the board that are not built yet. */
export function PreferencesSection() {
  return (
    <SettingsSection title="Preferences">
      <SettingsRow icon="moon" soon title="Appearance" />
      <SettingsRow icon="calendar" soon title="Month starts on" />
      <SettingsRow icon="globe" soon title="Language" />
    </SettingsSection>
  );
}
