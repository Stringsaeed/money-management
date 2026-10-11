import { ListGroup, ListRow, Sheet, type IconName } from "@/ui/trove";

export type CreateAction = "transaction" | "account" | "category";

interface CreateActionSheetProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
  readonly onSelect: (action: CreateAction) => void;
}

const ACTIONS = [
  { action: "transaction", icon: "receipt", label: "Transaction" },
  { action: "account", icon: "accounts", label: "Account" },
  { action: "category", icon: "category", label: "Category" },
] as const satisfies readonly { action: CreateAction; icon: IconName; label: string }[];

export function CreateActionSheet({ open, onDismiss, onSelect }: CreateActionSheetProps) {
  return (
    <Sheet
      open={open}
      onDismiss={onDismiss}
      snapPoints={["half"]}
      testID="create-action-sheet"
      title="Create"
    >
      <ListGroup>
        {ACTIONS.map(({ action, icon, label }) => (
          <ListRow
            key={action}
            chevron
            icon={icon}
            onPress={() => onSelect(action)}
            title={label}
          />
        ))}
      </ListGroup>
    </Sheet>
  );
}
