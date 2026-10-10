import { useState } from "react";

import type { AccountType } from "@/data/ledger-client";
import { CategoryTile, Icon, colors, ListGroup, ListRow, Sheet } from "@/ui/trove";

import { BreadcrumbSegment } from "../transactions/breadcrumb-segment";
import { ACCOUNT_TYPE_OPTIONS, accountTypeOption } from "./account-display";

interface AccountTypePickerProps {
  readonly type: AccountType;
  readonly onChange: (type: AccountType) => void;
}

export function AccountTypePicker({ type, onChange }: AccountTypePickerProps) {
  const [open, setOpen] = useState(false);
  const current = accountTypeOption(type);

  return (
    <>
      <BreadcrumbSegment
        accessibilityLabel={`Account type: ${current.label}`}
        emoji={current.emoji}
        label={current.label}
        onPress={() => setOpen(true)}
      />
      <Sheet open={open} onDismiss={() => setOpen(false)} title="Account type">
        <ListGroup>
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <ListRow
              key={option.type}
              leading={<CategoryTile icon={option.emoji} size="sm" />}
              title={option.label}
              trailing={
                option.type === type ? (
                  <Icon name="check" size={20} color={colors.accent.text} />
                ) : null
              }
              accessibilityLabel={option.label}
              onPress={() => {
                onChange(option.type);
                setOpen(false);
              }}
            />
          ))}
        </ListGroup>
      </Sheet>
    </>
  );
}
