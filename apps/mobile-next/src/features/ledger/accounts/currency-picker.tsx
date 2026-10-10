import { CurrencyBadge, Icon, colors, ListGroup, ListRow, Sheet, Text } from "@/ui/trove";

import { currencyOptionsFor } from "./account-display";

interface CurrencyPickerProps {
  readonly open: boolean;
  readonly currency: string;
  readonly onChange: (currency: string) => void;
  readonly onDismiss: () => void;
}

/** Currency sheet, opened from the editor's breadcrumb. */
export function CurrencyPicker({ open, currency, onChange, onDismiss }: CurrencyPickerProps) {
  return (
    <Sheet open={open} onDismiss={onDismiss} title="Currency">
      <Text tone="secondary" variant="bodySm">
        Balances and every transaction in this account use this currency.
      </Text>
      <ListGroup dividerInset={68}>
        {currencyOptionsFor(currency).map((option) => (
          <ListRow
            key={option.code}
            leading={<CurrencyBadge code={option.code} />}
            title={option.name}
            subtitle={option.code}
            trailing={
              option.code === currency ? (
                <Icon name="check" size={20} color={colors.accent.text} />
              ) : null
            }
            accessibilityLabel={`${option.name} (${option.code})`}
            onPress={() => {
              onChange(option.code);
              onDismiss();
            }}
          />
        ))}
      </ListGroup>
    </Sheet>
  );
}
