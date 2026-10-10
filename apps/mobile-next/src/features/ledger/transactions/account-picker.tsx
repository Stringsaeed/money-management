import { useState } from "react";
import type { V2Account } from "@trove/api/v2/contracts";

import { colors, EmptyState, Icon, ListGroup, ListRow, Sheet } from "@/ui/trove";

import { BreadcrumbSegment } from "./breadcrumb-segment";
import { afterSheetCloses } from "./transaction-create-actions";

interface AccountPickerProps {
  readonly title: string;
  readonly placeholder: string;
  readonly emoji: string;
  readonly accounts: readonly V2Account[];
  readonly selectedId: string | null;
  readonly onChange: (id: string) => void;
  readonly emptyMessage: string;
  readonly onCreateAccount?: () => void;
}

export function AccountPicker({
  title,
  placeholder,
  emoji,
  accounts,
  selectedId,
  onChange,
  emptyMessage,
  onCreateAccount,
}: AccountPickerProps) {
  const [open, setOpen] = useState(false);
  const createAccount = onCreateAccount
    ? () => {
        setOpen(false);
        afterSheetCloses(onCreateAccount);
      }
    : undefined;
  const selected = accounts.find((item) => item.id === selectedId);

  return (
    <>
      <BreadcrumbSegment
        accessibilityLabel={`${title}: ${selected?.name ?? "not selected"}`}
        emoji={emoji}
        label={selected?.name ?? placeholder}
        active={Boolean(selected)}
        onPress={() => setOpen(true)}
      />
      <Sheet open={open} onDismiss={() => setOpen(false)} title={title}>
        {accounts.length === 0 ? (
          <EmptyState
            actionLabel={createAccount ? "Add account" : undefined}
            framed={false}
            icon="bank"
            message={emptyMessage}
            onAction={createAccount}
            title="No accounts to pick"
          />
        ) : (
          <ListGroup>
            {accounts.map((account) => (
              <ListRow
                key={account.id}
                accessibilityLabel={account.name}
                icon="bank"
                onPress={() => {
                  onChange(account.id);
                  setOpen(false);
                }}
                subtitle={account.currency}
                title={account.name}
                trailing={
                  account.id === selectedId ? (
                    <Icon color={colors.accent.text} name="check" size={20} />
                  ) : null
                }
              />
            ))}
          </ListGroup>
        )}
      </Sheet>
    </>
  );
}
