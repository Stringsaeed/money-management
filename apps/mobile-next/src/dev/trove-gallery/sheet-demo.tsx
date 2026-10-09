import { useState } from "react";

import { Button } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { MoveMoneySheet } from "./move-money-sheet";

export function SheetDemo() {
  const [open, setOpen] = useState(false);

  return (
    <GalleryGroup label="SHEET">
      <Button label="Open Move money sheet" onPress={() => setOpen(true)} variant="secondary" />
      <MoveMoneySheet onDismiss={() => setOpen(false)} open={open} />
    </GalleryGroup>
  );
}
