import { useState } from "react";

/**
 * Search typed locally and sent on submit, so the server is queried once per search rather
 * than on every keystroke. Clearing applies immediately.
 */
export function useSearchDraft(value: string, onSubmit: (value: string) => void) {
  const [draft, setDraft] = useState(value);
  const [applied, setApplied] = useState(value);
  // Follow external changes, e.g. the search chip being removed.
  if (value !== applied) {
    setApplied(value);
    setDraft(value);
  }
  return {
    draft,
    change: (text: string) => {
      setDraft(text);
      if (text === "" && value !== "") onSubmit("");
    },
    submit: () => onSubmit(draft.trim()),
  };
}
