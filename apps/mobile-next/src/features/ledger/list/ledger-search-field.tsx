import { SearchField } from "@/ui/trove";

import { useSearchDraft } from "./use-search-draft";

interface LedgerSearchFieldProps {
  readonly value: string;
  readonly onSubmit: (value: string) => void;
  readonly placeholder?: string;
}

/** Trove search field that queries the server on submit, for the filter sheet. */
export function LedgerSearchField({
  value,
  onSubmit,
  placeholder = "Search notes",
}: LedgerSearchFieldProps) {
  const search = useSearchDraft(value, onSubmit);
  return (
    <SearchField
      accessibilityLabel="Search transactions"
      onChangeText={search.change}
      onSubmitEditing={search.submit}
      placeholder={placeholder}
      value={search.draft}
    />
  );
}
