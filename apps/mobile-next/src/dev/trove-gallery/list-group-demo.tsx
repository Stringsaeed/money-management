import { useState } from "react";

import { ListGroup, ListRow, Switch } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { noop } from "./utils";

export function ListGroupDemo() {
  const [notifications, setNotifications] = useState(true);

  return (
    <GalleryGroup label="LIST GROUP + LIST ROWS">
      <ListGroup footer="Changes sync to all of your devices." header="Preferences">
        <ListRow chevron icon="bank" onPress={noop} title="Currency" value="USD" />
        <ListRow
          icon="bell"
          subtitle="Budget alerts and weekly digest"
          title="Notifications"
          trailing={
            <Switch
              accessibilityLabel="Notifications"
              onValueChange={setNotifications}
              value={notifications}
            />
          }
        />
        <ListRow chevron icon="calendar" onPress={noop} title="First day of week" />
        <ListRow destructive icon="lock" onPress={noop} title="Sign out" />
      </ListGroup>
    </GalleryGroup>
  );
}
