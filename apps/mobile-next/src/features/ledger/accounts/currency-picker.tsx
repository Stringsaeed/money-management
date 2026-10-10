import { useState } from "react";

import { Icon, colors, ListGroup, ListRow, Sheet, Text } from "@/ui/trove";

import { BreadcrumbSegment } from "../transactions/breadcrumb-segment";
import { currencyOptionsFor } from "./account-display";
import { CurrencyBadge } from "./currency-badge";

interface CurrencyPickerProps {
  readonly currency: string;
  readonly onChange: (currency: string) => void;
}

export function CurrencyPicker({ currency, onChange }: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <BreadcrumbSegment
        accessibilityLabel={`Currency: ${currency}`}
        emoji="💱"
        label={currency}
        onPress={() => setOpen(true)}
      />
      <Sheet open={open} onDismiss={() => setOpen(false)} title="Currency">
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
                setOpen(false);
              }}
            />
          ))}
        </ListGroup>
      </Sheet>
    </>
  );
}
