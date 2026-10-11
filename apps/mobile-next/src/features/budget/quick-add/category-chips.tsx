import type { V2Category } from "@trove/api/v2/contracts";

import { Chip } from "@/ui/trove";

import { ChipRow } from "./chip-row";

interface CategoryChipsProps {
  readonly categories: readonly V2Category[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}

/** Only for an envelope that maps to several Categories; one Category needs no question. */
export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  if (categories.length < 2) return null;
  return (
    <ChipRow label="Category">
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          selected={category.id === selectedId}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </ChipRow>
  );
}
