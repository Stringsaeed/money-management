import { useState } from "react";

import { Checkbox, Switch } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { noop } from "./utils";
import { ToggleRow } from "./toggle-row";

export function TogglesShowcase() {
  const [alerts, setAlerts] = useState(true);
  const [digest, setDigest] = useState(false);
  const [recurring, setRecurring] = useState(true);
  const [transfers, setTransfers] = useState(false);

  return (
    <>
      <GalleryGroup label="SWITCH · ON, OFF, DISABLED">
        <ToggleRow label="Budget alerts">
          <Switch accessibilityLabel="Budget alerts" onValueChange={setAlerts} value={alerts} />
        </ToggleRow>
        <ToggleRow label="Weekly digest">
          <Switch accessibilityLabel="Weekly digest" onValueChange={setDigest} value={digest} />
        </ToggleRow>
        <ToggleRow label="Locked setting">
          <Switch accessibilityLabel="Locked setting" disabled onValueChange={noop} value />
        </ToggleRow>
      </GalleryGroup>
      <GalleryGroup label="CHECKBOX · CHECKED, UNCHECKED, DISABLED">
        <Checkbox checked={recurring} label="Repeat every month" onCheckedChange={setRecurring} />
        <Checkbox checked={transfers} label="Include transfers" onCheckedChange={setTransfers} />
        <Checkbox checked disabled label="Required" onCheckedChange={noop} />
      </GalleryGroup>
    </>
  );
}
