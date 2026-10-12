import { SettingsRow, SettingsSection } from "@/ui/trove";

/** Data on the board: export and erase, not built yet. */
export function DataSection() {
  return (
    <SettingsSection title="Data">
      <SettingsRow icon="export" soon title="Export as CSV" />
      <SettingsRow destructive icon="trash" soon title="Erase all data" />
    </SettingsSection>
  );
}
