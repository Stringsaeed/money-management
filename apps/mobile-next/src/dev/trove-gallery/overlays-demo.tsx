import { useState } from "react";

import { Button, Dialog, showToast } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { GalleryRow } from "./gallery-row";

export function OverlaysDemo() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const confirmDelete = () => {
    setDialogOpen(false);
    showToast({ message: "Category deleted" });
  };

  return (
    <GalleryGroup label="DIALOG + TOAST">
      <GalleryRow>
        <Button label="Delete category" onPress={() => setDialogOpen(true)} variant="delete" />
        <Button
          label="Show toast"
          onPress={() => showToast({ message: "Transaction saved" })}
          variant="secondary"
        />
        <Button
          label="Toast with Undo"
          onPress={() =>
            showToast({
              actionLabel: "Undo",
              message: "Transaction deleted",
              onAction: () => showToast({ message: "Restored" }),
            })
          }
          variant="secondary"
        />
      </GalleryRow>
      <Dialog
        confirmLabel="Delete"
        destructive
        message="Transactions in it become uncategorised. This cannot be undone."
        onCancel={() => setDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Dining out category?"
        visible={dialogOpen}
      />
    </GalleryGroup>
  );
}
