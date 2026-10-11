import type { V2Account } from "@trove/api/v2/contracts";

import { Chip } from "@/ui/trove";

import { ChipRow } from "./chip-row";

interface PaidWithChipsProps {
  readonly funding: readonly V2Account[];
  readonly cards: readonly V2Account[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** Opens the account editor; shown only while the person has no credit-card account. */
  readonly onAddCard: () => void;
}

/** Money accounts and credit cards the spending can come from. */
export function PaidWithChips({
  funding,
  cards,
  selectedId,
  onSelect,
  onAddCard,
}: PaidWithChipsProps) {
  return (
    <ChipRow label="Paid with">
      {[...funding, ...cards].map((account) => (
        <Chip
          key={account.id}
          label={account.name}
          selected={account.id === selectedId}
          onPress={() => onSelect(account.id)}
        />
      ))}
      {cards.length === 0 ? <Chip label="Add card" onPress={onAddCard} /> : null}
    </ChipRow>
  );
}
