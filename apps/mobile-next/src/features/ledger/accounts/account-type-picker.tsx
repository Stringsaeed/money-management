import type { AccountType } from "@/data/ledger-client";
import { CategoryTile, Icon, colors, ListGroup, ListRow, Sheet } from "@/ui/trove";

import { ACCOUNT_TYPE_OPTIONS } from "./account-display";

interface AccountTypePickerProps {
  readonly open: boolean;
  readonly type: AccountType;
  readonly onChange: (type: AccountType) => void;
  readonly onDismiss: () => void;
}

/** Account-type sheet, opened from the editor's breadcrumb. */
export function AccountTypePicker({ open, type, onChange, onDismiss }: AccountTypePickerProps) {
  return (
    <Sheet open={open} onDismiss={onDismiss} title="Account type">
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
              onDismiss();
            }}
          />
        ))}
      </ListGroup>
    </Sheet>
  );
}
