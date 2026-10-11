import { useState } from "react";

import { ListGroup, ListRow, Sheet } from "@/ui/trove";

interface TransactionOptionSheetProps {
  readonly label: string;
  readonly value?: string;
  readonly options: readonly { id: string; label: string }[];
  readonly onChange: (id: string) => void;
}

export function TransactionOptionSheet({
  label,
  value,
  options,
  onChange,
}: TransactionOptionSheetProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListGroup dividerInset={0}>
        <ListRow chevron onPress={() => setOpen(true)} title={label} value={value} />
      </ListGroup>
      <Sheet open={open} onDismiss={() => setOpen(false)} title={label}>
        <ListGroup dividerInset={0}>
          {options.map((option) => (
            <ListRow
              key={option.id}
              onPress={() => {
                onChange(option.id);
                setOpen(false);
              }}
              title={option.label}
            />
          ))}
        </ListGroup>
      </Sheet>
    </>
  );
}
