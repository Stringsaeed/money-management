import { useState } from "react";

import { SearchField } from "@/ui/trove";

interface LedgerSearchFieldProps {
  readonly value: string;
  readonly onSubmit: (value: string) => void;
  readonly placeholder?: string;
}

/**
 * Search typed locally and sent on submit, so the server is queried once per search rather
 * than on every keystroke. Clearing applies immediately.
 */
export function LedgerSearchField({
  value,
  onSubmit,
  placeholder = "Search notes",
}: LedgerSearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const [applied, setApplied] = useState(value);
  // Follow external changes, e.g. the search chip being removed.
  if (value !== applied) {
    setApplied(value);
    setDraft(value);
  }
  return (
    <SearchField
      accessibilityLabel="Search transactions"
      onChangeText={(text) => {
        setDraft(text);
        if (text === "" && value !== "") onSubmit("");
      }}
      onSubmitEditing={() => onSubmit(draft.trim())}
      placeholder={placeholder}
      value={draft}
    />
  );
}
