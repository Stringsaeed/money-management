import { useState } from "react";

import { AmountInput, Button, Sheet, showToast, Text } from "@/ui/trove";

import { GALLERY_CURRENCY, QUICK_PICKS } from "./sample-data";

interface MoveMoneySheetProps {
  open: boolean;
  onDismiss: () => void;
}

export function MoveMoneySheet({ open, onDismiss }: MoveMoneySheetProps) {
  const [amount, setAmount] = useState("");

  const confirm = () => {
    onDismiss();
    showToast({ message: "Moved to Emergency fund" });
  };

  return (
    <Sheet onDismiss={onDismiss} open={open} title="Move money">
      <Text tone="secondary" variant="bodyMd">
        From Everyday to Emergency fund
      </Text>
      <AmountInput
        currency={GALLERY_CURRENCY}
        label="Amount"
        onChangeText={setAmount}
        quickPicks={QUICK_PICKS}
        value={amount}
      />
      <Button disabled={amount === ""} fullWidth label="Move money" onPress={confirm} size="lg" />
    </Sheet>
  );
}
