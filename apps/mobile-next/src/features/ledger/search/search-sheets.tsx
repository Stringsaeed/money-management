import { SEARCH_DATE_OPTIONS } from "./search-model";
import { SearchOptionSheet } from "./search-option-sheet";
import type { LedgerSearchModel } from "./use-ledger-search";

interface SearchSheetsProps {
  readonly search: LedgerSearchModel;
}

const ALL = "all";
const byName = (a: { readonly name: string }, b: { readonly name: string }) =>
  a.name.localeCompare(b.name);

/** The pickers behind the date, account and category chips; at most one is open. */
export function SearchSheets({ search }: SearchSheetsProps) {
  const { state } = search;
  return (
    <>
      <SearchOptionSheet
        onDismiss={search.closeSheet}
        onSelect={(key) => {
          const option = SEARCH_DATE_OPTIONS.find((item) => item.option === key);
          if (option) search.update({ date: option.option });
        }}
        open={search.sheet === "date"}
        options={SEARCH_DATE_OPTIONS.map(({ option, label }) => ({
          key: option,
          label,
          icon: "calendar",
        }))}
        selected={state.date}
        title="When"
      />
      <SearchOptionSheet
        onDismiss={search.closeSheet}
        onSelect={(key) => search.update({ accountId: key === ALL ? null : key })}
        open={search.sheet === "account"}
        options={[
          { key: ALL, label: "All accounts", icon: "bank" },
          ...[...search.accounts].sort(byName).map((account) => ({
            key: account.id,
            label: account.name,
            icon: "accounts" as const,
          })),
        ]}
        selected={state.accountId ?? ALL}
        title="Account"
      />
      <SearchOptionSheet
        onDismiss={search.closeSheet}
        onSelect={(key) => search.update({ categoryId: key === ALL ? null : key })}
        open={search.sheet === "category"}
        options={[
          { key: ALL, label: "All categories", icon: "category" },
          // Copied before sorting: Hermes on Android lacks Array#toSorted.
          ...[...search.categories]
            .sort((a, b) => a.kind.localeCompare(b.kind) || byName(a, b))
            .map((category) => ({
              key: category.id,
              label: category.name,
              emoji: category.icon || undefined,
              icon: "category" as const,
            })),
        ]}
        selected={state.categoryId ?? ALL}
        title="Category"
      />
    </>
  );
}
